import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ShipToSection from "./registration/ShipToSection";
import BillToSection from "./registration/BillToSection";
import LocationProfileSection from "./registration/LocationProfileSection";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  ship_to_first_name: z.string().trim().min(2, "First name required").max(100),
  ship_to_last_name: z.string().trim().min(2, "Last name required").max(100),
  ship_to_business_name: z.string().trim().max(200).optional().or(z.literal("")),
  ship_to_address: z.string().trim().min(5, "Address required").max(500),
  ship_to_suite_number: z.string().trim().max(50).optional().or(z.literal("")),
  ship_to_city: z.string().trim().min(2, "City required").max(100),
  ship_to_state: z.string().trim().min(2, "State required").max(50),
  ship_to_zip_code: z.string().trim().min(5, "Zip code required").max(10),
  
  bill_to_same_as_ship_to: z.boolean().optional(),
  bill_to_first_name: z.string().trim().max(100).optional().or(z.literal("")),
  bill_to_last_name: z.string().trim().max(100).optional().or(z.literal("")),
  bill_to_business_name: z.string().trim().max(200).optional().or(z.literal("")),
  bill_to_address: z.string().trim().max(500).optional().or(z.literal("")),
  bill_to_suite_number: z.string().trim().max(50).optional().or(z.literal("")),
  bill_to_city: z.string().trim().max(100).optional().or(z.literal("")),
  bill_to_state: z.string().trim().max(50).optional().or(z.literal("")),
  bill_to_zip_code: z.string().trim().max(10).optional().or(z.literal("")),
  
  location_age_years: z.number().min(0).max(200).optional(),
  location_type: z.enum(["residential", "commercial", "industrial", "educational"]),
  
  residential_type: z.enum(["single_family", "condo", "townhome", "multi_dwelling"]).optional(),
  residential_occupancy: z.enum(["owner_occupied", "tenant_occupied", "not_occupied"]).optional(),
  
  building_occupied: z.boolean().optional(),
  point_of_contact_name: z.string().trim().max(100).optional().or(z.literal("")),
  point_of_contact_phone: z.string().trim().max(20).optional().or(z.literal("")),
  point_of_contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  equipment_location: z.string().trim().max(500).optional().or(z.literal("")),
  type_of_use: z.string().trim().max(500).optional().or(z.literal("")),
  cautions_restrictions: z.string().trim().max(1000).optional().or(z.literal("")),
  hours_of_operation: z.string().trim().max(200).optional().or(z.literal("")),
});

const CustomerRegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sameAsShipTo, setSameAsShipTo] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ship_to_first_name: "",
      ship_to_last_name: "",
      ship_to_business_name: "",
      ship_to_address: "",
      ship_to_suite_number: "",
      ship_to_city: "",
      ship_to_state: "",
      ship_to_zip_code: "",
      bill_to_same_as_ship_to: false,
      bill_to_first_name: "",
      bill_to_last_name: "",
      bill_to_business_name: "",
      bill_to_address: "",
      bill_to_suite_number: "",
      bill_to_city: "",
      bill_to_state: "",
      bill_to_zip_code: "",
      location_age_years: 0,
      location_type: "residential",
      residential_type: undefined,
      residential_occupancy: undefined,
      building_occupied: undefined,
      point_of_contact_name: "",
      point_of_contact_phone: "",
      point_of_contact_email: "",
      equipment_location: "",
      type_of_use: "",
      cautions_restrictions: "",
      hours_of_operation: "",
    },
  });

  const locationType = form.watch("location_type");

  const handleSameAsShipToChange = (checked: boolean) => {
    setSameAsShipTo(checked);
    form.setValue("bill_to_same_as_ship_to", checked);
    
    if (checked) {
      const shipToValues = form.getValues();
      form.setValue("bill_to_first_name", shipToValues.ship_to_first_name);
      form.setValue("bill_to_last_name", shipToValues.ship_to_last_name);
      form.setValue("bill_to_business_name", shipToValues.ship_to_business_name);
      form.setValue("bill_to_address", shipToValues.ship_to_address);
      form.setValue("bill_to_suite_number", shipToValues.ship_to_suite_number);
      form.setValue("bill_to_city", shipToValues.ship_to_city);
      form.setValue("bill_to_state", shipToValues.ship_to_state);
      form.setValue("bill_to_zip_code", shipToValues.ship_to_zip_code);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("customer_registrations")
        .insert([values]);

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "We'll contact you soon regarding your service request.",
      });

      form.reset();
      setSameAsShipTo(false);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="register" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Registration Profile Form
            </h2>
            <p className="text-muted-foreground text-lg">
              Complete your registration to get started with our services
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <ShipToSection form={form} />
              
              <Separator />
              
              <BillToSection 
                form={form} 
                sameAsShipTo={sameAsShipTo}
                onSameAsShipToChange={handleSameAsShipToChange}
              />
              
              <Separator />
              
              <LocationProfileSection form={form} locationType={locationType} />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default CustomerRegistrationForm;