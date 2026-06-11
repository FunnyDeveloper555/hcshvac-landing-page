import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DiagnosticFeesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["diagnostic-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_fees" as any)
        .select("*, companies(name)")
        .order("visit_type");
      if (error) throw error;
      return data as any[];
    },
    staleTime: 30000,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diagnostic_fees" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["diagnostic-fees"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Diagnostic Fees</h2>
        <Button onClick={() => navigate("/admin/diagnostic-fees/add")}>
          <Plus className="w-4 h-4 mr-2" /> Add Fee
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Fee Matrix (Company × Visit Type)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Waivable</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.companies?.name || <span className="text-muted-foreground italic">All companies</span>}</TableCell>
                    <TableCell>{r.visit_type}</TableCell>
                    <TableCell>${Number(r.fee_amount).toFixed(2)}</TableCell>
                    <TableCell>{r.is_waivable ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                    <TableCell>{r.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/diagnostic-fees/add?id=${r.id}`)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this fee?")) del.mutate(r.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows?.length && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No fees configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
