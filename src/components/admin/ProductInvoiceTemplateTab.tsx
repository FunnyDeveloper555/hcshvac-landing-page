import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Code, Eye, Monitor, Tablet, Smartphone, Library } from "lucide-react";
import { toast } from "sonner";

interface ProductInvoiceTemplateTabProps {
  invoiceHtmlTemplate: string;
  setInvoiceHtmlTemplate: (v: string) => void;
  saveButton: React.ReactNode;
}

const ProductInvoiceTemplateTab = ({
  invoiceHtmlTemplate,
  setInvoiceHtmlTemplate,
  saveButton,
}: ProductInvoiceTemplateTabProps) => {
  const [editorTab, setEditorTab] = useState("editor");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, name, html_content")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) return;
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    if (tmpl) {
      setInvoiceHtmlTemplate(tmpl.html_content);
      setTemplatePickerOpen(false);
      setSelectedTemplateId("");
      toast.success(`Template "${tmpl.name}" loaded`);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoice HTML Template</h3>
          <p className="text-sm text-muted-foreground">
            Design the HTML template used for generating invoices for this product.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)}>
          <Library className="mr-1 h-4 w-4" /> Load Template
        </Button>
      </div>

      <Tabs value={editorTab} onValueChange={setEditorTab}>
        <TabsList>
          <TabsTrigger value="editor">
            <Code className="mr-1 h-4 w-4" /> HTML Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-1 h-4 w-4" /> Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor">
          <Textarea
            value={invoiceHtmlTemplate}
            onChange={(e) => setInvoiceHtmlTemplate(e.target.value)}
            placeholder={"<html>\n  <body>\n    <h1>Invoice</h1>\n  </body>\n</html>"}
            className="min-h-[500px] font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="flex justify-center mb-3">
            <ToggleGroup
              type="single"
              value={previewDevice}
              onValueChange={(v) => v && setPreviewDevice(v)}
            >
              <ToggleGroupItem value="desktop" aria-label="Desktop">
                <Monitor className="h-4 w-4 mr-1" /> Desktop
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label="Tablet">
                <Tablet className="h-4 w-4 mr-1" /> Tablet
              </ToggleGroupItem>
              <ToggleGroupItem value="mobile" aria-label="Mobile">
                <Smartphone className="h-4 w-4 mr-1" /> Mobile
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex justify-center">
            <div
              className="border rounded-lg bg-white min-h-[500px] p-1 transition-all duration-300"
              style={{
                width:
                  previewDevice === "desktop"
                    ? "100%"
                    : previewDevice === "tablet"
                    ? "768px"
                    : "375px",
                maxWidth: "100%",
              }}
            >
              {invoiceHtmlTemplate ? (
                <iframe
                  srcDoc={invoiceHtmlTemplate}
                  title="Invoice Template Preview"
                  className="w-full min-h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <p className="text-muted-foreground text-center py-16">
                  Enter HTML content to see a preview
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {saveButton}

      {/* Template Picker Dialog */}
      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No templates available. Create templates in the Email Templates section.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTemplatePickerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLoadTemplate} disabled={!selectedTemplateId}>
                Load
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductInvoiceTemplateTab;
