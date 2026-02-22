import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Globe, Copy, CheckCircle2, AlertCircle, Clock, RefreshCw, Zap, ShieldCheck, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface CompanyDomain {
  id: string;
  company_id: string;
  domain_name: string;
  subdomain: string | null;
  record_type: string;
  target_ip: string;
  txt_verify_value: string | null;
  status: string;
  ssl_status: string;
  verified_at: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2; progress: number }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock, progress: 10 },
  verifying: { label: "Verifying DNS", variant: "secondary", icon: RefreshCw, progress: 30 },
  dns_verified: { label: "DNS Verified", variant: "secondary", icon: CheckCircle2, progress: 60 },
  active: { label: "Active", variant: "default", icon: CheckCircle2, progress: 100 },
  failed: { label: "Failed", variant: "destructive", icon: AlertCircle, progress: 0 },
  offline: { label: "Offline", variant: "destructive", icon: AlertCircle, progress: 0 },
};

const LIFECYCLE_STEPS = [
  { key: "dns", label: "DNS Propagation", icon: Globe, statuses: ["pending", "verifying"] },
  { key: "verify", label: "Verification", icon: ShieldCheck, statuses: ["dns_verified"] },
  { key: "ssl", label: "SSL Certificate", icon: ShieldCheck, statuses: ["dns_verified"] },
  { key: "deploy", label: "Deployment", icon: Rocket, statuses: ["active"] },
];

export default function DomainSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [addWww, setAddWww] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: company } = useQuery({
    queryKey: ["domain-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["company-domains", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_domains")
        .select("*")
        .eq("company_id", companyId!)
        .order("is_primary", { ascending: false })
        .order("created_at");
      if (error) throw error;
      return data as CompanyDomain[];
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Auto-refresh every 30s to show status changes
  });

  const addDomain = useMutation({
    mutationFn: async () => {
      const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      if (!domain) throw new Error("Domain name is required");

      const verifyValue = `lovable_verify=${crypto.randomUUID().slice(0, 12)}`;
      const isPrimary = domains.length === 0;

      const entries = [
        {
          company_id: companyId!,
          domain_name: domain,
          record_type: "A",
          target_ip: "185.158.133.1",
          txt_verify_value: verifyValue,
          is_primary: isPrimary,
        },
      ];

      if (addWww && !domain.startsWith("www.")) {
        entries.push({
          company_id: companyId!,
          domain_name: `www.${domain}`,
          record_type: "A",
          target_ip: "185.158.133.1",
          txt_verify_value: verifyValue,
          is_primary: false,
        });
      }

      const { error } = await supabase.from("company_domains").insert(entries);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-domains", companyId] });
      setNewDomain("");
      setAddOpen(false);
      toast({ title: "Domain added", description: "DNS verification will begin automatically." });
      // Trigger immediate check
      triggerVerification.mutate(undefined);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-domains", companyId] });
      toast({ title: "Domain removed" });
    },
  });

  const setPrimary = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("company_domains").update({ is_primary: false }).eq("company_id", companyId!);
      const { error } = await supabase.from("company_domains").update({ is_primary: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-domains", companyId] });
      toast({ title: "Primary domain updated" });
    },
  });

  const triggerVerification = useMutation({
    mutationFn: async (domainId: string | undefined = undefined) => {
      const { data, error } = await supabase.functions.invoke("check-domain-dns", {
        body: domainId ? { domain_id: domainId } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["company-domains", companyId] });
      const checked = data?.checked || 0;
      toast({
        title: "Verification complete",
        description: `Checked ${checked} domain(s). Statuses updated.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const statusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === "verifying" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  const getLifecycleStep = (status: string) => {
    if (status === "active") return 4;
    if (status === "dns_verified") return 2;
    if (status === "verifying") return 1;
    if (status === "pending") return 0;
    return -1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Domain Settings</h2>
          <p className="text-muted-foreground">
            {company?.name ? `Manage custom domains for ${company.name}` : "Manage custom domains"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => triggerVerification.mutate(undefined)}
            disabled={triggerVerification.isPending || domains.length === 0}
          >
            {triggerVerification.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Verify All
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your root domain without http:// or www.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={addWww} onCheckedChange={setAddWww} id="add-www" />
                  <Label htmlFor="add-www">Also add www.{newDomain || "example.com"}</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={() => addDomain.mutate()} disabled={addDomain.isPending || !newDomain.trim()}>
                  {addDomain.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Domain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Automation Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automated Domain Lifecycle
          </CardTitle>
          <CardDescription>
            Domains are verified automatically. DNS propagation is checked periodically and SSL certificates are provisioned once DNS is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {LIFECYCLE_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <step.icon className="h-3.5 w-3.5" />
                <span>{step.label}</span>
                {i < LIFECYCLE_STEPS.length - 1 && <span className="text-muted-foreground/50 mx-1">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DNS Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            DNS Configuration Instructions
          </CardTitle>
          <CardDescription>
            Add these records at your domain registrar. Verification happens automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h4 className="font-semibold text-sm mb-2">A Record (Root Domain)</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <strong>A</strong></div>
                <div><span className="text-muted-foreground">Name:</span> <strong>@</strong></div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Value:</span> <strong>185.158.133.1</strong>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("185.158.133.1", "a-root")}>
                    {copiedField === "a-root" ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border">
              <h4 className="font-semibold text-sm mb-2">A Record (www Subdomain)</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <strong>A</strong></div>
                <div><span className="text-muted-foreground">Name:</span> <strong>www</strong></div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Value:</span> <strong>185.158.133.1</strong>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("185.158.133.1", "a-www")}>
                    {copiedField === "a-www" ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {domains.length > 0 && domains[0].txt_verify_value && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-sm mb-2">TXT Record (Verification)</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Type:</span> <strong>TXT</strong></div>
                  <div><span className="text-muted-foreground">Name:</span> <strong>_lovable</strong></div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Value:</span>
                    <strong className="text-xs break-all">{domains[0].txt_verify_value}</strong>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(domains[0].txt_verify_value!, "txt")}>
                      {copiedField === "txt" ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            DNS changes can take up to 72 hours to propagate. Use{" "}
            <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="underline text-primary">
              DNSChecker.org
            </a>{" "}
            to verify manually.
          </p>
        </CardContent>
      </Card>

      {/* Domain List */}
      {domains.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Domains Connected</h3>
            <p className="text-muted-foreground text-sm">Add a custom domain to start the automated connection flow.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => {
            const stepIndex = getLifecycleStep(domain.status);
            const config = STATUS_CONFIG[domain.status] || STATUS_CONFIG.pending;
            return (
              <Card key={domain.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{domain.domain_name}</span>
                          {domain.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Record: {domain.record_type}</span>
                          <span>→</span>
                          <span>{domain.target_ip}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        {statusBadge(domain.status)}
                        {domain.ssl_status === "active" && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> SSL Active
                          </span>
                        )}
                        {domain.ssl_status === "provisioning" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> SSL Provisioning
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {domain.status !== "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerVerification.mutate(domain.id)}
                            disabled={triggerVerification.isPending}
                            title="Verify now"
                          >
                            {triggerVerification.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {!domain.is_primary && (
                          <Button variant="ghost" size="sm" onClick={() => setPrimary.mutate(domain.id)} title="Set as primary">
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDomain.mutate(domain.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Progress */}
                  <div className="space-y-2">
                    <Progress value={config.progress} className="h-2" />
                    <div className="flex justify-between">
                      {LIFECYCLE_STEPS.map((step, i) => {
                        const isComplete = stepIndex > i || (stepIndex === i && domain.status === "active");
                        const isCurrent = stepIndex === i && domain.status !== "active";
                        return (
                          <div
                            key={step.key}
                            className={`flex items-center gap-1 text-xs ${
                              isComplete ? "text-primary font-medium" : isCurrent ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isCurrent ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <step.icon className="h-3 w-3" />
                            )}
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {domain.verified_at && (
                    <p className="text-xs text-muted-foreground">
                      Verified: {new Date(domain.verified_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
