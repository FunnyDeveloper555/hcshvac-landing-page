import { Phone, Mail, MapPin, Star, Clock, Shield, Wrench, CheckCircle } from "lucide-react";

interface TemplateSection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  settings: Record<string, unknown>;
}

interface TemplateSettings {
  primaryColor?: string;
  fontFamily?: string;
  headerStyle?: string;
}

interface Template {
  name: string;
  description?: string;
  sections: TemplateSection[];
  settings: TemplateSettings;
}

interface TemplatePreviewProps {
  template: Template;
}

export default function TemplatePreview({ template }: TemplatePreviewProps) {
  const primaryColor = template.settings.primaryColor || '#0ea5e9';
  const enabledSections = template.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: TemplateSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <div 
            key={section.id}
            className="relative py-12 px-6 text-white text-center"
            style={{ backgroundColor: primaryColor }}
          >
            {section.settings.showBadge && (
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm mb-4">
                ⭐ 24/7 Emergency Service
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2">Your Trusted HVAC Experts</h1>
            <p className="text-lg opacity-90 mb-6">Professional heating & cooling services in [City]</p>
            {section.settings.showCTA && (
              <div className="flex justify-center gap-3">
                <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-medium">
                  Call Now
                </button>
                <button className="border border-white px-6 py-2 rounded-lg font-medium">
                  Get Quote
                </button>
              </div>
            )}
            {section.settings.showStats && (
              <div className="flex justify-center gap-8 mt-8">
                <div><div className="text-2xl font-bold">25+</div><div className="text-sm opacity-80">Years</div></div>
                <div><div className="text-2xl font-bold">10K+</div><div className="text-sm opacity-80">Customers</div></div>
                <div><div className="text-2xl font-bold">24/7</div><div className="text-sm opacity-80">Service</div></div>
              </div>
            )}
          </div>
        );

      case 'services':
        return (
          <div key={section.id} className="py-10 px-6 bg-gray-50">
            <h2 className="text-2xl font-bold text-center mb-6">Our Services</h2>
            <div className={`grid gap-4 ${section.settings.columns === 4 ? 'grid-cols-4' : section.settings.columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {['AC Repair', 'Heating', 'Installation', 'Maintenance'].slice(0, Number(section.settings.columns) || 3).map((service) => (
                <div key={service} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <Wrench className="h-8 w-8 mx-auto mb-2" style={{ color: primaryColor }} />
                  <h3 className="font-medium">{service}</h3>
                  {section.settings.showPrices && (
                    <p className="text-sm text-muted-foreground mt-1">From $99</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'brands':
        return (
          <div key={section.id} className="py-8 px-6 border-y">
            <p className="text-center text-sm text-muted-foreground mb-4">Brands We Service</p>
            <div className="flex justify-center gap-6 opacity-50">
              {['Carrier', 'Trane', 'Lennox', 'Rheem'].map((brand) => (
                <div key={brand} className="text-lg font-bold">{brand}</div>
              ))}
            </div>
          </div>
        );

      case 'service-areas':
        return (
          <div key={section.id} className="py-10 px-6">
            <h2 className="text-2xl font-bold text-center mb-6">Service Areas</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving'].map((city) => (
                <span key={city} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{city}</span>
              ))}
            </div>
          </div>
        );

      case 'coupons':
        return (
          <div key={section.id} className="py-10 px-6 bg-gray-50">
            <h2 className="text-2xl font-bold text-center mb-6">Special Offers</h2>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: primaryColor }}>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>$50 OFF</div>
                <p className="text-sm">Any Repair Service</p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: primaryColor }}>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>FREE</div>
                <p className="text-sm">Service Call with Repair</p>
              </div>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div key={section.id} className="py-10 px-6">
            <h2 className="text-2xl font-bold text-center mb-6">What Our Customers Say</h2>
            <div className="max-w-xl mx-auto text-center">
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="italic text-muted-foreground">"Excellent service! The technician was professional and fixed our AC quickly."</p>
              <p className="mt-2 font-medium">- John D.</p>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key={section.id} className="py-10 px-6" style={{ backgroundColor: primaryColor }}>
            <div className="flex justify-center gap-12 text-white">
              <div className="text-center">
                <div className="text-4xl font-bold">25+</div>
                <div className="text-sm opacity-80">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">10K+</div>
                <div className="text-sm opacity-80">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">100%</div>
                <div className="text-sm opacity-80">Satisfaction</div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div key={section.id} className="py-10 px-6 bg-gray-50">
            <h2 className="text-2xl font-bold text-center mb-6">Why Choose Us</h2>
            <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
              {[
                { icon: Clock, text: '24/7 Emergency Service' },
                { icon: Shield, text: 'Licensed & Insured' },
                { icon: CheckCircle, text: 'Satisfaction Guaranteed' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <feature.icon className="h-6 w-6" style={{ color: primaryColor }} />
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div key={section.id} className="py-12 px-6 text-center" style={{ backgroundColor: primaryColor }}>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
            <p className="text-white/80 mb-6">Call us today for a free estimate</p>
            <button className="bg-white px-8 py-3 rounded-lg font-medium" style={{ color: primaryColor }}>
              (555) 123-4567
            </button>
          </div>
        );

      case 'contact':
        return (
          <div key={section.id} className="py-10 px-6">
            <h2 className="text-2xl font-bold text-center mb-6">Contact Us</h2>
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                <span>info@hvaccompany.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                <span>123 Main St, City, ST 12345</span>
              </div>
              {section.settings.showForm && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <p className="text-center text-sm text-muted-foreground">[Contact Form Placeholder]</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'about':
        return (
          <div key={section.id} className="py-10 px-6">
            <h2 className="text-2xl font-bold text-center mb-6">About Us</h2>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-muted-foreground">
                With over 25 years of experience, we've been providing top-quality HVAC services 
                to homeowners and businesses throughout the region. Our team of certified technicians 
                is committed to delivering exceptional service and ensuring your complete satisfaction.
              </p>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div key={section.id} className="py-8 px-6 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div>
                <div className="font-bold text-lg">HVAC Company</div>
                <p className="text-sm opacity-60">© 2024 All rights reserved</p>
              </div>
              {section.settings.showSocial && (
                <div className="flex gap-4">
                  <span className="opacity-60 hover:opacity-100 cursor-pointer">Facebook</span>
                  <span className="opacity-60 hover:opacity-100 cursor-pointer">Twitter</span>
                  <span className="opacity-60 hover:opacity-100 cursor-pointer">Instagram</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'header':
        return (
          <div key={section.id} className="py-4 px-6 border-b flex justify-between items-center">
            <div className="font-bold text-xl">HVAC Company</div>
            <div className="flex items-center gap-4">
              {section.settings.showPhone && (
                <span className="font-medium" style={{ color: primaryColor }}>(555) 123-4567</span>
              )}
              <button className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
                Get Quote
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div key={section.id} className="py-8 px-6 border-b">
            <p className="text-center text-muted-foreground capitalize">[{section.type} Section]</p>
          </div>
        );
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white" style={{ fontFamily: template.settings.fontFamily }}>
      {enabledSections.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No sections enabled. Enable sections to see the preview.
        </div>
      ) : (
        enabledSections.map(renderSection)
      )}
    </div>
  );
}
