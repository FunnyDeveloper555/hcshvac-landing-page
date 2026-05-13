import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Phone,
  IdCard,
  GraduationCap,
  Award,
  Briefcase,
  Building2,
  CalendarRange,
  FileText,
  Upload,
  X,
  Sparkles,
  Eye,
  EyeOff,
  Users,
  Languages as LanguagesIcon,
  ClipboardCheck,
  Globe,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Format a raw alphanumeric string into groups separated by dashes
function formatGroups(raw: string, groups: number[], alphanumeric = false): string {
  const cleaned = (raw || "")
    .toUpperCase()
    .replace(alphanumeric ? /[^A-Z0-9]/g : /\D/g, "")
    .slice(0, groups.reduce((a, b) => a + b, 0));
  const parts: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= cleaned.length) break;
    parts.push(cleaned.slice(i, i + g));
    i += g;
  }
  return parts.join("-");
}

// Mask all but the last `visibleTail` characters (preserving dashes)
function maskValue(formatted: string, visibleTail = 4): string {
  if (!formatted) return "";
  const chars = formatted.split("");
  const total = chars.filter((c) => c !== "-").length;
  let seenAlnum = 0;
  return chars
    .map((c) => {
      if (c === "-") return c;
      seenAlnum += 1;
      const fromEnd = total - seenAlnum;
      return fromEnd < visibleTail ? c : "•";
    })
    .join("");
}

function SecureMaskedInput({
  value,
  onChange,
  groups,
  alphanumeric = false,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  groups: number[];
  alphanumeric?: boolean;
  placeholder?: string;
}) {
  const [reveal, setReveal] = useState(false);
  const formatted = formatGroups(value || "", groups, alphanumeric);
  return (
    <div className="relative">
      <Input
        type={reveal ? "text" : "password"}
        value={formatted}
        placeholder={placeholder}
        onChange={(e) => onChange(formatGroups(e.target.value, groups, alphanumeric))}
        inputMode={alphanumeric ? "text" : "numeric"}
        autoComplete="off"
        className="pr-10 font-mono tracking-wider"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setReveal((r) => !r)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={reveal ? "Hide" : "Show"}
      >
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

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

  // Education (multiple)
  educations: z.array(z.object({
    id: z.string().optional(),
    school_type: z.string().optional(),
    school_name: z.string().optional(),
    certificates_held: z.string().optional(),
    licenses_held: z.string().optional(),
  })).optional(),

  // Previous Employers (multiple)
  previous_employers: z.array(z.object({
    id: z.string().optional(),
    prev_business_name: z.string().optional(),
    prev_corporate_name: z.string().optional(),
    prev_website_url: z.string().optional(),
    prev_work_address: z.string().optional(),
    prev_work_city: z.string().optional(),
    prev_work_state: z.string().optional(),
    prev_work_zip_code: z.string().optional(),
    prev_work_phone_number: z.string().optional(),
    prev_work_phone_extension: z.string().optional(),
    prev_work_contact_person: z.string().optional(),
    prev_corporate_address: z.string().optional(),
    prev_corporate_city: z.string().optional(),
    prev_corporate_state: z.string().optional(),
    prev_corporate_zip_code: z.string().optional(),
    prev_corporate_phone_number: z.string().optional(),
    prev_corporate_phone_extension: z.string().optional(),
    prev_corporate_contact_person: z.string().optional(),
    prev_start_month: z.string().optional(),
    prev_start_year: z.string().optional(),
    prev_end_month: z.string().optional(),
    prev_end_year: z.string().optional(),
    prev_starting_position: z.string().optional(),
    prev_ending_position: z.string().optional(),
    prev_reason_for_leaving: z.string().optional(),
    prev_eligible_for_rehire: z.boolean().optional(),
  })).optional(),

  // References (multiple)
  references: z.array(z.object({
    id: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
    position_held: z.string().optional(),
    phone_number: z.string().optional(),
    email_address: z.string().optional(),
    known_for: z.string().optional(),
    validates_strengths: z.string().optional(),
  })).optional(),

  // Languages
  languages: z.array(z.string()).optional(),
  languages_other: z.string().optional(),

  // Comfort assessment
  comfort_assessment: z.record(z.string(), z.boolean()).optional(),

  // Resume
  resume_certificates_achievements: z.string().optional(),
  resume_certificates_file_url: z.string().optional(),
  resume_skills: z.string().optional(),
  resume_summary: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "Italian", "Hindi", "Urdu", "Punjabi",
  "Greek/Arabic", "Chinese", "Japanese", "German",
];

const COMFORT_ITEMS: { key: string; label: string }[] = [
  { key: "heights", label: "Heights (above standard roofs of 20' and higher)" },
  { key: "ladders", label: "Ladders" },
  { key: "access_hatch_ladders", label: "Access hatch ladders" },
  { key: "tight_spaces", label: "Small tight spaces" },
  { key: "attics", label: "Attics" },
  { key: "crawl_in_attics", label: "Crawl in attics" },
  { key: "crawl_spaces", label: "Crawl spaces" },
  { key: "roof_tops", label: "Roof tops" },
  { key: "under_building", label: "Under the building/home" },
  { key: "extreme_heat", label: "Extremely above-temperature work areas" },
  { key: "extreme_cold", label: "Extremely cold-temperature work areas" },
  { key: "carry_uniform", label: "Carrying a complete change of uniform clothing at all times" },
  { key: "heavy_loads", label: "Carrying, lifting, moving, relocating, bracing or supporting heavy loads daily" },
  { key: "team_compliant", label: "Working with others as a team and completing group tasks" },
  { key: "follow_instructions", label: "Following instructions of a task manager" },
  { key: "deliver_instructions", label: "Delivering instructions as the task manager" },
  { key: "non_aggressive_comm", label: "Communicating in a non-aggressive manner with staff, clients, vendors, and customers" },
  { key: "display_credentials", label: "Carrying and displaying all required company credentials" },
  { key: "comm_strangers", label: "Communicating with strangers" },
  { key: "comm_same_gender", label: "Business communication with the same gender only" },
  { key: "comm_opposite_gender", label: "Business communication with the opposite gender only" },
  { key: "comm_multi_gender", label: "Business communication with multiple people/genders where you are the focus point" },
  { key: "formal_writing", label: "Writing formal reports in a structured, grammatically correct English format" },
];

// Section heading inside a step
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-border/60">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function EmployeesAdd() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadingCert, setUploadingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement | null>(null);

  const editId = searchParams.get("id");
  const isEditing = !!editId;

  const steps = [
    { title: "Profile", description: "Personal details", icon: User },
    { title: "Education", description: "Schooling & licenses", icon: GraduationCap },
    { title: "Employment", description: "Previous employer", icon: Briefcase },
    { title: "References", description: "Professional references", icon: Users },
    { title: "Languages", description: "Spoken languages", icon: LanguagesIcon },
    { title: "Assessment", description: "Comfort & abilities", icon: ClipboardCheck },
    { title: "Resume", description: "Skills & summary", icon: FileText },
  ];

  const stepFields: (keyof FormValues)[][] = [
    ["first_name", "middle_name", "last_name", "address", "city", "state", "zip_code", "phone_number", "email_address", "date_of_birth", "drivers_license_number", "social_security_number", "us_citizen", "city_of_birth", "state_of_birth", "birth_gender"],
    ["educations"],
    ["previous_employers"],
    ["references"],
    ["languages", "languages_other"],
    ["comfort_assessment"],
    ["resume_certificates_achievements", "resume_certificates_file_url", "resume_skills", "resume_summary"],
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      us_citizen: false,
      educations: [],
      previous_employers: [],
      references: [],
      languages: [],
      languages_other: "",
      comfort_assessment: {},
    },
  });

  const educationsArray = useFieldArray({ control: form.control, name: "educations" });
  const employersArray = useFieldArray({ control: form.control, name: "previous_employers" });
  const referencesArray = useFieldArray({ control: form.control, name: "references" });

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const valid = await form.trigger(stepFields[step]);
    if (valid) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (editId) {
      setIsLoading(true);
      (async () => {
        const [empRes, eduRes, prevRes, refRes] = await Promise.all([
          supabase.from("employees").select("*").eq("id", editId).single(),
          supabase.from("employee_education" as any).select("*").eq("employee_id", editId).order("sort_order"),
          supabase.from("employee_previous_employers" as any).select("*").eq("employee_id", editId).order("sort_order"),
          supabase.from("employee_references" as any).select("*").eq("employee_id", editId).order("sort_order"),
        ]);
        if (empRes.error || !empRes.data) {
          toast({ title: "Error", description: "Failed to load employee data", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const data = empRes.data;
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
          educations: ((eduRes.data as any[]) || []).map((e) => ({
            id: e.id,
            school_type: e.school_type || "",
            school_name: e.school_name || "",
            certificates_held: e.certificates_held || "",
            licenses_held: e.licenses_held || "",
          })),
          previous_employers: ((prevRes.data as any[]) || []).map((p) => ({
            id: p.id,
            prev_business_name: p.prev_business_name || "",
            prev_work_address: p.prev_work_address || "",
            prev_work_city: p.prev_work_city || "",
            prev_work_state: p.prev_work_state || "",
            prev_work_zip_code: p.prev_work_zip_code || "",
            prev_work_phone_number: p.prev_work_phone_number || "",
            prev_work_contact_person: p.prev_work_contact_person || "",
            prev_corporate_address: p.prev_corporate_address || "",
            prev_corporate_city: p.prev_corporate_city || "",
            prev_corporate_state: p.prev_corporate_state || "",
            prev_corporate_zip_code: p.prev_corporate_zip_code || "",
            prev_corporate_phone_number: p.prev_corporate_phone_number || "",
            prev_corporate_contact_person: p.prev_corporate_contact_person || "",
            prev_start_month: p.prev_start_month || "",
            prev_start_year: p.prev_start_year || "",
            prev_end_month: p.prev_end_month || "",
            prev_end_year: p.prev_end_year || "",
            prev_starting_position: p.prev_starting_position || "",
            prev_ending_position: p.prev_ending_position || "",
            prev_reason_for_leaving: p.prev_reason_for_leaving || "",
            prev_eligible_for_rehire: p.prev_eligible_for_rehire || false,
          })),
          resume_certificates_achievements: data.resume_certificates_achievements || "",
          resume_certificates_file_url: (data as any).resume_certificates_file_url || "",
          resume_skills: data.resume_skills || "",
          resume_summary: data.resume_summary || "",
        });
        setIsLoading(false);
      })();
    }
  }, [editId, form, toast]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const { educations = [], previous_employers = [], ...employeeFields } = values;

      let employeeId = editId as string | null;

      if (isEditing) {
        const { error } = await supabase
          .from("employees")
          .update(employeeFields as any)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("employees")
          .insert([employeeFields as any])
          .select("id")
          .single();
        if (error) throw error;
        employeeId = data.id;
      }

      if (employeeId) {
        // Replace child rows
        await supabase.from("employee_education" as any).delete().eq("employee_id", employeeId);
        await supabase.from("employee_previous_employers" as any).delete().eq("employee_id", employeeId);

        if (educations.length) {
          const eduRows = educations.map((e, idx) => ({
            employee_id: employeeId,
            school_type: e.school_type || null,
            school_name: e.school_name || null,
            certificates_held: e.certificates_held || null,
            licenses_held: e.licenses_held || null,
            sort_order: idx,
          }));
          const { error } = await supabase.from("employee_education" as any).insert(eduRows);
          if (error) throw error;
        }

        if (previous_employers.length) {
          const prevRows = previous_employers.map((p, idx) => ({
            employee_id: employeeId,
            ...p,
            id: undefined,
            sort_order: idx,
          }));
          const { error } = await supabase.from("employee_previous_employers" as any).insert(prevRows);
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: isEditing ? "Employee updated successfully" : "Employee added successfully",
      });
      if (isEditing) {
        navigate("/admin/employees/list");
      } else {
        form.reset();
        setStep(0);
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


  const handleCertFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    try {
      setUploadingCert(true);
      const ext = file.name.split(".").pop() || "bin";
      const path = `certificates/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("employee-files")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("employee-files").getPublicUrl(path);
      form.setValue("resume_certificates_file_url", pub.publicUrl, { shouldDirty: true });
      toast({ title: "Uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCert(false);
      if (certFileInputRef.current) certFileInputRef.current.value = "";
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
    "July", "August", "September", "October", "November", "December",
  ];

  const certFileUrl = form.watch("resume_certificates_file_url");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEditing ? "Edit Employee" : "New Employee"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete all four steps to {isEditing ? "update the" : "create a new"} employee record.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Step {step + 1} of {steps.length}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Stepper */}
          <Card className="border-border/60">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = i === step;
                  const isComplete = i < step;
                  return (
                    <div key={s.title} className="flex items-center flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => i < step && setStep(i)}
                        className={cn(
                          "flex items-center gap-3 min-w-0 group",
                          i < step ? "cursor-pointer" : "cursor-default"
                        )}
                      >
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 shrink-0 transition-all",
                            isActive && "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20",
                            isComplete && "bg-primary/10 text-primary border-primary",
                            !isActive && !isComplete && "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="hidden sm:block min-w-0 text-left">
                          <div className={cn(
                            "text-xs uppercase tracking-wider font-medium",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            Step {i + 1}
                          </div>
                          <div className={cn(
                            "text-sm font-semibold truncate",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {s.title}
                          </div>
                        </div>
                      </button>
                      {i < steps.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-3 rounded-full transition-colors",
                          i < step ? "bg-primary" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* STEP 1 — Profile */}
          <div className={cn(step !== 0 && "hidden")}>
            <Card className="border-border/60">
              <CardHeader className="border-b border-border/60 bg-muted/30">
                <CardTitle className="text-lg">Employee Profile</CardTitle>
                <CardDescription>Personal and contact information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Identity */}
                <section className="space-y-4">
                  <SectionHeader icon={User} title="Identity" description="Legal name on record" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="middle_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>

                {/* Address */}
                <section className="space-y-4">
                  <SectionHeader icon={MapPin} title="Residential Address" />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zip_code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>

                {/* Contact */}
                <section className="space-y-4">
                  <SectionHeader icon={Phone} title="Contact" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email_address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>

                {/* Identification */}
                <section className="space-y-4">
                  <SectionHeader icon={IdCard} title="Identification" description="Sensitive — handled with care" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="drivers_license_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver's License Number</FormLabel>
                        <FormControl>
                          <SecureMaskedInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            groups={[4, 4, 5]}
                            alphanumeric
                            placeholder="XXXX-XXXX-XXXXX"
                          />
                        </FormControl>
                        <FormDescription>Hidden by default. Click the eye to reveal.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="social_security_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number</FormLabel>
                        <FormControl>
                          <SecureMaskedInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            groups={[3, 2, 4]}
                            placeholder="XXX-XX-XXXX"
                          />
                        </FormControl>
                        <FormDescription>Hidden by default. Click the eye to reveal.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="us_citizen" render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border border-border bg-muted/30 p-3 mt-7">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">U.S. Citizen</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City of Birth</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State of Birth</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="birth_gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            className="flex gap-4 pt-2"
                          >
                            {["Male", "Female", "Other"].map((g) => (
                              <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
                                <RadioGroupItem value={g} /> {g}
                              </label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>

          {/* STEP 2 — Education */}
          <div className={cn(step !== 1 && "hidden")}>
            <Card className="border-border/60">
              <CardHeader className="border-b border-border/60 bg-muted/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Education & Credentials</CardTitle>
                  <CardDescription>Add one or more schools, certificates and licenses</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    educationsArray.append({
                      school_type: "",
                      school_name: "",
                      certificates_held: "",
                      licenses_held: "",
                    })
                  }
                >
                  + Add Education
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {educationsArray.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No education records yet. Click "Add Education" to begin.
                  </p>
                )}
                {educationsArray.fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <SectionHeader icon={GraduationCap} title={`Education #${index + 1}`} />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => educationsArray.remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name={`educations.${index}.school_type`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="High School">High School</SelectItem>
                              <SelectItem value="Trade School">Trade School</SelectItem>
                              <SelectItem value="2-Year College">2-Year College</SelectItem>
                              <SelectItem value="4-Year College">4-Year College</SelectItem>
                              <SelectItem value="Graduate School">Graduate School</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`educations.${index}.school_name`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>School / Institution Name</FormLabel>
                          <FormControl><Input placeholder="Institution name" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name={`educations.${index}.certificates_held`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificates Held</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="List certificates earned here" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`educations.${index}.licenses_held`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Licenses Held</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="List licenses earned here" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* STEP 3 — Previous Employer */}
          <div className={cn(step !== 2 && "hidden")}>
            <Card className="border-border/60">
              <CardHeader className="border-b border-border/60 bg-muted/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Previous Employers</CardTitle>
                  <CardDescription>Add one or more prior employers</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    employersArray.append({
                      prev_business_name: "",
                      prev_work_address: "",
                      prev_work_city: "",
                      prev_work_state: "",
                      prev_work_zip_code: "",
                      prev_work_phone_number: "",
                      prev_work_contact_person: "",
                      prev_corporate_address: "",
                      prev_corporate_city: "",
                      prev_corporate_state: "",
                      prev_corporate_zip_code: "",
                      prev_corporate_phone_number: "",
                      prev_corporate_contact_person: "",
                      prev_start_month: "",
                      prev_start_year: "",
                      prev_end_month: "",
                      prev_end_year: "",
                      prev_starting_position: "",
                      prev_ending_position: "",
                      prev_reason_for_leaving: "",
                      prev_eligible_for_rehire: false,
                    })
                  }
                >
                  + Add Employer
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {employersArray.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No previous employers yet. Click "Add Employer" to begin.
                  </p>
                )}
                {employersArray.fields.map((field, index) => {
                  const n = (k: string) => `previous_employers.${index}.${k}` as const;
                  return (
                    <div key={field.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-6 relative">
                      <div className="flex items-center justify-between">
                        <SectionHeader icon={Briefcase} title={`Employer #${index + 1}`} />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => employersArray.remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <FormField control={form.control} name={n("prev_business_name") as any} render={({ field }) => (
                        <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <section className="space-y-4">
                        <SectionHeader icon={MapPin} title="Work Location" />
                        <FormField control={form.control} name={n("prev_work_address") as any} render={({ field }) => (
                          <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name={n("prev_work_city") as any} render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_work_state") as any} render={({ field }) => (
                            <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_work_zip_code") as any} render={({ field }) => (
                            <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name={n("prev_work_phone_number") as any} render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_work_contact_person") as any} render={({ field }) => (
                            <FormItem><FormLabel>Person of Contact</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </section>

                      <section className="space-y-4">
                        <SectionHeader icon={Building2} title="Corporate / Main Office" description="If applicable" />
                        <FormField control={form.control} name={n("prev_corporate_address") as any} render={({ field }) => (
                          <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name={n("prev_corporate_city") as any} render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_corporate_state") as any} render={({ field }) => (
                            <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_corporate_zip_code") as any} render={({ field }) => (
                            <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name={n("prev_corporate_phone_number") as any} render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_corporate_contact_person") as any} render={({ field }) => (
                            <FormItem><FormLabel>Person of Contact</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </section>

                      <section className="space-y-4">
                        <SectionHeader icon={CalendarRange} title="Tenure & Role" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField control={form.control} name={n("prev_start_month") as any} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Month</FormLabel>
                              <Select onValueChange={field.onChange} value={(field.value as string) || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {months.map((month) => (<SelectItem key={month} value={month}>{month}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_start_year") as any} render={({ field }) => (
                            <FormItem><FormLabel>Start Year</FormLabel><FormControl><Input placeholder="YYYY" {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_end_month") as any} render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Month</FormLabel>
                              <Select onValueChange={field.onChange} value={(field.value as string) || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {months.map((month) => (<SelectItem key={month} value={month}>{month}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_end_year") as any} render={({ field }) => (
                            <FormItem><FormLabel>End Year</FormLabel><FormControl><Input placeholder="YYYY" {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name={n("prev_starting_position") as any} render={({ field }) => (
                            <FormItem><FormLabel>Starting Position</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={n("prev_ending_position") as any} render={({ field }) => (
                            <FormItem><FormLabel>Ending Position</FormLabel><FormControl><Input {...field} value={(field.value as string) || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name={n("prev_reason_for_leaving") as any} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Leaving</FormLabel>
                            <FormControl><Textarea rows={3} {...field} value={(field.value as string) || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={n("prev_eligible_for_rehire") as any} render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border border-border bg-background p-3">
                            <FormControl>
                              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Eligible for Rehire</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </section>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* STEP 4 — Resume */}
          <div className={cn(step !== 3 && "hidden")}>
            <Card className="border-border/60">
              <CardHeader className="border-b border-border/60 bg-muted/30">
                <CardTitle className="text-lg">Resume</CardTitle>
                <CardDescription>Certificates, achievements, skills and a professional summary</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Certificates & Achievements */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={Award}
                    title="Certificates & Achievements"
                    description="Describe in writing or upload a supporting document"
                  />
                  <FormField control={form.control} name="resume_certificates_achievements" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="List certifications, awards, and notable achievements" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="resume_certificates_file_url" render={() => (
                    <FormItem>
                      <FormLabel>Supporting File</FormLabel>
                      <FormDescription>PDF, DOC, DOCX or image (max 10MB)</FormDescription>
                      <input
                        ref={certFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={handleCertFileChange}
                      />
                      {certFileUrl ? (
                        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <a
                              href={certFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary hover:underline truncate"
                            >
                              {certFileUrl.split("/").pop()}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => certFileInputRef.current?.click()}
                              disabled={uploadingCert}
                            >
                              Replace
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => form.setValue("resume_certificates_file_url", "", { shouldDirty: true })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => certFileInputRef.current?.click()}
                          disabled={uploadingCert}
                          className="w-full flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors p-6 text-sm text-muted-foreground"
                        >
                          {uploadingCert ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span>Uploading…</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-primary" />
                              <span>Click to upload a file</span>
                            </>
                          )}
                        </button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                </section>

                <Separator />

                {/* Skills */}
                <section className="space-y-4">
                  <SectionHeader icon={Sparkles} title="Skills" description="Core competencies and tools" />
                  <FormField control={form.control} name="resume_skills" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="e.g. HVAC installation, electrical diagnostics, customer service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </section>

                <Separator />

                {/* Summary */}
                <section className="space-y-4">
                  <SectionHeader icon={FileText} title="Summary" description="Brief professional bio" />
                  <FormField control={form.control} name="resume_summary" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Summary</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Brief professional summary covering experience, strengths, and goals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Footer nav */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur border border-border rounded-lg p-3 flex items-center justify-between gap-2 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0 || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="text-xs text-muted-foreground">
              Step <span className="font-semibold text-foreground">{step + 1}</span> of {steps.length}
            </div>
            {step < steps.length - 1 ? (
              <Button key="next-btn" type="button" onClick={handleNext}>
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button key="submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? "Updating…" : "Saving…"}
                  </>
                ) : (
                  isEditing ? "Update Employee" : "Save Employee"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
