import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Eye } from "lucide-react";
import { useState } from "react";
import { SITE_TEMPLATES, type SiteTemplate } from "./siteTemplatesData";

export default function SiteTemplates() {
  const [preview, setPreview] = useState<SiteTemplate | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Site Templates Wire Frames</h2>
        <p className="text-muted-foreground">Reference wire frames available for company websites</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SITE_TEMPLATES.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="relative aspect-video overflow-hidden border-b bg-muted">
              <iframe
                src={template.path}
                title={`${template.name} preview`}
                className="pointer-events-none absolute left-0 top-0 h-[900px] w-[1400px] origin-top-left border-0"
                style={{ transform: "scale(0.3)" }}
                scrolling="no"
                loading="lazy"
              />
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-3">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              {template.usedBy && (
                <p className="text-xs text-muted-foreground">Currently used by {template.usedBy}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreview(template)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={template.path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <iframe
              src={preview.path}
              title={`${preview.name} full preview`}
              className="h-[75vh] w-full rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
