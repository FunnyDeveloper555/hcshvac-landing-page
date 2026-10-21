import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePendingSubmissions() {
  return useQuery({
    queryKey: ["crm-pending-submissions"],
    refetchInterval: 5000,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("crm_pending_submissions");
      if (error) throw error;
      return (data || []).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
    },
  });
}