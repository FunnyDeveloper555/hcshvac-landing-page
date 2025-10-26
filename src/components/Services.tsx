import { Wind, Flame, Wrench, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: Wind,
    title: "Air Conditioning",
    description: "Expert AC installation, repair, and maintenance to keep you cool all summer long.",
  },
  {
    icon: Flame,
    title: "Heating Systems",
    description: "Reliable heating solutions including furnaces, heat pumps, and boiler services.",
  },
  {
    icon: Wrench,
    title: "Maintenance Plans",
    description: "Preventive maintenance programs to extend system life and improve efficiency.",
  },
  {
    icon: Shield,
    title: "Emergency Repairs",
    description: "24/7 emergency service for urgent heating and cooling system breakdowns.",
  },
];

const Services = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive HVAC solutions for residential and commercial properties
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card 
                key={index} 
                className="border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
