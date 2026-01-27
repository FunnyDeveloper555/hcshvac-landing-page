import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

const PAGE_NAMES = [
  { value: "about_us", label: "About Us" },
  { value: "financing", label: "Financing" },
  { value: "services", label: "Services" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "air_quality", label: "Air Quality" },
];

const POSITIONS = Array.from({ length: 8 }, (_, i) => i + 1);

interface CTAIcon {
  id: string;
  image_url: string;
  alt_text: string;
  custom_name: string;
  unique_id_number: string;
  is_active: boolean;
  is_usable: boolean;
}

interface Assignment {
  id?: string;
  cta_icon_id: string;
  company_id: string;
  page_name: string;
  use_on_page: boolean;
  position: number | null;
}

export default function CTAIconsAssignments() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [selectedIcon, setSelectedIcon] = useState<CTAIcon | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [saving, setSaving] = useState(false);

  // Fetch all icons for this company
  const { data: icons = [], isLoading: iconsLoading } = useQuery({
    queryKey: ["cta-icons", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cta_icons")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_usable", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CTAIcon[];
    },
    enabled: !!companyId,
  });

  // Fetch existing assignments for selected icon
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ["cta-assignments", selectedIcon?.id],
    queryFn: async () => {
      if (!selectedIcon) return [];
      const { data, error } = await supabase
        .from("page_cta_assignments")
        .select("*")
        .eq("cta_icon_id", selectedIcon.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedIcon,
  });

  // Initialize assignments when icon is selected
  useEffect(() => {
    if (selectedIcon && companyId) {
      const initialAssignments: Record<string, Assignment> = {};
      PAGE_NAMES.forEach((page) => {
        const existing = existingAssignments.find((a) => a.page_name === page.value);
        initialAssignments[page.value] = existing || {
          cta_icon_id: selectedIcon.id,
          company_id: companyId,
          page_name: page.value,
          use_on_page: false,
          position: null,
        };
      });
      setAssignments(initialAssignments);
    }
  }, [selectedIcon, existingAssignments, companyId]);

  const updateAssignment = (pageName: string, updates: Partial<Assignment>) => {
    setAssignments((prev) => ({
      ...prev,
      [pageName]: { ...prev[pageName], ...updates },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIcon || !companyId) return;
      setSaving(true);

      for (const [pageName, assignment] of Object.entries(assignments)) {
        const existing = existingAssignments.find((a) => a.page_name === pageName);

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("page_cta_assignments")
            .update({
              use_on_page: assignment.use_on_page,
              position: assignment.position,
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else if (assignment.use_on_page) {
          // Insert new only if use_on_page is true
          const { error } = await supabase
            .from("page_cta_assignments")
            .insert({
              cta_icon_id: selectedIcon.id,
              company_id: companyId,
              page_name: pageName,
              use_on_page: assignment.use_on_page,
              position: assignment.position,
            });
          if (error) throw error;
        }
      }

      await logAction("update", "cta_assignment", selectedIcon.id, {
        custom_name: selectedIcon.custom_name,
      });
    },
    onSuccess: () => {
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ["cta-assignments", selectedIcon?.id] });
      toast.success("Assignments saved!");
    },
    onError: (error: Error) => {
      setSaving(false);
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/library`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">CTA Icon Assignments</h1>
          <p className="text-muted-foreground">
            Assign icons to pages and set positions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Icon Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Icon</CardTitle>
            <CardDescription>Choose an icon to configure</CardDescription>
          </CardHeader>
          <CardContent>
            {iconsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : icons.length === 0 ? (
              <p className="text-muted-foreground">No usable icons found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon)}
                    className={`p-3 border rounded-lg transition-all ${
                      selectedIcon?.id === icon.id
                        ? "border-primary ring-2 ring-primary bg-accent"
                        : "hover:border-primary hover:bg-accent"
                    }`}
                  >
                    <img
                      src={icon.image_url}
                      alt={icon.alt_text}
                      className="w-full h-12 object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Page Assignments</span>
              {selectedIcon && (
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {selectedIcon
                ? `Configuring: ${selectedIcon.custom_name || selectedIcon.unique_id_number}`
                : "Select an icon to configure assignments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedIcon ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an icon from the left to configure its page assignments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Icon Preview */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img
                    src={selectedIcon.image_url}
                    alt={selectedIcon.alt_text}
                    className="h-16 w-16 object-contain"
                  />
                  <div>
                    <p className="font-medium">{selectedIcon.custom_name || selectedIcon.unique_id_number}</p>
                    <p className="text-sm text-muted-foreground">{selectedIcon.alt_text}</p>
                    <Badge variant="outline" className="mt-1">{selectedIcon.unique_id_number}</Badge>
                  </div>
                </div>

                {/* Page Assignments */}
                <div className="border rounded-lg divide-y">
                  {PAGE_NAMES.map((page) => {
                    const assignment = assignments[page.value];
                    return (
                      <div key={page.value} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{page.label}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`use-${page.value}`} className="text-sm">Use on Page</Label>
                            <Switch
                              id={`use-${page.value}`}
                              checked={assignment?.use_on_page || false}
                              onCheckedChange={(checked) =>
                                updateAssignment(page.value, { use_on_page: checked })
                              }
                            />
                          </div>
                          <Select
                            value={assignment?.position?.toString() || "none"}
                            onValueChange={(v) =>
                              updateAssignment(page.value, {
                                position: v === "none" ? null : parseInt(v),
                              })
                            }
                            disabled={!assignment?.use_on_page}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Position</SelectItem>
                              {POSITIONS.map((pos) => (
                                <SelectItem key={pos} value={pos.toString()}>
                                  Position {pos}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Position Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Position Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-8 gap-2">
                      {POSITIONS.map((pos) => {
                        const hasAssignment = Object.values(assignments).some(
                          (a) => a.use_on_page && a.position === pos
                        );
                        return (
                          <div
                            key={pos}
                            className={`aspect-square border-2 border-dashed rounded flex items-center justify-center text-xs ${
                              hasAssignment
                                ? "border-primary bg-primary/10"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {hasAssignment ? (
                              <img
                                src={selectedIcon.image_url}
                                alt=""
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <span className="text-muted-foreground">{pos}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
