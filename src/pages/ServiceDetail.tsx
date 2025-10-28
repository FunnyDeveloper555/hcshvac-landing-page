import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import ServiceBookingForm from "@/components/ServiceBookingForm";

interface Service {
  id: string;
  title: string;
  description: string;
  detailed_description: string | null;
  icon: string;
  price_from: number | null;
  price_label: string | null;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      setService(data);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wrench;
    return Icon;
  };

  if (!service) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = getIcon(service.icon);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-20">
          <div className="container mx-auto px-4">
            <Link to="/#services">
              <Button variant="ghost" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </Link>
            
            <div className="max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{service.title}</h1>
                  {service.price_from && (
                    <div className="flex items-baseline gap-2">
                      <Badge variant="secondary">{service.price_label}</Badge>
                      <span className="text-3xl font-bold text-primary">${service.price_from}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xl text-muted-foreground mb-8">
                {service.description}
              </p>
              
              <Button size="lg" onClick={() => setShowBooking(true)} className="shadow-lg">
                Book This Service
              </Button>
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {service.detailed_description && (
                <div className="prose prose-lg max-w-none mb-12">
                  <h2 className="text-3xl font-bold mb-6">Service Details</h2>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {service.detailed_description}
                  </div>
                </div>
              )}
              
              <div className="bg-card border rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6">What's Included</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Professional consultation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Expert technicians</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Quality parts & equipment</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Warranty coverage</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Follow-up support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Satisfaction guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        {showBooking && (
          <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
              <ServiceBookingForm 
                serviceId={service.id} 
                serviceName={service.title}
                onClose={() => setShowBooking(false)}
              />
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ServiceDetail;
