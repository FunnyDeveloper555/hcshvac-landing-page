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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

const POPUP_TYPES = [
  { value: "promotional", label: "Promotional" },
  { value: "emergency", label: "Emergency" },
  { value: "announcement", label: "Announcement" },
  { value: "seasonal", label: "Seasonal" },
] as const;

const popupSchema = z.object({
  popup_type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  button_text: z.string().optional(),
  button_url: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  image_urls: z.string().optional(),
  display_order: z.number(),
  is_active: z.boolean(),
});

type PopupFormData = z.infer<typeof popupSchema>;

export default function PopupsAdd() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const form = useForm<PopupFormData>({
    resolver: zodResolver(popupSchema),
    defaultValues: {
      popup_type: "promotional",
      title: "",
      message: "",
      button_text: "Got it",
      button_url: "",
      background_color: "",
      text_color: "",
      image_urls: "",
      display_order: 0,
      is_active: true,
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

  const { data: existingItem, isLoading: loadingItem } = useQuery({
    queryKey: ["company-popup", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("company_popups")
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
      const imageUrls = existingItem.image_urls;
      let imageUrlsStr = "";
      if (Array.isArray(imageUrls)) {
        imageUrlsStr = imageUrls.join(", ");
      } else if (typeof imageUrls === "string") {
        imageUrlsStr = imageUrls;
      }

      form.reset({
        popup_type: existingItem.popup_type || "promotional",
        title: existingItem.title || "",
        message: existingItem.message || "",
        button_text: existingItem.button_text || "Got it",
        button_url: existingItem.button_url || "",
        background_color: existingItem.background_color || "",
        text_color: existingItem.text_color || "",
        image_urls: imageUrlsStr,
        display_order: existingItem.display_order ?? 0,
        is_active: existingItem.is_active ?? true,
      });
    }
  }, [existingItem, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: PopupFormData) => {
      // Parse image_urls from comma-separated string to JSON array
      const imageUrlsArray = data.image_urls
        ? data.image_urls.split(",").map((url) => url.trim()).filter(Boolean)
        : [];

      const payload = {
        company_id: companyId!,
        popup_type: data.popup_type,
        title: data.title,
        message: data.message,
        button_text: data.button_text || "Got it",
        button_url: data.button_url || null,
        background_color: data.background_color || null,
        text_color: data.text_color || null,
        image_urls: imageUrlsArray as any,
        display_order: data.display_order,
        is_active: data.is_active,
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from("company_popups")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        return editId;
      } else {
        const { data: inserted, error } = await supabase
          .from("company_popups")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return inserted.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] });
      logAction(isEditMode ? "update" : "create", "company_popup", id, {
        title: form.getValues("title"),
        popup_type: form.getValues("popup_type"),
      });
      toast.success(`Popup ${isEditMode ? "updated" : "created"} successfully`);
      navigate(`/admin/page-builder/company/${companyId}/popups`);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} popup`);
    },
  });

  const onSubmit = (data: PopupFormData) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/popups`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Popup" : "Add Popup"}
          </h2>
          <p className="text-muted-foreground">
            {company?.name || "..."} - Popup alert configuration
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Popup Details</CardTitle>
              <CardDescription>Configure the popup type, content, and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="popup_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popup Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POPUP_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Popup title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Popup message content..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Got it" {...field} />
                      </FormControl>
                      <FormDescription>Text shown on the dismiss button</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="button_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>If set, button navigates to this URL</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="image_urls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URLs (comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Add one or more image URLs separated by commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance & Settings</CardTitle>
              <CardDescription>Customize colors, order, and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="background_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#ffffff or rgb(...)" {...field} />
                        </FormControl>
                        {field.value && (
                          <div
                            className="w-10 h-10 rounded border shrink-0"
                            style={{ backgroundColor: field.value }}
                          />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#000000 or rgb(...)" {...field} />
                        </FormControl>
                        {field.value && (
                          <div
                            className="w-10 h-10 rounded border shrink-0"
                            style={{ backgroundColor: field.value }}
                          />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        <FormDescription>Show this popup on the landing page</FormDescription>
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
              onClick={() => navigate(`/admin/page-builder/company/${companyId}/popups`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditMode ? "Update" : "Create"} Popup
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
