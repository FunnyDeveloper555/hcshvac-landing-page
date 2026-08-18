import { Package } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CompanyEquipmentListAccordionProps {
  value: string;
  title: string;
  items: string[] | null;
  primaryColor?: string;
}

const CompanyEquipmentListAccordion = ({
  value,
  title,
  items,
  primaryColor,
}: CompanyEquipmentListAccordionProps) => {
  if (!items || items.length === 0) return null;

  return (
    <AccordionItem value={value} className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">{title}</span>
          <Badge variant="secondary" className="ml-2">
            {items.length} items
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 pb-4">
          {[...items].sort((a, b) => a.localeCompare(b)).map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
            >
              <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate" title={item}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CompanyEquipmentListAccordion;
