import { Facebook, Instagram, Youtube } from "lucide-react";

interface Company {
  name: string;
  company_phone: string | null;
  company_email_primary: string | null;
  affiliations: Record<string, string> | null;
}

interface CompanyFooterProps {
  company: Company;
}

const CompanyFooter = ({ company }: CompanyFooterProps) => {
  const socialLinks = company.affiliations ? {
    facebook: company.affiliations.facebook,
    instagram: company.affiliations.instagram,
    youtube: company.affiliations.youtube,
  } : {};

  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{company.name}</h3>
            <p className="text-background/70 text-sm">
              Your trusted partner for professional HVAC services. Heating, cooling, and air quality solutions for your home or business.
            </p>
          </div>
          
          {/* Quick Contact */}
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
          
          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            {hasSocialLinks ? (
              <div className="flex gap-4">
                {socialLinks.facebook && (
                  <a 
                    href={socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-background/70 hover:text-background transition-colors"
                  >
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
          <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <p className="mt-2">Powered by HCS HVAC</p>
        </div>
      </div>
    </footer>
  );
};

export default CompanyFooter;
