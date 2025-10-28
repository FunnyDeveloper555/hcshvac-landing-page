import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceBookingForm from "@/components/ServiceBookingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  detailed_description: string | null;
  icon: string;
  price_from: number | null;
  price_label: string;
}

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);

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
      .single();

    if (data) {
      setService(data);
    }
  };

  if (!service) {
    return null;
  }

  const Icon = (LucideIcons as any)[service.icon] || LucideIcons.Wrench;

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="py-20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {service.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  {service.description}
                </p>
                {service.price_from && (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full mb-8">
                    <span className="text-sm font-medium">{service.price_label}</span>
                    <span className="text-2xl font-bold text-primary">
                      ${service.price_from}
                    </span>
                  </div>
                )}
                
                {service.detailed_description && (
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-semibold mb-4">Service Details</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {service.detailed_description}
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:sticky lg:top-24">
                <ServiceBookingForm serviceId={service.id} serviceName={service.title} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetail;