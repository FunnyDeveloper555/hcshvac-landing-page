import { Wrench, CheckCircle2 } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { groupOurServicesByEquipment, parseOurServices } from "@/lib/ourServices";

interface Props {
  companyName: string;
  ourServices: unknown;
  primaryColor?: string;
}

/** "Our Services" accordion driven by the company's checked service matrix. */
const CompanyOurServicesAccordion = ({ companyName, ourServices, primaryColor }: Props) => {
  const groups = groupOurServicesByEquipment(parseOurServices(ourServices));
  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <AccordionItem value="our-services" className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <Wrench className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">Our Services at {companyName}</span>
          <Badge variant="secondary" className="ml-2">
            {total} services
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2 pb-4">
          {groups.map((group) => (
            <div key={group.equipment}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.equipment}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-md bg-muted/50 p-2 transition-colors hover:bg-muted"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-sm">{item}</span>
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

export default CompanyOurServicesAccordion;
