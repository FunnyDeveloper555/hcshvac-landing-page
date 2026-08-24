import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMassPages } from "@/hooks/useMassPages";
import {
  LOCATION_TYPES,
  LocationType,
  VISIT_TYPES,
  VisitType,
  customService,
  enabledServices,
  massPagePath,
  massPageSummary,
  MassLocation,
} from "@/lib/massPages";

type SourceKind = "services" | "products";

export default function MassPagesBuilder() {
  const { companyId } = useParams<{ companyId: string }>();

  const [source, setSource] = useState<SourceKind>("services");
  const [item, setItem] = useState<string>("");
  const [visitType, setVisitType] = useState<VisitType | "">("");
  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [countyKey, setCountyKey] = useState<string>("");
  const [cityKeyValue, setCityKeyValue] = useState<string>("");

  const { data: company, isLoading } = useQuery({
    queryKey: ["mass-pages-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as Record<string, unknown> & { name: string; slug: string | null };
    },
    enabled: !!companyId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["mass-pages-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name")
        .in("status", ["active_showing", "active_not_showing"])
        .order("product_name")
        .limit(500);
      if (error) throw error;
      return (data || []).map((p) => ({ id: p.id, name: p.product_name }));
    },
  });

  const serviceAreas = (company?.service_areas as string[] | null) || null;
  const { groups, loading: areasLoading } = useMassPages(serviceAreas);

  const services = useMemo(() => (company ? enabledServices(company) : []), [company]);

  const options = source === "services" ? services.map((s) => s.label) : products.map((p) => p.name);

  const county = groups.find((g) => `${g.county}|${g.state}` === countyKey) || null;
  const location: MassLocation | null =
    county?.locations.find((l) => `${l.city}|${l.zip}` === cityKeyValue) || null;

  const service = item ? services.find((s) => s.label === item) || customService(item) : null;

  const path = service && location ? massPagePath(service, location, {
    visitType: visitType || null,
    locationType: locationType || null,
  }) : "";

  const summary = service && location ? massPageSummary(service.label, location, {
    visitType: visitType || null,
    locationType: locationType || null,
  }) : "";

  const liveUrl = company?.slug && path ? `https://${company.slug}.hcshvac.com${path}` : "";
  const previewUrl = path ? `/company/${company?.slug ?? ""}${path}` : "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!company) {
    return <p className="text-muted-foreground py-10 text-center">Company not found</p>;
  }

  const totalCities = groups.reduce((n, g) => n + g.locations.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mass Pages</h2>
        <p className="text-sm text-muted-foreground">
          Build a service &amp; location landing page for {company.name} — pick a service or product,
          the visit type, the property type and the area you serve.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. What is the page about?</CardTitle>
            <CardDescription>Choose from your services or your product catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              value={source}
              onValueChange={(v) => {
                setSource(v as SourceKind);
                setItem("");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="services" id="src-services" />
                <Label htmlFor="src-services">Services we offer</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="products" id="src-products" />
                <Label htmlFor="src-products">Products</Label>
              </div>
            </RadioGroup>

            <Select value={item} onValueChange={setItem}>
              <SelectTrigger>
                <SelectValue placeholder={source === "services" ? "Select a service" : "Select a product"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Visit type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={visitType}
              onValueChange={(v) => setVisitType(v as VisitType)}
              className="grid grid-cols-2 gap-2"
            >
              {VISIT_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`visit-${t}`} />
                  <Label htmlFor={`visit-${t}`}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. Location type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={locationType}
              onValueChange={(v) => setLocationType(v as LocationType)}
              className="grid grid-cols-2 gap-2"
            >
              {LOCATION_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`loc-${t}`} />
                  <Label htmlFor={`loc-${t}`}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. Area we service</CardTitle>
            <CardDescription>
              {areasLoading
                ? "Loading service areas…"
                : `${groups.length} counties · ${totalCities} cities`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">County</Label>
              <Select
                value={countyKey}
                onValueChange={(v) => {
                  setCountyKey(v);
                  setCityKeyValue("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a county" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {groups.map((g) => (
                    <SelectItem key={`${g.county}|${g.state}`} value={`${g.county}|${g.state}`}>
                      {g.county}, {g.state} ({g.locations.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City / ZIP</Label>
              <Select value={cityKeyValue} onValueChange={setCityKeyValue} disabled={!county}>
                <SelectTrigger>
                  <SelectValue placeholder={county ? "Select a city" : "Pick a county first"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(county?.locations || []).map((l) => (
                    <SelectItem key={`${l.city}|${l.zip}`} value={`${l.city}|${l.zip}`}>
                      {l.city}, {l.state}{l.zip ? ` ${l.zip}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Page summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold">{summary}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono text-xs break-all">
                  {liveUrl || previewUrl}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(liveUrl || previewUrl);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy URL
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    window.open(liveUrl || previewUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open page
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete the steps above to see the generated page (example: Furnace Repair, Emergency,
              Residential, Joliet, IL 60431).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
