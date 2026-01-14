import { Wrench, Wind, Thermometer, Settings, Gauge, Zap, Droplets, Fan } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Company {
  name: string;
  brands_installed: string[] | null;
  brands_serviced: string[] | null;
}

interface CompanyServicesProps {
  company: Company;
  services: Service[];
}

const iconMap: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-8 h-8" />,
  Wind: <Wind className="w-8 h-8" />,
  Thermometer: <Thermometer className="w-8 h-8" />,
  Settings: <Settings className="w-8 h-8" />,
  Gauge: <Gauge className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Droplets: <Droplets className="w-8 h-8" />,
  Fan: <Fan className="w-8 h-8" />,
};

const CompanyServices = ({ company, services }: CompanyServicesProps) => {
  if (services.length === 0) return null;

  const allBrands = [
    ...(company.brands_installed || []),
    ...(company.brands_serviced || [])
  ].filter((brand, index, arr) => arr.indexOf(brand) === index);

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional HVAC services tailored to your needs. {company.name} provides comprehensive heating and cooling solutions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {iconMap[service.icon] || <Wrench className="w-8 h-8" />}
                </div>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Brands Section */}
        {allBrands.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">Brands We Work With</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {allBrands.map((brand, index) => (
                <div 
                  key={index}
                  className="px-6 py-3 bg-background border border-border rounded-lg text-foreground font-medium"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CompanyServices;
