import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

const affiliateSchema = z.object({
  logo_url: z.string().optional(),
  business_name: z.string().min(1, "Business name is required"),
  custom_name: z.string().optional(),
  alt_text: z.string().optional(),
});

const partnerSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_phone: z.string().optional(),
  logo_url: z.string().optional(),
  logo_custom_name: z.string().optional(),
  logo_alt_text: z.string().optional(),
  bg_image_url: z.string().optional(),
  bg_custom_name: z.string().optional(),
  bg_alt_text: z.string().optional(),
  first_paragraph: z.string().optional(),
  first_bullets: z.array(z.string()).optional(),
  second_paragraph: z.string().optional(),
  second_bullets: z.array(z.string()).optional(),
  affiliates: z.array(affiliateSchema).optional(),
  website_url: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  best_if_used_for: z.string().optional(),
  is_active: z.boolean(),
  display_order: z.number(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export default function PartnerListingsAdd() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [firstBullets, setFirstBullets] = useState<string[]>([""]);
  const [secondBullets, setSecondBullets] = useState<string[]>([""]);
  const [affiliates, setAffiliates] = useState<Array<{ logo_url: string; business_name: string; custom_name: string; alt_text: string }>>([]);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      business_name: "",
      business_phone: "",
      logo_url: "",
      logo_custom_name: "",
      logo_alt_text: "",
      bg_image_url: "",
      bg_custom_name: "",
      bg_alt_text: "",
      first_paragraph: "",
      first_bullets: [],
      second_paragraph: "",
      second_bullets: [],
      affiliates: [],
      website_url: "",
      contact_email: "",
      best_if_used_for: "",
      is_active: true,
      display_order: 0,
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: existingPartner, isLoading: loadingPartner } = useQuery({
    queryKey: ["partner-listing", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*")
        .eq("id", editId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingPartner) {
      form.reset({
        business_name: existingPartner.business_name || "",
        business_phone: existingPartner.business_phone || "",
        logo_url: existingPartner.logo_url || "",
        logo_custom_name: existingPartner.logo_custom_name || "",
        logo_alt_text: existingPartner.logo_alt_text || "",
        bg_image_url: existingPartner.bg_image_url || "",
        bg_custom_name: existingPartner.bg_custom_name || "",
        bg_alt_text: existingPartner.bg_alt_text || "",
        first_paragraph: existingPartner.first_paragraph || "",
        second_paragraph: existingPartner.second_paragraph || "",
        website_url: existingPartner.website_url || "",
        contact_email: existingPartner.contact_email || "",
        best_if_used_for: existingPartner.best_if_used_for || "",
        is_active: existingPartner.is_active ?? true,
        display_order: existingPartner.display_order || 0,
      });
      
      const fb = (existingPartner.first_bullets as string[]) || [];
      setFirstBullets(fb.length > 0 ? fb : [""]);
      
      const sb = (existingPartner.second_bullets as string[]) || [];
      setSecondBullets(sb.length > 0 ? sb : [""]);
      
      const aff = (existingPartner.affiliates as Array<{ logo_url: string; business_name: string; custom_name: string; alt_text: string }>) || [];
      setAffiliates(aff);
    }
  }, [existingPartner, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const payload = {
        ...data,
        company_id: companyId,
        first_bullets: firstBullets.filter(b => b.trim()),
        second_bullets: secondBullets.filter(b => b.trim()),
        affiliates: affiliates.filter(a => a.business_name.trim()),
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from("partner_listings")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        return editId;
      } else {
        const { data: inserted, error } = await supabase
          .from("partner_listings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return inserted.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", companyId] });
      logAction(isEditMode ? "update" : "create", "partner_listing", id, {
        business_name: form.getValues("business_name"),
      });
      toast.success(`Partner ${isEditMode ? "updated" : "created"} successfully`);
      navigate(`/admin/page-builder/company/${companyId}/partner-listings`);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} partner`);
    },
  });

  const onSubmit = (data: PartnerFormData) => {
    saveMutation.mutate(data);
  };

  const addFirstBullet = () => setFirstBullets([...firstBullets, ""]);
  const removeFirstBullet = (index: number) => setFirstBullets(firstBullets.filter((_, i) => i !== index));
  const updateFirstBullet = (index: number, value: string) => {
    const updated = [...firstBullets];
    updated[index] = value;
    setFirstBullets(updated);
  };

  const addSecondBullet = () => setSecondBullets([...secondBullets, ""]);
  const removeSecondBullet = (index: number) => setSecondBullets(secondBullets.filter((_, i) => i !== index));
  const updateSecondBullet = (index: number, value: string) => {
    const updated = [...secondBullets];
    updated[index] = value;
    setSecondBullets(updated);
  };

  const addAffiliate = () => setAffiliates([...affiliates, { logo_url: "", business_name: "", custom_name: "", alt_text: "" }]);
  const removeAffiliate = (index: number) => setAffiliates(affiliates.filter((_, i) => i !== index));
  const updateAffiliate = (index: number, field: keyof typeof affiliates[0], value: string) => {
    const updated = [...affiliates];
    updated[index] = { ...updated[index], [field]: value };
    setAffiliates(updated);
  };

  if (!companyId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  if (isEditMode && loadingPartner) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/partner-listings`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Partner Listing" : "Add Partner Listing"}
          </h2>
          <p className="text-muted-foreground">
            {company?.name || "..."} - Partner micro-website configuration
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle>Header Section</CardTitle>
              <CardDescription>Business branding and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Partner Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="business_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              <p className="text-sm font-medium">Business Logo</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo_custom_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Logo name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo_alt_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alt Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Logo alt text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              <p className="text-sm font-medium">Background Image</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bg_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bg_custom_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Background name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bg_alt_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alt Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Background alt text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Body Section */}
          <Card>
            <CardHeader>
              <CardTitle>Body Section</CardTitle>
              <CardDescription>Main content paragraphs and bullet points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* First Paragraph */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="first_paragraph"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Paragraph</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter first paragraph text..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>First Paragraph Bullet Points</Label>
                  {firstBullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => updateFirstBullet(index, e.target.value)}
                        placeholder={`Bullet point ${index + 1}`}
                      />
                      {firstBullets.length > 1 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removeFirstBullet(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addFirstBullet}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bullet
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Second Paragraph */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="second_paragraph"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Paragraph</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter second paragraph text..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>Second Paragraph Bullet Points</Label>
                  {secondBullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => updateSecondBullet(index, e.target.value)}
                        placeholder={`Bullet point ${index + 1}`}
                      />
                      {secondBullets.length > 1 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removeSecondBullet(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addSecondBullet}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bullet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliates Section */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliates Section</CardTitle>
              <CardDescription>Partner affiliations and logos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {affiliates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No affiliates added yet</p>
              ) : (
                affiliates.map((affiliate, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Affiliate {index + 1}</p>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAffiliate(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Business Name *</Label>
                        <Input
                          value={affiliate.business_name}
                          onChange={(e) => updateAffiliate(index, "business_name", e.target.value)}
                          placeholder="Affiliate business name"
                        />
                      </div>
                      <div>
                        <Label>Logo URL</Label>
                        <Input
                          value={affiliate.logo_url}
                          onChange={(e) => updateAffiliate(index, "logo_url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>Custom Name</Label>
                        <Input
                          value={affiliate.custom_name}
                          onChange={(e) => updateAffiliate(index, "custom_name", e.target.value)}
                          placeholder="Custom name for image"
                        />
                      </div>
                      <div>
                        <Label>Alt Text</Label>
                        <Input
                          value={affiliate.alt_text}
                          onChange={(e) => updateAffiliate(index, "alt_text", e.target.value)}
                          placeholder="Image alt text"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button type="button" variant="outline" onClick={addAffiliate}>
                <Plus className="mr-2 h-4 w-4" /> Add Affiliate
              </Button>
            </CardContent>
          </Card>

          {/* Final Section */}
          <Card>
            <CardHeader>
              <CardTitle>Final Section</CardTitle>
              <CardDescription>Contact and usage information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://partner-website.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@partner.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="best_if_used_for"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best If Used For</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this partner is best used for..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the ideal use cases for this partner's services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/page-builder/company/${companyId}/partner-listings`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditMode ? "Update Partner" : "Create Partner"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
