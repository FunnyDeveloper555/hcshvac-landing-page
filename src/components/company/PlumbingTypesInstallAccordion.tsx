import { Package } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface PlumbingTypesInstallAccordionProps {
  companyName: string;
  types: string[] | null;
  primaryColor?: string;
}

const PlumbingTypesInstallAccordion = ({ companyName, types, primaryColor }: PlumbingTypesInstallAccordionProps) => {
  if (!types || types.length === 0) return null;

  // Group types by first letter
  const typesByLetter = types.reduce((acc, type) => {
    const firstLetter = type.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(type);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <AccordionItem value="plumbing-types-install" className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">Plumbing Types We Install</span>
          <Badge variant="secondary" className="ml-2">
            {types.length} types
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2 pb-4">
          {Object.entries(typesByLetter)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, letterTypes]) => (
              <div key={letter} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-primary">{letter}</span>
                  <Badge variant="outline" className="text-xs">
                    {letterTypes.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {letterTypes
                    .sort((a, b) => a.localeCompare(b))
                    .map((type, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" title={type}>
                          {type}
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

export default PlumbingTypesInstallAccordion;
