import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ExternalLink, Layout, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SITE_TEMPLATES, DEFAULT_SITE_TEMPLATE, getSiteTemplate } from "./siteTemplatesData";

interface Props {
  companyId: string;
  currentTemplate?: string | null;
}

export default function CompanySiteTemplateSelector({ companyId, currentTemplate }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(currentTemplate || DEFAULT_SITE_TEMPLATE);

  useEffect(() => {
    setSelected(currentTemplate || DEFAULT_SITE_TEMPLATE);
  }, [currentTemplate]);

  const saved = (currentTemplate || DEFAULT_SITE_TEMPLATE) === selected;
  const template = getSiteTemplate(selected);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({ site_template: selected })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Site template updated");
      queryClient.invalidateQueries({ queryKey: ["company-dashboard", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layout className="h-4 w-4 text-primary" />
          Site Template
        </CardTitle>
        <CardDescription>Choose the website wire frame used for this company's site</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {SITE_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground">{template.description}</p>
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => save()} disabled={isPending || saved}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {saved ? "Applied" : "Apply Template"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={template.path} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Template
                </a>
              </Button>
              {SITE_TEMPLATES.length === 1 && (
                <span className="text-xs text-muted-foreground">Only one template available for now</span>
              )}
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
            <iframe
              key={template.id}
              src={template.path}
              title={`${template.name} preview`}
              className="pointer-events-none absolute left-0 top-0 h-[900px] w-[1400px] origin-top-left border-0"
              style={{ transform: "scale(0.185)" }}
              scrolling="no"
              loading="lazy"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
