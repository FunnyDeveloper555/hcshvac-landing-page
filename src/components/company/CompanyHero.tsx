import { Phone, Calendar, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";

// Default banner images for company websites
import hvacHero1 from "@/assets/hvac-hero.jpg";
import hvacHero2 from "@/assets/hvac-hero-2.jpg";
import hvacHero3 from "@/assets/hvac-hero-3.jpg";

const DEFAULT_BANNERS = [
  { url: hvacHero1, alt: "Professional HVAC technician at work" },
  { url: hvacHero2, alt: "Modern heating and cooling equipment" },
  { url: hvacHero3, alt: "HVAC service and maintenance" },
];

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
  theme: ThemeConfig;
}

const CompanyHero = ({ company, theme }: CompanyHeroProps) => {
  const title = company.website_title || `${company.name} - Your Trusted HVAC Partner`;
  const tagline = company.website_tagline || "24/7 Emergency Service Available";
  const description = company.website_description || 
    `Professional heating, ventilation, and air conditioning services for residential and commercial properties. Trust ${company.name} for all your HVAC needs.`;
  
  const primaryAreas = company.service_areas?.slice(0, 3).join(", ") || "Your Area";
  const hasCustomImage = !!company.hero_image_url;

  const roundedClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
    'full': 'rounded-full',
  }[theme.typography.rounded];

  // Render background based on hero style
  const renderBackground = () => {
    const imageContent = hasCustomImage ? (
      <img 
        src={company.hero_image_url!} 
        alt="HVAC Services"
        className="w-full h-full object-cover"
      />
    ) : (
      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full h-full"
      >
        <CarouselContent className="h-screen">
          {DEFAULT_BANNERS.map((banner, index) => (
            <CarouselItem key={index} className="h-full">
              <img 
                src={banner.url} 
                alt={banner.alt}
                className="w-full h-screen object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );

    return (
      <div className="absolute inset-0 z-0">
        {imageContent}
        <div className={cn(
          "absolute inset-0",
          theme.layout.heroStyle === 'overlay' && "bg-black/60",
          theme.layout.heroStyle === 'left-aligned' && "bg-gradient-to-r from-background/95 via-background/70 to-background/30",
          theme.layout.heroStyle === 'centered' && "bg-gradient-to-t from-background/90 via-background/60 to-background/40",
          theme.layout.heroStyle === 'split' && "bg-gradient-to-l from-background/95 via-transparent to-transparent",
          theme.layout.heroStyle === 'minimal' && "bg-background/80"
        )} />
      </div>
    );
  };

  // Left-aligned layout (Modern)
  if (theme.layout.heroStyle === 'left-aligned') {
    return (
      <section className="relative min-h-screen flex items-center pt-20">
        {renderBackground()}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className={cn(
              "inline-block px-4 py-2 bg-accent/20 backdrop-blur-sm border border-accent/30 mb-6",
              roundedClass === 'rounded-full' ? 'rounded-full' : roundedClass
            )}>
              <span className="text-accent font-semibold">{tagline}</span>
            </div>
            
            <h1 className={cn(
              "text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight",
              `font-${theme.typography.headingWeight}`
            )}>
              {title}
            </h1>
            
            <p className={cn(
              "text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed p-4",
              theme.effects.blur && "bg-background/30 backdrop-blur-sm",
              roundedClass
            )}>
              {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {company.company_phone && (
                <Button variant="accent" size="lg" className={cn("group", roundedClass)}
                  onClick={() => window.location.href = `tel:${company.company_phone}`}>
                  <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Call Now: {company.company_phone}
                </Button>
              )}
              <Button variant="outline" size="lg" className={roundedClass}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                <Calendar className="w-5 h-5" />
                Schedule Service
              </Button>
            </div>
            
            <div className={cn(
              "bg-background/50 backdrop-blur-sm p-4 border border-border/50",
              roundedClass
            )}>
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
  }

  // Centered layout (Classic)
  if (theme.layout.heroStyle === 'centered') {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {renderBackground()}
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className={cn(
              "inline-flex items-center gap-2 px-6 py-3 bg-secondary/90 text-secondary-foreground mb-8",
              roundedClass
            )}>
              <Star className="w-5 h-5" />
              <span className="font-semibold">{tagline}</span>
              <Star className="w-5 h-5" />
            </div>
            
            <h1 className={cn(
              "text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8 leading-tight",
              `font-${theme.typography.headingWeight}`
            )}>
              {title}
            </h1>
            
            <p className={cn(
              "text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto",
              theme.typography.bodySize === 'lg' && "text-xl md:text-2xl"
            )}>
              {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {company.company_phone && (
                <Button variant="accent" size="lg" className={cn("text-lg px-8", roundedClass)}
                  onClick={() => window.location.href = `tel:${company.company_phone}`}>
                  <Phone className="w-5 h-5" />
                  {company.company_phone}
                </Button>
              )}
              <Button variant="outline" size="lg" className={cn("text-lg px-8", roundedClass)}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Request Appointment
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Overlay layout (Bold)
  if (theme.layout.heroStyle === 'overlay') {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {renderBackground()}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center text-white">
            <div className={cn(
              "inline-block px-6 py-3 bg-accent text-accent-foreground font-bold uppercase tracking-wider mb-8",
              roundedClass
            )}>
              {tagline}
            </div>
            
            <h1 className={cn(
              "text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-none tracking-tight",
              `font-${theme.typography.headingWeight}`
            )}>
              {title}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {company.company_phone && (
                <Button size="lg" className={cn(
                  "text-xl px-10 py-6 bg-accent hover:bg-accent/90 text-accent-foreground",
                  roundedClass
                )}
                  onClick={() => window.location.href = `tel:${company.company_phone}`}>
                  <Phone className="w-6 h-6" />
                  CALL {company.company_phone}
                </Button>
              )}
              <Button size="lg" variant="outline" className={cn(
                "text-xl px-10 py-6 border-white text-white hover:bg-white hover:text-black",
                roundedClass
              )}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                GET A QUOTE
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Split layout (Elegant)
  if (theme.layout.heroStyle === 'split') {
    return (
      <section className="relative min-h-screen flex items-center pt-20">
        {renderBackground()}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2" />
            <div className="md:order-1">
              <span className={cn(
                "inline-block px-4 py-2 text-sm font-medium text-accent bg-accent/10 mb-6",
                roundedClass
              )}>
                {tagline}
              </span>
              
              <h1 className={cn(
                "text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight",
                `font-${theme.typography.headingWeight}`
              )}>
                {title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {company.company_phone && (
                  <Button variant="accent" size="lg" className={cn("group", roundedClass)}
                    onClick={() => window.location.href = `tel:${company.company_phone}`}>
                    <Phone className="w-5 h-5" />
                    {company.company_phone}
                  </Button>
                )}
                <Button variant="outline" size="lg" className={roundedClass}
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                  Schedule Consultation
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Proudly serving:</span>
                <span>{primaryAreas}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Minimal layout
  return (
    <section className="relative min-h-[80vh] flex items-center pt-24">
      {renderBackground()}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">{tagline}</p>
          
          <h1 className={cn(
            "text-4xl sm:text-5xl md:text-6xl mb-8 leading-tight tracking-tight",
            `font-${theme.typography.headingWeight}`
          )}>
            {title}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed border-l-2 border-primary pl-6">
            {description}
          </p>
          
          <div className="flex gap-4">
            {company.company_phone && (
              <Button variant="default" size="lg" className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => window.location.href = `tel:${company.company_phone}`}>
                {company.company_phone}
              </Button>
            )}
            <Button variant="ghost" size="lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Contact Us →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyHero;
