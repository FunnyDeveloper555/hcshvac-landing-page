import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

const industrySchema = z.object({
  product_category: z.string().min(2, "Category is required"),
  product_brand_name: z.string().min(2, "Brand name is required"),
});

const formSchema = z.object({
  vendor_name: z.string().min(2, "Vendor name is required"),
  vendor_address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  website: z.string().url("Valid URL required").or(z.literal("")),
  hours_of_operation: z.string().optional(),
  representative_first_name: z.string().min(2, "First name is required"),
  representative_last_name: z.string().min(2, "Last name is required"),
  representative_phone: z.string().min(10, "Valid phone number is required"),
  representative_email: z.string().email("Valid email is required"),
  our_account_number: z.string().optional(),
  industries: z.array(industrySchema).min(1, "At least one industry is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const VendorRegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendor_name: "",
      vendor_address: "",
      phone: "",
      website: "",
      hours_of_operation: "",
      representative_first_name: "",
      representative_last_name: "",
      representative_phone: "",
      representative_email: "",
      our_account_number: "",
      industries: [{ product_category: "", product_brand_name: "" }],
    },
  });

  const industries = form.watch("industries");

  const addIndustry = () => {
    form.setValue("industries", [
      ...industries,
      { product_category: "", product_brand_name: "" },
    ]);
  };

  const removeIndustry = (index: number) => {
    if (industries.length > 1) {
      form.setValue(
        "industries",
        industries.filter((_, i) => i !== index)
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("vendor-logos")
          .upload(fileName, logoFile);

        if (uploadError) {
          throw new Error(`Logo upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("vendor-logos")
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Insert vendor
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          vendor_name: values.vendor_name,
          vendor_address: values.vendor_address,
          phone: values.phone,
          website: values.website || null,
          hours_of_operation: values.hours_of_operation || null,
          representative_first_name: values.representative_first_name,
          representative_last_name: values.representative_last_name,
          representative_phone: values.representative_phone,
          representative_email: values.representative_email,
          logo_url: logoUrl,
          our_account_number: values.our_account_number || null,
        })
        .select()
        .single();

      if (vendorError) throw vendorError;

      // Insert industries
      const industriesToInsert = values.industries.map((industry) => ({
        vendor_id: vendor.id,
        product_category: industry.product_category,
        product_brand_name: industry.product_brand_name,
      }));

      const { error: industriesError } = await supabase
        .from("vendor_industries")
        .insert(industriesToInsert);

      if (industriesError) throw industriesError;

      toast({
        title: "Success!",
        description: "Vendor registration submitted successfully.",
      });

      form.reset();
      setLogoFile(null);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vendor Information</h3>
          
          <FormField
            control={form.control}
            name="vendor_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendor_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main St, City, State, ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hours_of_operation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours of Operation</FormLabel>
                <FormControl>
                  <Input placeholder="Mon-Fri 9AM-5PM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Vendor Logo</FormLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
          </div>

          <FormField
            control={form.control}
            name="our_account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Our Account Number</FormLabel>
                <FormControl>
                  <Input placeholder="ACC-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vendor Representative</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="representative_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="representative_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="representative_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="representative_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Industries Represented</h3>
            <Button type="button" onClick={addIndustry} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Another
            </Button>
          </div>

          {industries.map((_, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Industry #{index + 1}</p>
                {industries.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeIndustry(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`industries.${index}.product_category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Product Category</FormLabel>
                      <FormControl>
                        <Input placeholder="HVAC Equipment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`industries.${index}.product_brand_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Product Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Carrier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Vendor Registration"}
        </Button>
      </form>
    </Form>
  );
};
