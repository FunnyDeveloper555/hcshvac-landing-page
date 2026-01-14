import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
}

const CompanyContact = ({ company }: CompanyContactProps) => {
  const fullAddress = [
    company.company_address,
    company.company_city,
    company.company_state,
    company.company_zip_code
  ].filter(Boolean).join(", ");

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ready to get started? Contact {company.name} today for all your HVAC needs.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.company_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a 
                        href={`tel:${company.company_phone}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
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

            {/* CTA Card */}
            <Card className="bg-primary text-primary-foreground">
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
                    className="w-full"
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
                    className="w-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
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
