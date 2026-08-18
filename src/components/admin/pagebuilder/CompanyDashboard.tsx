import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, MapPin, Wrench, Package, Droplet, FileText, MousePointer, Layout, Image, Eye, Layers, Search, Map } from "lucide-react";
import CompanySiteTemplateSelector from "./CompanySiteTemplateSelector";

export default function CompanyDashboard() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-dashboard", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: bannerCount = 0 } = useQuery({
    queryKey: ["company-banners-count", companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("company_banners")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: ctaCount = 0 } = useQuery({
    queryKey: ["company-cta-count", companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("cta_icons")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: imageCount = 0 } = useQuery({
    queryKey: ["company-images-count", companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("company_images")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
      </div>
    );
  }

  const serviceAreas = Array.isArray(company.service_areas) ? company.service_areas as string[] : [];
  const hvacBrandsInstall = Array.isArray(company.hvac_brands_install) ? company.hvac_brands_install as string[] : [];
  const hvacBrandsService = Array.isArray(company.hvac_brands_service) ? company.hvac_brands_service as string[] : [];
  const hvacBrandsRepair = Array.isArray(company.hvac_brands_repair) ? company.hvac_brands_repair as string[] : [];
  const plumbingInstall = Array.isArray(company.plumbing_equipment_install) ? company.plumbing_equipment_install as string[] : [];
  const plumbingService = Array.isArray(company.plumbing_equipment_service) ? company.plumbing_equipment_service as string[] : [];
  const plumbingRepair = Array.isArray(company.plumbing_equipment_repair) ? company.plumbing_equipment_repair as string[] : [];

  const basePath = `/admin/page-builder/company/${companyId}`;

  const quickLinks = [
    { label: "Website Preview", icon: Eye, path: `${basePath}/profile`, color: "bg-primary/10 text-primary" },
    { label: "Top Header", icon: Layout, path: `${basePath}/top-header`, color: "bg-accent/50 text-accent-foreground" },
    { label: "Banner", icon: Layout, path: `${basePath}/banner`, color: "bg-secondary/50 text-secondary-foreground" },
    { label: "Header Menus", icon: FileText, path: `${basePath}/header-menus`, color: "bg-primary/10 text-primary" },
    { label: "HVAC", icon: Wrench, path: `${basePath}/hvac`, color: "bg-accent/50 text-accent-foreground" },
    { label: "Plumbing", icon: Droplet, path: `${basePath}/plumbing`, color: "bg-secondary/50 text-secondary-foreground" },
    { label: "CTA Icons", icon: MousePointer, path: `${basePath}/cta-icons`, color: "bg-primary/10 text-primary" },
    { label: "Keywords", icon: Search, path: `${basePath}/hvac-keywords`, color: "bg-accent/50 text-accent-foreground" },
    { label: "Campaigns", icon: Layers, path: `${basePath}/campaigns`, color: "bg-secondary/50 text-secondary-foreground" },
    { label: "Images", icon: Image, path: `${basePath}/images-logos`, color: "bg-primary/10 text-primary" },
    { label: "Coupons", icon: FileText, path: `${basePath}/accordion-list/coupon`, color: "bg-accent/50 text-accent-foreground" },
    { label: "Local Business", icon: Map, path: `${basePath}/local-business`, color: "bg-secondary/50 text-secondary-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {company.logo_url && (
            <img src={company.logo_url} alt={company.name} className="h-12 w-12 object-contain rounded-lg border" />
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
            <p className="text-muted-foreground">Page Builder Dashboard</p>
          </div>
        </div>
        <Badge variant={company.is_active ? "default" : "secondary"}>
          {company.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{serviceAreas.length}</p>
                <p className="text-xs text-muted-foreground">Service Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{hvacBrandsInstall.length + hvacBrandsService.length + hvacBrandsRepair.length}</p>
                <p className="text-xs text-muted-foreground">HVAC Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Droplet className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{plumbingInstall.length + plumbingService.length + plumbingRepair.length}</p>
                <p className="text-xs text-muted-foreground">Plumbing Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{bannerCount}</p>
                <p className="text-xs text-muted-foreground">Banners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <MousePointer className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{ctaCount}</p>
                <p className="text-xs text-muted-foreground">CTA Icons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{imageCount}</p>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to company page builder sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <Button
                key={link.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent"
                onClick={() => navigate(link.path)}
              >
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">{link.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {company.company_phone && <p><span className="text-muted-foreground">Phone:</span> {company.company_phone}</p>}
            {company.company_email_primary && <p><span className="text-muted-foreground">Email:</span> {company.company_email_primary}</p>}
            {company.company_address && (
              <p><span className="text-muted-foreground">Address:</span> {company.company_address}, {company.company_city}, {company.company_state} {company.company_zip_code}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Website Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {company.website_title && <p><span className="text-muted-foreground">Title:</span> {company.website_title}</p>}
            {company.website_tagline && <p><span className="text-muted-foreground">Tagline:</span> {company.website_tagline}</p>}
            {company.theme_style && <p><span className="text-muted-foreground">Theme:</span> {company.theme_style}</p>}
            {company.primary_color && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Color:</span>
                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: company.primary_color }} />
                <span>{company.primary_color}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
