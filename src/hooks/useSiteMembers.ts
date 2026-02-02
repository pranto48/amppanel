import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type SiteMember = Tables<"site_members">;
type SiteMemberInsert = TablesInsert<"site_members">;

export interface SiteMemberWithEmail extends SiteMember {
  email?: string;
}

export const useSiteMembers = (siteId?: string) => {
  return useQuery({
    queryKey: ["site_members", siteId],
    queryFn: async () => {
      let query = supabase
        .from("site_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SiteMember[];
    },
  });
};

export const useAddSiteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: SiteMemberInsert) => {
      const { data, error } = await supabase
        .from("site_members")
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_members"] });
    },
  });
};

export const useUpdateSiteMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: SiteMember["role"] }) => {
      const { data, error } = await supabase
        .from("site_members")
        .update({ role })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_members"] });
    },
  });
};

export const useRemoveSiteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_members"] });
    },
  });
};
