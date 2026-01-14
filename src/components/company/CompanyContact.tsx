import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";

interface Company {
  name: string;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_zip_code: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
  company_support_email: string | null;
}

interface CompanyContactProps {
  company: Company;
  theme: ThemeConfig;
}

const CompanyContact = ({ company, theme }: CompanyContactProps) => {
  const fullAddress = [
    company.company_address,
    company.company_city,
    company.company_state,
    company.company_zip_code
  ].filter(Boolean).join(", ");

  const roundedClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
    'full': 'rounded-3xl',
  }[theme.typography.rounded];

  // Minimal layout
  if (theme.layout.contactLayout === 'minimal') {
    return (
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Get in touch</p>
            <h2 className={cn(
              "text-3xl md:text-4xl mb-12",
              `font-${theme.typography.headingWeight}`
            )}>
              Contact Us
            </h2>
            
            <div className="space-y-8">
              {company.company_phone && (
                <a 
                  href={`tel:${company.company_phone}`}
                  className="flex items-center gap-4 group"
                >
                  <span className="text-muted-foreground">Phone</span>
                  <span className="flex-1 border-b border-dashed border-border" />
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {company.company_phone}
                  </span>
                </a>
              )}
              
              {(company.company_email_primary || company.company_support_email) && (
                <a 
                  href={`mailto:${company.company_email_primary || company.company_support_email}`}
                  className="flex items-center gap-4 group"
                >
                  <span className="text-muted-foreground">Email</span>
                  <span className="flex-1 border-b border-dashed border-border" />
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {company.company_email_primary || company.company_support_email}
                  </span>
                </a>
              )}
              
              {fullAddress && (
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Address</span>
                  <span className="flex-1 border-b border-dashed border-border" />
                  <span className="font-medium">{fullAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Split layout (Bold theme)
  if (theme.layout.contactLayout === 'split') {
    return (
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden" style={{ borderRadius: roundedClass.replace('rounded-', '') === 'none' ? '0' : '1rem' }}>
            {/* Left side - Dark */}
            <div className="bg-foreground text-background p-12">
              <h2 className={cn(
                "text-4xl md:text-5xl mb-6",
                `font-${theme.typography.headingWeight}`
              )}>
                LET'S TALK
              </h2>
              <p className="text-background/70 text-lg mb-8">
                Ready for reliable HVAC service? Reach out to {company.name} today.
              </p>
              
              <div className="space-y-6">
                {company.company_phone && (
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6 text-accent" />
                    <a href={`tel:${company.company_phone}`} className="text-xl font-bold hover:text-accent transition-colors">
                      {company.company_phone}
                    </a>
                  </div>
                )}
                
                {(company.company_email_primary || company.company_support_email) && (
                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6 text-accent" />
                    <a 
                      href={`mailto:${company.company_email_primary || company.company_support_email}`}
                      className="hover:text-accent transition-colors"
                    >
                      {company.company_email_primary || company.company_support_email}
                    </a>
                  </div>
                )}
                
                {fullAddress && (
                  <div className="flex items-center gap-4">
                    <MapPin className="w-6 h-6 text-accent" />
                    <span className="text-background/80">{fullAddress}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Accent */}
            <div className="bg-primary text-primary-foreground p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">24/7 EMERGENCY SERVICE</h3>
              <p className="text-primary-foreground/80 mb-8">
                HVAC emergency? We're here around the clock. Call now for immediate assistance.
              </p>
              {company.company_phone && (
                <Button 
                  size="lg" 
                  variant="secondary"
                  className={cn("w-full text-lg font-bold", roundedClass)}
                  onClick={() => window.location.href = `tel:${company.company_phone}`}
                >
                  CALL NOW
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Centered layout (Elegant theme)
  if (theme.layout.contactLayout === 'centered') {
    return (
      <section id="contact" className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-accent font-medium">We're Here For You</span>
            <h2 className={cn(
              "text-3xl md:text-4xl mt-2 mb-4",
              `font-${theme.typography.headingWeight}`
            )}>
              Get In Touch
            </h2>
            <p className="text-muted-foreground mb-12">
              Experience the {company.name} difference. Contact us today.
            </p>
            
            <div className={cn(
              "bg-card p-8 md:p-12",
              roundedClass,
              theme.effects.shadows && "shadow-xl"
            )}>
              <div className="grid sm:grid-cols-3 gap-8 mb-8">
                {company.company_phone && (
                  <div className="text-center">
                    <div className={cn(
                      "w-14 h-14 bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4",
                      roundedClass
                    )}>
                      <Phone className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <a href={`tel:${company.company_phone}`} className="font-semibold hover:text-primary transition-colors">
                      {company.company_phone}
                    </a>
                  </div>
                )}
                
                {(company.company_email_primary || company.company_support_email) && (
                  <div className="text-center">
                    <div className={cn(
                      "w-14 h-14 bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4",
                      roundedClass
                    )}>
                      <Mail className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <a 
                      href={`mailto:${company.company_email_primary || company.company_support_email}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {company.company_email_primary || company.company_support_email}
                    </a>
                  </div>
                )}
                
                <div className="text-center">
                  <div className={cn(
                    "w-14 h-14 bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4",
                    roundedClass
                  )}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Hours</p>
                  <p className="font-semibold">24/7 Service</p>
                </div>
              </div>
              
              {company.company_phone && (
                <Button 
                  size="lg" 
                  className={cn("w-full sm:w-auto px-12", roundedClass)}
                  onClick={() => window.location.href = `tel:${company.company_phone}`}
                >
                  <Phone className="w-5 h-5" />
                  Call {company.company_phone}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Stacked layout (Classic theme)
  if (theme.layout.contactLayout === 'stacked') {
    return (
      <section id="contact" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={cn(
              "text-3xl md:text-4xl mb-4",
              `font-${theme.typography.headingWeight}`
            )}>
              Contact Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ready to get started? Contact {company.name} today.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className={cn(roundedClass, theme.effects.borders && "border-2")}>
              <CardContent className="p-8 space-y-6">
                {company.company_phone && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Phone className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${company.company_phone}`} className="text-lg font-semibold hover:text-primary transition-colors">
                        {company.company_phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {(company.company_email_primary || company.company_support_email) && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a 
                        href={`mailto:${company.company_email_primary || company.company_support_email}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {company.company_email_primary || company.company_support_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {fullAddress && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-lg font-semibold">{fullAddress}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  {company.company_phone && (
                    <Button 
                      size="lg" 
                      className={cn("w-full", roundedClass)}
                      onClick={() => window.location.href = `tel:${company.company_phone}`}
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  // Default side-by-side layout (Modern)
  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={cn(
            "text-3xl md:text-4xl mb-4",
            `font-${theme.typography.headingWeight}`
          )}>
            Contact Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ready to get started? Contact {company.name} today for all your HVAC needs.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={roundedClass}>
              <CardHeader>
                <CardTitle>Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.company_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href={`tel:${company.company_phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {company.company_phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {(company.company_email_primary || company.company_support_email) && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a 
                        href={`mailto:${company.company_email_primary || company.company_support_email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {company.company_email_primary || company.company_support_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {fullAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{fullAddress}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-muted-foreground">24/7 Emergency Service Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("bg-primary text-primary-foreground", roundedClass)}>
              <CardHeader>
                <CardTitle className="text-primary-foreground">Ready for Service?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-primary-foreground/80">
                  Our team is standing by to help you with all your heating and cooling needs. 
                  Call us now for fast, reliable service.
                </p>
                
                {company.company_phone && (
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className={cn("w-full", roundedClass)}
                    onClick={() => window.location.href = `tel:${company.company_phone}`}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call {company.company_phone}
                  </Button>
                )}
                
                {company.company_email_primary && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={cn("w-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10", roundedClass)}
                    onClick={() => window.location.href = `mailto:${company.company_email_primary}`}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Email Us
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyContact;
