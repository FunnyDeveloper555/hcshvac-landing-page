import { Facebook, Instagram, Youtube } from "lucide-react";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";

interface Company {
  name: string;
  company_phone: string | null;
  company_email_primary: string | null;
  affiliations: Record<string, string> | null;
}

interface CompanyFooterProps {
  company: Company;
  theme: ThemeConfig;
}

const CompanyFooter = ({ company, theme }: CompanyFooterProps) => {
  const socialLinks = company.affiliations ? {
    facebook: company.affiliations.facebook,
    instagram: company.affiliations.instagram,
    youtube: company.affiliations.youtube,
  } : {};

  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  // Minimal footer
  if (theme.layout.footerStyle === 'minimal') {
    return (
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {company.name}
            </p>
            <div className="flex items-center gap-6">
              {company.company_phone && (
                <a href={`tel:${company.company_phone}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {company.company_phone}
                </a>
              )}
              {company.company_email_primary && (
                <a href={`mailto:${company.company_email_primary}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {company.company_email_primary}
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Centered footer
  if (theme.layout.footerStyle === 'centered') {
    return (
      <footer className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-4">{company.name}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Your trusted partner for professional HVAC services.
          </p>
          
          {hasSocialLinks && (
            <div className="flex justify-center gap-4 mb-8">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                   className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                   className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                   className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
          
          <div className="border-t border-border pt-8 text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  // Gradient footer (Bold theme)
  if (theme.layout.footerStyle === 'gradient') {
    return (
      <footer className="bg-gradient-to-r from-foreground via-foreground to-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-black text-background">{company.name}</h3>
              <p className="text-background/70 mt-2">Professional HVAC Services</p>
            </div>
            
            <div className="flex items-center gap-8">
              {company.company_phone && (
                <a href={`tel:${company.company_phone}`} className="text-background font-bold text-lg hover:text-accent transition-colors">
                  {company.company_phone}
                </a>
              )}
              
              {hasSocialLinks && (
                <div className="flex gap-3">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-background transition-colors">
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-background transition-colors">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-background transition-colors">
                      <Youtube className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-background/20 mt-8 pt-6 text-center text-background/50 text-sm">
            <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  // Dark footer (Classic theme)
  if (theme.layout.footerStyle === 'dark') {
    return (
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-semibold mb-4">{company.name}</h3>
              <p className="text-background/70 max-w-md">
                Your trusted partner for professional HVAC services. Heating, cooling, and air quality solutions for your home or business.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-secondary">Contact</h4>
              <ul className="space-y-2 text-background/70 text-sm">
                {company.company_phone && (
                  <li>
                    <a href={`tel:${company.company_phone}`} className="hover:text-background transition-colors">
                      {company.company_phone}
                    </a>
                  </li>
                )}
                {company.company_email_primary && (
                  <li>
                    <a href={`mailto:${company.company_email_primary}`} className="hover:text-background transition-colors">
                      {company.company_email_primary}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-secondary">Follow Us</h4>
              {hasSocialLinks ? (
                <div className="flex gap-4">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-secondary transition-colors">
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-secondary transition-colors">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                       className="text-background/70 hover:text-secondary transition-colors">
                      <Youtube className="w-6 h-6" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-background/50 text-sm">Connect with us</p>
              )}
            </div>
          </div>
          
          <div className="border-t border-background/20 pt-8 text-center text-background/50 text-sm">
            <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  // Standard footer (Modern theme - default)
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{company.name}</h3>
            <p className="text-background/70 text-sm">
              Your trusted partner for professional HVAC services. Heating, cooling, and air quality solutions for your home or business.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Contact</h4>
            <ul className="space-y-2 text-background/70 text-sm">
              {company.company_phone && (
                <li>
                  <a href={`tel:${company.company_phone}`} className="hover:text-background transition-colors">
                    Phone: {company.company_phone}
                  </a>
                </li>
              )}
              {company.company_email_primary && (
                <li>
                  <a href={`mailto:${company.company_email_primary}`} className="hover:text-background transition-colors">
                    Email: {company.company_email_primary}
                  </a>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            {hasSocialLinks ? (
              <div className="flex gap-4">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                     className="text-background/70 hover:text-background transition-colors">
                    <Facebook className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                     className="text-background/70 hover:text-background transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                     className="text-background/70 hover:text-background transition-colors">
                    <Youtube className="w-6 h-6" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-background/50 text-sm">Connect with us on social media</p>
            )}
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/50 text-sm">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <p className="mt-2">Powered by HCS HVAC</p>
        </div>
      </div>
    </footer>
  );
};

export default CompanyFooter;
