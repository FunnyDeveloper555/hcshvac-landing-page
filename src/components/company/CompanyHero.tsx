import { Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Company {
  name: string;
  company_phone: string | null;
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  hero_image_url: string | null;
  service_areas: string[] | null;
}

interface CompanyHeroProps {
  company: Company;
}

const CompanyHero = ({ company }: CompanyHeroProps) => {
  const title = company.website_title || `${company.name} - Your Trusted HVAC Partner`;
  const tagline = company.website_tagline || "24/7 Emergency Service Available";
  const description = company.website_description || 
    `Professional heating, ventilation, and air conditioning services for residential and commercial properties. Trust ${company.name} for all your HVAC needs.`;
  
  const primaryAreas = company.service_areas?.slice(0, 3).join(", ") || "Your Area";

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {company.hero_image_url ? (
          <img 
            src={company.hero_image_url} 
            alt="HVAC Services"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-block px-4 py-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full mb-6">
            <span className="text-accent font-semibold">{tagline}</span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title}
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed bg-background/30 backdrop-blur-sm p-4 rounded-lg">
            {description}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {company.company_phone && (
              <Button 
                variant="accent" 
                size="lg" 
                className="group"
                onClick={() => window.location.href = `tel:${company.company_phone}`}
              >
                <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Call Now: {company.company_phone}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Calendar className="w-5 h-5" />
              Schedule Service
            </Button>
          </div>
          
          {/* Service Areas Preview */}
          <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Serving: </span>
              {primaryAreas}
              {company.service_areas && company.service_areas.length > 3 && (
                <span className="text-primary"> and {company.service_areas.length - 3} more areas</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyHero;
