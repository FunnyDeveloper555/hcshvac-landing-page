import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Copy, Star } from "lucide-react";

const templates = [
  {
    id: "default",
    name: "Default Template",
    description: "Standard HVAC landing page with hero, services, brands, and contact sections",
    isDefault: true,
    sections: ["Hero", "Services", "Brands", "Service Areas", "Coupons", "Contact", "Footer"],
    preview: "/templates/default-preview.png",
  },
  {
    id: "modern",
    name: "Modern Template",
    description: "Clean, modern design with large images and minimal text",
    isDefault: false,
    sections: ["Hero Banner", "Quick Stats", "Services Grid", "Testimonials", "CTA", "Footer"],
    preview: "/templates/modern-preview.png",
  },
  {
    id: "classic",
    name: "Classic Template",
    description: "Traditional business layout with detailed information sections",
    isDefault: false,
    sections: ["Header", "About", "Services List", "Why Choose Us", "Reviews", "Contact Form", "Footer"],
    preview: "/templates/classic-preview.png",
  },
  {
    id: "minimal",
    name: "Minimal Template",
    description: "Stripped-down design focusing on key information and call-to-action",
    isDefault: false,
    sections: ["Hero", "Key Services", "CTA Banner", "Contact", "Footer"],
    preview: "/templates/minimal-preview.png",
  },
];

export default function PageTemplates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Page Templates</h2>
        <p className="text-muted-foreground">
          Choose and customize templates for your generated landing pages
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center border-b">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">Template Preview</p>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Sections Included:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map((section) => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Customize
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Sections Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Template Sections</CardTitle>
          <CardDescription>
            Each template consists of customizable sections that pull data from your company profile and campaign filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Hero Section</h4>
              <p className="text-sm text-muted-foreground">
                Dynamic hero with location-specific headlines, service type, and call-to-action buttons
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Services Section</h4>
              <p className="text-sm text-muted-foreground">
                Lists relevant services based on equipment type and visit type filters
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Brands Section</h4>
              <p className="text-sm text-muted-foreground">
                Displays brand logos for equipment brands you service or install
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Service Areas</h4>
              <p className="text-sm text-muted-foreground">
                Shows nearby cities and areas served, pulled from location filters
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Coupons/Offers</h4>
              <p className="text-sm text-muted-foreground">
                Displays active coupons from company profile for the service type
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Reviews Integration</h4>
              <p className="text-sm text-muted-foreground">
                Embed Google/Yelp reviews or testimonials relevant to the service
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
