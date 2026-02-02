import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Database = Tables<"databases">;
type DatabaseInsert = TablesInsert<"databases">;

export const useDatabases = (siteId?: string) => {
  return useQuery({
    queryKey: ["databases", siteId],
    queryFn: async () => {
      let query = supabase
        .from("databases")
        .select("*")
        .order("created_at", { ascending: false });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Database[];
    },
  });
};

export const useCreateDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (database: DatabaseInsert) => {
      const { data, error } = await supabase
        .from("databases")
        .insert(database)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
  });
};

export const useDeleteDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("databases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
  });
};
