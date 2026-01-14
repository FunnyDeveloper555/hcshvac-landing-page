import { Wrench, Wind, Thermometer, Settings, Gauge, Zap, Droplets, Fan, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";

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
  theme: ThemeConfig;
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

const CompanyServices = ({ company, services, theme }: CompanyServicesProps) => {
  if (services.length === 0) return null;

  const allBrands = [
    ...(company.brands_installed || []),
    ...(company.brands_serviced || [])
  ].filter((brand, index, arr) => arr.indexOf(brand) === index);

  const roundedClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
    'full': 'rounded-3xl',
  }[theme.typography.rounded];

  const gridClass = {
    'grid-3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    'grid-2': 'grid-cols-1 md:grid-cols-2',
    'list': 'grid-cols-1 max-w-2xl mx-auto',
    'cards': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    'tiles': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[theme.layout.servicesGrid];

  // List style layout
  if (theme.layout.servicesGrid === 'list') {
    return (
      <section id="services" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">What we offer</p>
            <h2 className={cn(
              "text-3xl md:text-4xl mb-16",
              `font-${theme.typography.headingWeight}`
            )}>
              Our Services
            </h2>
            
            <div className="space-y-0 divide-y divide-border">
              {services.map((service, index) => (
                <div key={service.id} className="py-8 group cursor-pointer hover:bg-muted/30 -mx-4 px-4 transition-colors">
                  <div className="flex items-start gap-6">
                    <span className="text-4xl font-light text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Tiles style layout (Bold theme)
  if (theme.layout.servicesGrid === 'tiles') {
    return (
      <section id="services" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={cn(
              "text-4xl md:text-5xl mb-4",
              `font-${theme.typography.headingWeight}`
            )}>
              OUR SERVICES
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {company.name} provides comprehensive HVAC solutions.
            </p>
          </div>
          
          <div className={cn("grid gap-4", gridClass)}>
            {services.map((service) => (
              <div 
                key={service.id} 
                className={cn(
                  "bg-card p-6 group cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300",
                  roundedClass,
                  theme.effects.shadows && "hover:shadow-xl"
                )}
              >
                <div className="text-primary group-hover:text-primary-foreground mb-4 transition-colors">
                  {iconMap[service.icon] || <Wrench className="w-8 h-8" />}
                </div>
                <h3 className="font-bold text-lg">{service.title}</h3>
              </div>
            ))}
          </div>

          {allBrands.length > 0 && (
            <div className="mt-16 text-center">
              <h3 className="text-xl font-bold mb-6">TRUSTED BRANDS</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {allBrands.map((brand, index) => (
                  <span 
                    key={index}
                    className={cn(
                      "px-4 py-2 bg-card border border-border text-sm font-medium",
                      roundedClass
                    )}
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Cards style layout (Elegant theme)
  if (theme.layout.servicesGrid === 'cards') {
    return (
      <section id="services" className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-medium">Excellence in Every Detail</span>
            <h2 className={cn(
              "text-3xl md:text-4xl mt-2 mb-4",
              `font-${theme.typography.headingWeight}`
            )}>
              Our Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience premium HVAC services tailored to your unique needs.
            </p>
          </div>
          
          <div className={cn("grid gap-8", gridClass)}>
            {services.map((service) => (
              <Card 
                key={service.id} 
                className={cn(
                  "overflow-hidden group border-0",
                  roundedClass,
                  theme.effects.shadows && "shadow-lg hover:shadow-2xl",
                  "transition-all duration-300 hover:-translate-y-1"
                )}
              >
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <CardHeader className="pt-8">
                  <div className={cn(
                    "w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary mb-4",
                    roundedClass
                  )}>
                    {iconMap[service.icon] || <Wrench className="w-8 h-8" />}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {allBrands.length > 0 && (
            <div className="mt-20 text-center">
              <h3 className="text-2xl font-semibold mb-8">Brands We Partner With</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {allBrands.map((brand, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "px-6 py-3 bg-card border border-border/50 text-foreground font-medium",
                      roundedClass,
                      theme.effects.shadows && "shadow-sm"
                    )}
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
  }

  // Default grid layouts (Modern, Classic)
  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className={cn(
          "mb-12",
          theme.layout.servicesGrid === 'grid-2' ? "text-center" : ""
        )}>
          <h2 className={cn(
            "text-3xl md:text-4xl mb-4",
            `font-${theme.typography.headingWeight}`
          )}>
            Our Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional HVAC services tailored to your needs. {company.name} provides comprehensive heating and cooling solutions.
          </p>
        </div>
        
        <div className={cn("grid gap-6 mb-12", gridClass)}>
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={cn(
                "transition-all",
                roundedClass,
                theme.effects.shadows && "hover:shadow-lg"
              )}
            >
              <CardHeader>
                <div className={cn(
                  "w-16 h-16 bg-primary/10 flex items-center justify-center text-primary mb-4",
                  roundedClass
                )}>
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

        {allBrands.length > 0 && (
          <div className="mt-16">
            <h3 className={cn(
              "text-2xl text-center mb-8",
              `font-${theme.typography.headingWeight}`
            )}>
              Brands We Work With
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {allBrands.map((brand, index) => (
                <div 
                  key={index}
                  className={cn(
                    "px-6 py-3 bg-background border border-border text-foreground font-medium",
                    roundedClass
                  )}
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
