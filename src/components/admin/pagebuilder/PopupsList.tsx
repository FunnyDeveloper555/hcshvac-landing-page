import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Plus, Pencil, Trash2, AlertTriangle, Megaphone } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PopupForm {
  popup_type: string;
  title: string;
  message: string;
  button_text: string;
  button_url: string;
  bg_color: string;
  text_color: string;
  is_active: boolean;
}

const defaultForm: PopupForm = {
  popup_type: "promotional",
  title: "",
  message: "",
  button_text: "Got it",
  button_url: "",
  bg_color: "",
  text_color: "",
  is_active: true,
};

export default function PopupsList() {
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PopupForm>(defaultForm);

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ["company-popups", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_popups")
        .select("*")
        .eq("company_id", companyId!)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: PopupForm) => {
      const payload = {
        ...formData,
        company_id: companyId!,
        bg_color: formData.bg_color || null,
        text_color: formData.text_color || null,
        button_url: formData.button_url || null,
      };
      if (editingId) {
        const { error } = await supabase.from("company_popups").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_popups").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] });
      toast({ title: editingId ? "Popup updated" : "Popup created" });
      logAction(editingId ? "update" : "create", "company_popup", editingId || undefined, { title: form.title });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] });
      toast({ title: "Popup deleted" });
      logAction("delete", "company_popup", id);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("company_popups").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const openEdit = (popup: any) => {
    setEditingId(popup.id);
    setForm({
      popup_type: popup.popup_type,
      title: popup.title,
      message: popup.message,
      button_text: popup.button_text || "Got it",
      button_url: popup.button_url || "",
      bg_color: popup.bg_color || "",
      text_color: popup.text_color || "",
      is_active: popup.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Popup Alerts</h2>
          <p className="text-sm text-muted-foreground">Manage promotional and emergency popup alerts for the company website.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm(defaultForm); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Popup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Popup" : "Create Popup"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.popup_type} onValueChange={(v) => setForm({ ...form, popup_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="emergency">Emergency / Service Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Button URL (optional)</Label>
                  <Input value={form.button_url} onChange={(e) => setForm({ ...form, button_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background Color (optional)</Label>
                  <Input type="color" value={form.bg_color || "#ffffff"} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Text Color (optional)</Label>
                  <Input type="color" value={form.text_color || "#000000"} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : popups.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No popups configured yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {popups.map((popup: any) => (
            <Card key={popup.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="shrink-0">
                  {popup.popup_type === "emergency" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Megaphone className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{popup.title}</span>
                    <Badge variant={popup.popup_type === "emergency" ? "destructive" : "secondary"}>
                      {popup.popup_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{popup.message}</p>
                </div>
                <Switch
                  checked={popup.is_active}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: popup.id, is_active: v })}
                />
                <Button size="icon" variant="ghost" onClick={() => openEdit(popup)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete popup?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(popup.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
