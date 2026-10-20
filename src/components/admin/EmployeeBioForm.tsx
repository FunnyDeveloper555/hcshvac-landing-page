import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Checkbox } from "@/components/ui/checkbox";

type Emergency = { first_name: string; last_name: string; relationship: string; phone: string; alt_phone: string; email: string; address: string };
const blankEc = (): Emergency => ({ first_name: "", last_name: "", relationship: "", phone: "", alt_phone: "", email: "", address: "" });

const empty = {
  first_name: "", last_name: "", address: "", city: "", state: "", zip_code: "",
  email_address: "", phone_number: "", sms_text_pager: "", sms_email_pager: "",
  job_title: "", department: "", hire_date: "", employment_status: "active",
  certificates_held: "", licenses_held: "", bio_notes: "", company_id: "",
  employee_id_number: "", truck_number: "", assigned_tools: "", photo_path: "",
};

export function EmployeeBioForm() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const navigate = useNavigate();
  const { logAction } = useAdminLog();
  const [f, setF] = useState<Record<string, string>>(empty);
  const [ecs, setEcs] = useState<Emergency[]>([blankEc()]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [activeCos, setActiveCos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const loadPhoto = async (path: string) => {
    if (!path) return setPhotoUrl("");
    const { data } = await supabase.storage.from("employee-files").createSignedUrl(path, 3600);
    setPhotoUrl(data?.signedUrl || "");
  };
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const path = `photos/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("employee-files").upload(path, file);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setF((prev) => ({ ...prev, photo_path: path }));
    loadPhoto(path);
  };

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
    if (!id) return;
    supabase.from("employees").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) {
        const d: any = data;
        const next: Record<string, string> = {};
        Object.keys(empty).forEach((k) => (next[k] = d[k] ?? (empty as any)[k]));
        setF(next);
        const list = Array.isArray(d.emergency_contacts) ? d.emergency_contacts : [];
        setActiveCos(Array.isArray(d.active_company_ids) ? d.active_company_ids : []);
        if (d.photo_path) loadPhoto(d.photo_path);
        setEcs(list.length ? list.map((e: any) => ({ ...blankEc(), ...(e || {}) })) : [blankEc()]);
      }
      setLoading(false);
    });
  }, [id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const field = (k: string, label: string, type = "text", req = false) => (
    <div className="space-y-1">
      <Label>{label}{req && " *"}</Label>
      <Input type={type} value={f[k] || ""} onChange={set(k)} />
    </div>
  );

  const save = async () => {
    const req = ["first_name", "last_name", "address", "city", "state", "zip_code", "email_address", "phone_number"];
    if (req.some((k) => !f[k]?.trim())) { toast.error("Please fill all required fields on the Bio & Contact tab"); return; }
    setSaving(true);
    const payload: any = {
      ...f,
      company_id: f.company_id || null,
      hire_date: f.hire_date || null,
      active_company_ids: activeCos,
      emergency_contacts: ecs.filter((e) => e.first_name || e.last_name || e.phone),
    };
    const res = id
      ? await supabase.from("employees").update(payload).eq("id", id).select("id").single()
      : await supabase.from("employees").insert(payload).select("id").single();
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    logAction(id ? "update" : "create", "employee", res.data.id, { employee_name: `${f.first_name} ${f.last_name}` });
    toast.success("Employee saved");
    navigate("/admin/employees/list");
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{id ? "Edit Employee" : "Add Employee"}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/employees/application${id ? `?id=${id}` : ""}`)}>
          Application / hiring file
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bio">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="bio">Bio & Contact</TabsTrigger>
            <TabsTrigger value="active">Active Employee</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
            <TabsTrigger value="certs">Certifications & Licenses</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="bio" className="grid gap-4 sm:grid-cols-2 pt-4">
            {field("first_name", "First Name", "text", true)}
            {field("last_name", "Last Name", "text", true)}
            <div className="sm:col-span-2">{field("address", "Address", "text", true)}</div>
            {field("city", "City", "text", true)}
            <div className="grid grid-cols-2 gap-4">{field("state", "State", "text", true)}{field("zip_code", "Zip", "text", true)}</div>
            {field("email_address", "Email", "email", true)}
            {field("phone_number", "Phone", "tel", true)}
            {field("sms_text_pager", "SMS Text Pager (number)", "tel")}
            {field("sms_email_pager", "SMS Email Pager (address)", "email")}
          </TabsContent>

          <TabsContent value="active" className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-md border bg-muted overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                {photoUrl ? <img src={photoUrl} alt="Employee" className="h-full w-full object-cover" /> : "No photo"}
              </div>
              <div className="space-y-1">
                <Label>Employee Photo</Label>
                <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("employee_id_number", "Employee ID Number")}
              {field("truck_number", "Assigned Truck Number")}
              {field("phone_number", "Contact Phone", "tel", true)}
              {field("email_address", "Employee Email Address", "email", true)}
            <div className="space-y-1">
              <Label>Home Company</Label>
              <Select value={f.company_id || ""} onValueChange={(v) => setF({ ...f, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={f.employment_status || "active"} onValueChange={(v) => setF({ ...f, employment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive (Archive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field("job_title", "Job Title")}
            {field("department", "Department")}
            {field("hire_date", "Hire Date", "date")}
            </div>
            <div className="space-y-2">
              <Label>Active to work for</Label>
              <div className="grid gap-2 sm:grid-cols-3 rounded-md border p-3">
                {companies.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={activeCos.includes(c.id)} onCheckedChange={(v) => setActiveCos(v ? [...activeCos, c.id] : activeCos.filter((x) => x !== c.id))} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label>Assigned Tools</Label><Textarea rows={4} value={f.assigned_tools || ""} onChange={set("assigned_tools")} placeholder="One tool per line" /></div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 pt-4">
            {ecs.map((ec, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2 rounded-md border p-4">
                {(["first_name", "last_name", "relationship", "phone", "alt_phone", "email", "address"] as (keyof Emergency)[]).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label className="capitalize">{k.replace("_", " ")}</Label>
                    <Input value={ec[k]} onChange={(e) => setEcs(ecs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
                  </div>
                ))}
                {ecs.length > 1 && (
                  <Button variant="ghost" size="sm" className="self-end text-destructive" onClick={() => setEcs(ecs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setEcs([...ecs, blankEc()])}><Plus className="h-4 w-4 mr-1" /> Add another</Button>
          </TabsContent>


          <TabsContent value="certs" className="grid gap-4 pt-4">
            <div className="space-y-1"><Label>Certifications</Label><Textarea rows={4} value={f.certificates_held || ""} onChange={set("certificates_held")} /></div>
            <div className="space-y-1"><Label>Licenses</Label><Textarea rows={4} value={f.licenses_held || ""} onChange={set("licenses_held")} /></div>
          </TabsContent>

          <TabsContent value="notes" className="pt-4">
            <Textarea rows={6} value={f.bio_notes || ""} onChange={set("bio_notes")} placeholder="Internal notes about this employee" />
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => navigate("/admin/employees/list")}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Employee</Button>
        </div>
      </CardContent>
    </Card>
  );
}
