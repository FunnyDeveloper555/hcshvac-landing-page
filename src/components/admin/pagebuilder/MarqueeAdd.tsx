import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

const MARQUEE_TYPES = [
  { value: "text", label: "Text" },
  { value: "brands", label: "Brands" },
  { value: "partners", label: "Partners" },
  { value: "services", label: "Services" },
] as const;

const marqueeSchema = z.object({
  marquee_type: z.string().min(1, "Type is required"),
  text: z.string().optional(),
  link_url: z.string().optional(),
  reference_id: z.string().optional(),
  display_order: z.number(),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.marquee_type === "text") return !!data.text && data.text.length > 0;
  return !!data.reference_id;
}, {
  message: "Please provide text or select an item",
  path: ["text"],
});

type MarqueeFormData = z.infer<typeof marqueeSchema>;

export default function MarqueeAdd() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const form = useForm<MarqueeFormData>({
    resolver: zodResolver(marqueeSchema),
    defaultValues: {
      marquee_type: "text",
      text: "",
      link_url: "",
      reference_id: "",
      display_order: 0,
      is_active: true,
    },
  });

  const marqueeType = form.watch("marquee_type");

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("name, brands_installed, brands_serviced, services_provided")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch brands for this company
  const { data: brands = [] } = useQuery({
    queryKey: ["company-brands", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: marqueeType === "brands",
  });

  // Fetch partner listings for this company
  const { data: partners = [] } = useQuery({
    queryKey: ["company-partners", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("partner_listings")
        .select("id, business_name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("business_name");
      if (error) throw error;
      return data;
    },
    enabled: marqueeType === "partners" && !!companyId,
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: marqueeType === "services",
  });

  const { data: existingItem, isLoading: loadingItem } = useQuery({
    queryKey: ["company-marquee", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("company_marquees")
        .select("*")
        .eq("id", editId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingItem) {
      form.reset({
        marquee_type: existingItem.marquee_type || "text",
        text: existingItem.text || "",
        link_url: existingItem.link_url || "",
        reference_id: existingItem.reference_id || "",
        display_order: existingItem.display_order || 0,
        is_active: existingItem.is_active ?? true,
      });
    }
  }, [existingItem, form]);

  const getReferenceItems = () => {
    switch (marqueeType) {
      case "brands":
        return brands.map((b) => ({ id: b.id, label: b.name }));
      case "partners":
        return partners.map((p) => ({ id: p.id, label: p.business_name }));
      case "services":
        return services.map((s) => ({ id: s.id, label: s.title }));
      default:
        return [];
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: MarqueeFormData) => {
      // For non-text types, auto-set the text from the selected item
      let finalText = data.text || "";
      if (data.marquee_type !== "text" && data.reference_id) {
        const items = getReferenceItems();
        const item = items.find((i) => i.id === data.reference_id);
        if (item) finalText = item.label;
      }

      const payload = {
        text: finalText,
        marquee_type: data.marquee_type,
        reference_id: data.marquee_type !== "text" ? data.reference_id || null : null,
        company_id: companyId,
        link_url: data.link_url || null,
        display_order: data.display_order,
        is_active: data.is_active,
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from("company_marquees")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        return editId;
      } else {
        const { data: inserted, error } = await supabase
          .from("company_marquees")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return inserted.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["company-marquees", companyId] });
      logAction(isEditMode ? "update" : "create", "company_marquee", id, {
        text: form.getValues("text"),
        marquee_type: form.getValues("marquee_type"),
      });
      toast.success(`Marquee item ${isEditMode ? "updated" : "created"} successfully`);
      navigate(`/admin/page-builder/company/${companyId}/marquee`);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} marquee item`);
    },
  });

  const onSubmit = (data: MarqueeFormData) => {
    saveMutation.mutate(data);
  };

  if (!companyId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  if (isEditMode && loadingItem) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const referenceItems = getReferenceItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/marquee`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Marquee Item" : "Add Marquee Item"}
          </h2>
          <p className="text-muted-foreground">
            {company?.name || "..."} - Scrolling marquee content
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marquee Details</CardTitle>
              <CardDescription>Configure the marquee type and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="marquee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marquee Type *</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("reference_id", "");
                        form.setValue("text", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARQUEE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose what type of content to display in the marquee</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {marqueeType === "text" ? (
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marquee Text *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter scrolling text..." {...field} />
                      </FormControl>
                      <FormDescription>This text will scroll across the marquee banner</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="reference_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Select {marqueeType === "brands" ? "Brand" : marqueeType === "partners" ? "Partner" : "Service"} *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select a ${marqueeType.slice(0, -1)}...`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {referenceItems.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              No items available
                            </SelectItem>
                          ) : (
                            referenceItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select from existing {marqueeType} added to this company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="link_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>If provided, clicking this item will navigate to this URL</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>Show this item in the marquee</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/page-builder/company/${companyId}/marquee`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditMode ? "Update" : "Create"} Marquee Item
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
