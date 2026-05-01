import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  // Employee Profile
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "Zip code is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email_address: z.string().email("Invalid email address"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  drivers_license_number: z.string().optional(),
  social_security_number: z.string().optional(),
  us_citizen: z.boolean().optional(),
  city_of_birth: z.string().optional(),
  state_of_birth: z.string().optional(),
  birth_gender: z.string().optional(),
  
  // Education
  high_school: z.string().optional(),
  trade_school: z.string().optional(),
  two_year_college: z.string().optional(),
  four_year_college: z.string().optional(),
  certificates_held: z.string().optional(),
  licenses_held: z.string().optional(),
  
  // Previous Employer
  prev_business_name: z.string().optional(),
  prev_work_address: z.string().optional(),
  prev_work_city: z.string().optional(),
  prev_work_state: z.string().optional(),
  prev_work_zip_code: z.string().optional(),
  prev_work_phone_number: z.string().optional(),
  prev_work_contact_person: z.string().optional(),
  prev_corporate_address: z.string().optional(),
  prev_corporate_city: z.string().optional(),
  prev_corporate_state: z.string().optional(),
  prev_corporate_zip_code: z.string().optional(),
  prev_corporate_phone_number: z.string().optional(),
  prev_corporate_contact_person: z.string().optional(),
  prev_start_month: z.string().optional(),
  prev_start_year: z.string().optional(),
  prev_end_month: z.string().optional(),
  prev_end_year: z.string().optional(),
  prev_starting_position: z.string().optional(),
  prev_ending_position: z.string().optional(),
  prev_reason_for_leaving: z.string().optional(),
  prev_eligible_for_rehire: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EmployeesAdd() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

  const editId = searchParams.get("id");
  const isEditing = !!editId;

  const steps = [
    { title: "Employee Profile", description: "Basic employee information" },
    { title: "Education", description: "Educational background" },
    { title: "Previous Employer", description: "Previous employment information" },
  ];

  const stepFields: (keyof FormValues)[][] = [
    ["first_name", "middle_name", "last_name", "address", "city", "state", "zip_code", "phone_number", "email_address", "date_of_birth", "drivers_license_number", "social_security_number", "us_citizen", "city_of_birth", "state_of_birth", "birth_gender"],
    ["high_school", "trade_school", "two_year_college", "four_year_college", "certificates_held", "licenses_held"],
    ["prev_business_name", "prev_work_address", "prev_work_city", "prev_work_state", "prev_work_zip_code", "prev_work_phone_number", "prev_work_contact_person", "prev_corporate_address", "prev_corporate_city", "prev_corporate_state", "prev_corporate_zip_code", "prev_corporate_phone_number", "prev_corporate_contact_person", "prev_start_month", "prev_start_year", "prev_end_month", "prev_end_year", "prev_starting_position", "prev_ending_position", "prev_reason_for_leaving", "prev_eligible_for_rehire"],
  ];

  const handleNext = async () => {
    const valid = await form.trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      us_citizen: false,
      prev_eligible_for_rehire: false,
    },
  });

  useEffect(() => {
    if (editId) {
      setIsLoading(true);
      supabase
        .from("employees")
        .select("*")
        .eq("id", editId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            toast({
              title: "Error",
              description: "Failed to load employee data",
              variant: "destructive",
            });
          } else if (data) {
            form.reset({
              first_name: data.first_name || "",
              middle_name: data.middle_name || "",
              last_name: data.last_name || "",
              address: data.address || "",
              city: data.city || "",
              state: data.state || "",
              zip_code: data.zip_code || "",
              phone_number: data.phone_number || "",
              email_address: data.email_address || "",
              date_of_birth: data.date_of_birth || "",
              drivers_license_number: data.drivers_license_number || "",
              social_security_number: data.social_security_number || "",
              us_citizen: data.us_citizen || false,
              city_of_birth: data.city_of_birth || "",
              state_of_birth: data.state_of_birth || "",
              birth_gender: data.birth_gender || "",
              high_school: data.high_school || "",
              trade_school: data.trade_school || "",
              two_year_college: data.two_year_college || "",
              four_year_college: data.four_year_college || "",
              certificates_held: data.certificates_held || "",
              licenses_held: data.licenses_held || "",
              prev_business_name: data.prev_business_name || "",
              prev_work_address: data.prev_work_address || "",
              prev_work_city: data.prev_work_city || "",
              prev_work_state: data.prev_work_state || "",
              prev_work_zip_code: data.prev_work_zip_code || "",
              prev_work_phone_number: data.prev_work_phone_number || "",
              prev_work_contact_person: data.prev_work_contact_person || "",
              prev_corporate_address: data.prev_corporate_address || "",
              prev_corporate_city: data.prev_corporate_city || "",
              prev_corporate_state: data.prev_corporate_state || "",
              prev_corporate_zip_code: data.prev_corporate_zip_code || "",
              prev_corporate_phone_number: data.prev_corporate_phone_number || "",
              prev_corporate_contact_person: data.prev_corporate_contact_person || "",
              prev_start_month: data.prev_start_month || "",
              prev_start_year: data.prev_start_year || "",
              prev_end_month: data.prev_end_month || "",
              prev_end_year: data.prev_end_year || "",
              prev_starting_position: data.prev_starting_position || "",
              prev_ending_position: data.prev_ending_position || "",
              prev_reason_for_leaving: data.prev_reason_for_leaving || "",
              prev_eligible_for_rehire: data.prev_eligible_for_rehire || false,
            });
          }
          setIsLoading(false);
        });
    }
  }, [editId, form, toast]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        const { error } = await supabase
          .from("employees")
          .update(values)
          .eq("id", editId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
        navigate("/admin/employees/list");
      } else {
        const { error } = await supabase.from("employees").insert([values]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee added successfully",
        });
        form.reset();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Profile */}
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Employee" : "Add Employee"}</CardTitle>
              <CardDescription>Basic employee information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drivers_license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drivers License Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="social_security_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="us_citizen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">U.S Citizen</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birth_gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Gender</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="high_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>High School</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trade_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade School</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="two_year_college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2 Year College</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="four_year_college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4 Year College</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="certificates_held"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificates Held</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenses_held"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licenses Held</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Previous Employer */}
          <Card>
            <CardHeader>
              <CardTitle>Previous Employer</CardTitle>
              <CardDescription>Previous employment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prev_business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prev_work_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address of Your Work Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prev_work_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_work_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_work_zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prev_work_phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_work_contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person of Contact</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prev_corporate_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>(If Applicable) Address of Corporate/Main Office Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prev_corporate_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_corporate_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_corporate_zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prev_corporate_phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_corporate_contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person of Contact</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="prev_start_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Month</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
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
                  name="prev_start_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="YYYY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_end_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Month</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
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
                  name="prev_end_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="YYYY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prev_starting_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Position</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prev_ending_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ending Position Held</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prev_reason_for_leaving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason For Leaving</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prev_eligible_for_rehire"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Eligible for Rehire</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : (
              isEditing ? "Update Employee" : "Add Employee"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
