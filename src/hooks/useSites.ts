import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Site = Tables<"sites">;
type SiteInsert = TablesInsert<"sites">;

export const useSites = () => {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Site[];
    },
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (site: SiteInsert) => {
      const { data, error } = await supabase
        .from("sites")
        .insert(site)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Site> & { id: string }) => {
      const { data, error } = await supabase
        .from("sites")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};
