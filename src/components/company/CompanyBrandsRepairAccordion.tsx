import { Settings } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CompanyBrandsRepairAccordionProps {
  companyName: string;
  brands: string[] | null;
  primaryColor?: string;
}

const CompanyBrandsRepairAccordion = ({ companyName, brands, primaryColor }: CompanyBrandsRepairAccordionProps) => {
  if (!brands || brands.length === 0) return null;

  // Group brands by first letter
  const brandsByLetter = brands.reduce((acc, brand) => {
    const firstLetter = brand.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <AccordionItem value="brands-repair" className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">Brands We Repair</span>
          <Badge variant="secondary" className="ml-2">
            {brands.length} brands
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2 pb-4">
          {Object.entries(brandsByLetter)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, letterBrands]) => (
              <div key={letter} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-primary">{letter}</span>
                  <Badge variant="outline" className="text-xs">
                    {letterBrands.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {letterBrands
                    .sort((a, b) => a.localeCompare(b))
                    .map((brand, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Settings className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" title={brand}>
                          {brand}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CompanyBrandsRepairAccordion;
