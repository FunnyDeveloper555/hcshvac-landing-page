import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  ship_to_first_name: z.string().min(2, "Required"),
  ship_to_last_name: z.string().min(2, "Required"),
  ship_to_business_name: z.string().default(""),
  ship_to_address: z.string().min(5, "Required"),
  ship_to_suite_number: z.string().default(""),
  ship_to_city: z.string().min(2, "Required"),
  ship_to_state: z.string().min(1, "Required"),
  ship_to_zip_code: z.string().min(5, "Required"),
  bill_to_same_as_ship_to: z.boolean(),
  bill_to_first_name: z.string().default(""),
  bill_to_last_name: z.string().default(""),
  bill_to_business_name: z.string().default(""),
  bill_to_address: z.string().default(""),
  bill_to_suite_number: z.string().default(""),
  bill_to_city: z.string().default(""),
  bill_to_state: z.string().default(""),
  bill_to_zip_code: z.string().default(""),
  location_age_years: z.coerce.number().int().min(0).optional().or(z.literal(0)),
  location_type: z.string().min(1, "Required"),
  residential_type: z.string().default(""),
  residential_occupancy: z.string().default(""),
  building_occupied: z.string().default(""),
  point_of_contact_name: z.string().default(""),
  point_of_contact_phone: z.string().default(""),
  point_of_contact_email: z.string().default(""),
  equipment_location: z.string().default(""),
  type_of_use: z.string().default(""),
  cautions_restrictions: z.string().default(""),
  hours_of_operation: z.string().default(""),
});

type FormData = z.infer<typeof formSchema>;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const CustomerRegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
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
      location_type: "",
      residential_type: "",
      residential_occupancy: "",
      building_occupied: "",
      point_of_contact_name: "",
      point_of_contact_phone: "",
      point_of_contact_email: "",
      equipment_location: "",
      type_of_use: "",
      cautions_restrictions: "",
      hours_of_operation: "",
    },
  });

  const sameAsShipTo = form.watch("bill_to_same_as_ship_to");
  const locationType = form.watch("location_type");

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    
    console.log("Form submission started", values);
    
    try {
      const insertPromise = supabase
        .from("customer_registrations")
        .insert([values])
        .select();

      // Fail fast if backend is unreachable
      const timeoutMs = 12000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Network timeout: unable to reach server")), timeoutMs)
      );

      const result = (await Promise.race([insertPromise, timeoutPromise])) as any;
      const { data, error } = result || {};

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast({
        title: "Registration Successful!",
        description: "We'll contact you soon regarding your service request.",
      });

      form.reset();
    } catch (error: any) {
      console.error("Form submission error:", error);
      const isNetworkIssue =
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("Network timeout") ||
        error?.status === 0;
      toast({
        title: "Registration Failed",
        description: isNetworkIssue
          ? "We’re having trouble connecting right now. Please check your internet and try again shortly."
          : error?.message || "Please try again or call us directly.",
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
              Customer Registration Profile
            </h2>
            <p className="text-muted-foreground text-lg">
              Complete your registration to get started
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Ship To Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Ship To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ship_to_first_name"
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
                      name="ship_to_last_name"
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

                  <FormField
                    control={form.control}
                    name="ship_to_business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ship_to_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ship_to_suite_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suite Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Suite 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="ship_to_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ship_to_state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ship_to_zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bill To Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Bill To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="bill_to_same_as_ship_to"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Same as Ship To
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {!sameAsShipTo && (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="bill_to_first_name"
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
                          name="bill_to_last_name"
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

                      <FormField
                        control={form.control}
                        name="bill_to_business_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corp" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bill_to_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bill_to_suite_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suite Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Suite 100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="bill_to_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bill_to_state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {US_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bill_to_zip_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Location Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Ship To Location Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="location_age_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age of Location (Years)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="educational">Educational Facility</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Residential Details */}
                  {locationType === "residential" && (
                    <>
                      <FormField
                        control={form.control}
                        name="residential_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Residential Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single_family">Single Family Home</SelectItem>
                                <SelectItem value="condo">Condo</SelectItem>
                                <SelectItem value="townhome">Townhome</SelectItem>
                                <SelectItem value="multi_dwelling">Multi Dwelling Unit Building</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="residential_occupancy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupancy Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select occupancy" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
                                <SelectItem value="tenant_occupied">Tenant Occupied</SelectItem>
                                <SelectItem value="not_occupied">Not Occupied</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Commercial/Industrial/Educational Details */}
                  {(locationType === "commercial" || locationType === "industrial" || locationType === "educational") && (
                    <>
                      <FormField
                        control={form.control}
                        name="building_occupied"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building Occupancy</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Is building occupied?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Building is Occupied</SelectItem>
                                <SelectItem value="false">Not Occupied</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <h4 className="font-semibold">Point of Contact</h4>
                        <div className="grid md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="point_of_contact_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="point_of_contact_phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="point_of_contact_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="equipment_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipment Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Basement, Roof, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type_of_use"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Type of {locationType === "commercial" ? "Commercial" : locationType === "industrial" ? "Industrial" : "Educational"} Use
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Describe the type of use" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cautions_restrictions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cautions/Restrictions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any cautions or restrictions to be aware of..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    </>
                  )}
                </CardContent>
              </Card>

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