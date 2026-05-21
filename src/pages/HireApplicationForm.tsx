import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";

const formatPhone = (input: string): string => {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, "Phone must be 111-111-1111"),
  address_street: z.string().trim().max(200).optional().or(z.literal("")),
  address_city: z.string().trim().max(100).optional().or(z.literal("")),
  address_state: z.string().trim().max(50).optional().or(z.literal("")),
  address_zip: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export default function HireApplicationForm() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const { data: rows } = await supabase
        .rpc("get_hire_invitation_by_token", { _token: token });
      const inv = Array.isArray(rows) ? rows[0] : rows;

      if (!inv) {
        setLoading(false);
        return;
      }
      setInvitation(inv);

      if (inv.company_id) {
        const { data: c } = await supabase
          .from("companies")
          .select("name")
          .eq("id", inv.company_id)
          .maybeSingle();
        if (c?.name) setCompanyName(c.name);
      }

      if (!inv.opened_at) {
        await supabase.rpc("mark_hire_invitation_opened", { _token: token });
      }

      setForm((f) => ({
        ...f,
        first_name: inv.recipient_name?.split(" ")[0] || "",
        last_name: inv.recipient_name?.split(" ").slice(1).join(" ") || "",
        email: inv.recipient_email || "",
        phone: inv.recipient_phone ? formatPhone(inv.recipient_phone) : "",
      }));
      setLoading(false);
    };
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Please fix the form",
        description: parsed.error.issues[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }
    if (!invitation) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("hire_applications").insert({
        invitation_id: invitation.id,
        company_id: invitation.company_id,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address_street: parsed.data.address_street || null,
        address_city: parsed.data.address_city || null,
        address_state: parsed.data.address_state || null,
        address_zip: parsed.data.address_zip || null,
        notes: parsed.data.notes || null,
      });
      if (error) throw error;

      if (token) {
        await supabase.rpc("complete_hire_invitation", { _token: token });
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Invalid Link</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This application link is invalid or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Link Expired</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This application link has expired. Please contact the company for a new link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted || invitation.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Application Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for applying{companyName ? ` to ${companyName}` : ""}. We'll be in touch soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              New Hire Application
            </CardTitle>
            <CardDescription>
              {companyName ? `${companyName} — ` : ""}Please complete the form below to apply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input id="first_name" required value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input id="last_name" required value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" required placeholder="555-123-4567" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input id="street" value={form.address_street}
                    onChange={(e) => setForm({ ...form, address_street: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.address_city}
                      onChange={(e) => setForm({ ...form, address_city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={form.address_state}
                      onChange={(e) => setForm({ ...form, address_state: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" value={form.address_zip}
                      onChange={(e) => setForm({ ...form, address_zip: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea id="notes" rows={3} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
