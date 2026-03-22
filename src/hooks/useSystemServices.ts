import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database, Json } from "@/integrations/supabase/types";

type ServiceStatus = Database["public"]["Enums"]["service_runtime_status"];
type ServiceAction = Database["public"]["Enums"]["service_control_action"];

type ServiceRow = Database["public"]["Tables"]["system_services"]["Row"];
type ControlRunRow = Database["public"]["Tables"]["service_control_runs"]["Row"];
type PackageUpdateRow = Database["public"]["Tables"]["service_package_updates"]["Row"];
type JournalEntryRow = Database["public"]["Tables"]["service_journal_entries"]["Row"];
type MaintenanceActionRow = Database["public"]["Tables"]["service_maintenance_actions"]["Row"];

export interface ServiceDependency {
  name: string;
}

export interface ServiceResourceLimit {
  key: string;
  value: string;
}

export interface SystemService extends ServiceRow {
  dependencyItems: ServiceDependency[];
  limitItems: ServiceResourceLimit[];
  controlRuns: ControlRunRow[];
  packageUpdates: PackageUpdateRow[];
  journalEntries: JournalEntryRow[];
  maintenanceActions: MaintenanceActionRow[];
}

const normalizeDependencyGraph = (dependencyGraph: Json): ServiceDependency[] => {
  if (!Array.isArray(dependencyGraph)) return [];

  return dependencyGraph
    .map((item) => {
      if (typeof item === "string") {
        return { name: item };
      }

      if (item && typeof item === "object" && "name" in item && typeof item.name === "string") {
        return { name: item.name };
      }

      return null;
    })
    .filter((item): item is ServiceDependency => Boolean(item));
};

const normalizeResourceLimits = (resourceLimits: Json): ServiceResourceLimit[] => {
  if (!resourceLimits || typeof resourceLimits !== "object" || Array.isArray(resourceLimits)) return [];

  return Object.entries(resourceLimits).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
};

export function useSystemServices() {
  return useQuery({
    queryKey: ["system_services_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_services")
        .select(`
          *,
          service_control_runs(*),
          service_package_updates(*),
          service_journal_entries(*),
          service_maintenance_actions(*)
        `)
        .order("display_name", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as Array<
        ServiceRow & {
          service_control_runs?: ControlRunRow[] | null;
          service_package_updates?: PackageUpdateRow[] | null;
          service_journal_entries?: JournalEntryRow[] | null;
          service_maintenance_actions?: MaintenanceActionRow[] | null;
        }
      >;

      return rows.map((service) => ({
        ...service,
        dependencyItems: normalizeDependencyGraph(service.dependency_graph),
        limitItems: normalizeResourceLimits(service.resource_limits),
        controlRuns: [...(service.service_control_runs ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
        packageUpdates: [...(service.service_package_updates ?? [])].sort((a, b) => +new Date(b.available_at) - +new Date(a.available_at)),
        journalEntries: [...(service.service_journal_entries ?? [])].sort((a, b) => +new Date(b.logged_at) - +new Date(a.logged_at)),
        maintenanceActions: [...(service.service_maintenance_actions ?? [])].sort((a, b) => +new Date(a.next_run_at ?? a.created_at) - +new Date(b.next_run_at ?? b.created_at)),
      })) as SystemService[];
    },
  });
}

interface RunServiceActionInput {
  service: SystemService;
  action: ServiceAction;
}

const resolveStatusFromAction = (action: ServiceAction, currentStatus: ServiceStatus): ServiceStatus => {
  switch (action) {
    case "start":
      return "running";
    case "stop":
      return "stopped";
    case "restart":
      return "restarting";
    case "config_test":
    case "package_update":
    case "maintenance":
    default:
      return currentStatus;
  }
};

const actionLabels: Record<ServiceAction, string> = {
  start: "start",
  stop: "stop",
  restart: "restart",
  config_test: "config test",
  package_update: "package update",
  maintenance: "maintenance",
};

export function useRunServiceAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ service, action }: RunServiceActionInput) => {
      const targetStatus = resolveStatusFromAction(action, service.status);
      const configPassed = action === "config_test" ? Boolean(service.last_config_test_passed) : null;
      const output =
        action === "config_test"
          ? service.last_config_test_output ?? `Executed ${service.config_test_command ?? "validation command"}`
          : `Queued ${actionLabels[action]} for ${service.display_name}.`;

      const { error: runError } = await supabase.from("service_control_runs").insert({
        service_id: service.id,
        action,
        status: targetStatus,
        config_test_passed: configPassed,
        output,
      });

      if (runError) throw runError;

      const servicePatch: Database["public"]["Tables"]["system_services"]["Update"] = {
        status: targetStatus,
      };

      if (action === "config_test") {
        servicePatch.last_config_test_passed = configPassed;
        servicePatch.last_config_test_output = output;
      }

      const { error: updateError } = await supabase
        .from("system_services")
        .update(servicePatch)
        .eq("id", service.id);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system_services_dashboard"] });
      toast({
        title: "Service action queued",
        description: `${variables.service.display_name} ${actionLabels[variables.action]} logged successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message,
      });
    },
  });
}

interface ApplyPackageUpdateInput {
  service: SystemService;
  update: PackageUpdateRow;
}

export function useApplyPackageUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ service, update }: ApplyPackageUpdateInput) => {
      const appliedAt = new Date().toISOString();

      const { error: packageError } = await supabase
        .from("service_package_updates")
        .update({ status: "applied", applied_at: appliedAt })
        .eq("id", update.id);

      if (packageError) throw packageError;

      const { error: serviceError } = await supabase
        .from("system_services")
        .update({ version: update.target_version, updated_at: appliedAt })
        .eq("id", service.id);

      if (serviceError) throw serviceError;

      const { error: runError } = await supabase.from("service_control_runs").insert({
        service_id: service.id,
        action: "package_update",
        status: service.status,
        output: `Updated ${update.package_name} from ${update.current_version} to ${update.target_version}.`,
      });

      if (runError) throw runError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system_services_dashboard"] });
      toast({
        title: "Package update applied",
        description: `${variables.update.package_name} is now on ${variables.update.target_version}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });
}
