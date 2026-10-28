import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Form = {
  website_tagline: string;
  company_phone: string;
  company_email_primary: string;
  logo_url: string;
  primary_color: string;
};

const EMPTY: Form = { website_tagline: "", company_phone: "", company_email_primary: "", logo_url: "", primary_color: "" };

const GeneralSettings = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return setLoading(false);
    supabase
      .from("companies")
      .select("name, website_tagline, company_phone, company_email_primary, logo_url, primary_color")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setForm({
            website_tagline: data.website_tagline || "",
            company_phone: data.company_phone || "",
            company_email_primary: data.company_email_primary || "",
            logo_url: data.logo_url || "",
            primary_color: data.primary_color || "",
          });
        }
        setLoading(false);
      });
  }, [companyId]);

  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        website_tagline: form.website_tagline.trim() || null,
        company_phone: form.company_phone.trim() || null,
        company_email_primary: form.company_email_primary.trim() || null,
        logo_url: form.logo_url.trim() || null,
        primary_color: form.primary_color.trim() || null,
      })
      .eq("id", companyId);
    setSaving(false);
    if (error) return toast.error("Failed to save general settings");
    toast.success("General settings saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General</h1>
        <p className="text-muted-foreground">Basic website details for {name || "this company"}.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <p className="font-medium py-2">{name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={form.website_tagline} onChange={(e) => set("website_tagline", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Main Phone</Label>
              <Input id="phone" value={form.company_phone} onChange={(e) => set("company_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Main Email</Label>
              <Input id="email" type="email" value={form.company_email_primary} onChange={(e) => set("company_email_primary", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Brand Color</Label>
              <Input id="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} placeholder="#0ea5e9" className="font-mono" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save General
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
