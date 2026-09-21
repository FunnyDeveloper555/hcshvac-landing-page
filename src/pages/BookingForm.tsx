import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Home, CheckCircle, CalendarDays } from "lucide-react";
import { ourServiceVisitOptions, APPOINTMENT_TYPE_PROPERTY, parseOurServices } from "@/lib/ourServices";

interface BookingInvitation {
  id: string;
  company_id: string;
  invitation_type: string;
  customer_type: string;
  link_type?: string | null;
  status: string;
  expires_at: string;
  companies: { name: string; company_phone: string | null; logo_url: string | null } | null;
}

interface FormData {
  // Contact Info
  phone: string;
  email: string;
  
  // Ship To
  shipToFirstName: string;
  shipToLastName: string;
  shipToBusinessName: string;
  shipToAddress: string;
  shipToSuiteUnit: string;
  shipToCity: string;
  shipToState: string;
  shipToZipCode: string;
  
  // Bill To
  billToSameAsShipTo: boolean;
  billToFirstName: string;
  billToLastName: string;
  billToAddress: string;
  billToSuiteUnit: string;
  billToCity: string;
  billToState: string;
  billToZipCode: string;
  
  // Residential specific
  residentialType: string;
  residentialOccupancy: string;
  formalTitle: string;
  willBeOnLocation: string;
  
  // Commercial specific
  corporationName: string;
  businessPhone: string;
  businessType: string;
  pocFirstName: string;
  pocLastName: string;
  pocPhone: string;
  pocEmail: string;
  securityGateAccess: string;
  lockBoxAccessCodes: string;
  emsMonitoring: string;
  
  // Appointment request
  visitReason: string;
  preferredDate: string;
  preferredTime: string;

  // Common
  initialVisitNotes: string;
}

const initialFormData: FormData = {
  phone: "",
  email: "",
  shipToFirstName: "",
  shipToLastName: "",
  shipToBusinessName: "",
  shipToAddress: "",
  shipToSuiteUnit: "",
  shipToCity: "",
  shipToState: "",
  shipToZipCode: "",
  billToSameAsShipTo: true,
  billToFirstName: "",
  billToLastName: "",
  billToAddress: "",
  billToSuiteUnit: "",
  billToCity: "",
  billToState: "",
  billToZipCode: "",
  residentialType: "",
  residentialOccupancy: "",
  formalTitle: "",
  willBeOnLocation: "",
  corporationName: "",
  businessPhone: "",
  businessType: "",
  pocFirstName: "",
  pocLastName: "",
  pocPhone: "",
  pocEmail: "",
  securityGateAccess: "",
  lockBoxAccessCodes: "",
  emsMonitoring: "",
  visitReason: "",
  preferredDate: "",
  preferredTime: "",
  initialVisitNotes: "",
};

const FALLBACK_VISIT_REASONS = [
  "Service Repair",
  "Estimate",
  "Warranty",
  "Inspection Report",
  "Maintenance",
  "Installation",
  "Other",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function BookingForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch invitation data
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["booking-invitation", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      
      const { data: rows, error } = await supabase
        .rpc("get_booking_invitation_by_token", { _token: token });
      if (error) throw error;
      const inv = Array.isArray(rows) ? rows[0] : rows;
      if (!inv) throw new Error("Invitation not found");
      let companies = null;
      if (inv.company_id) {
        const { data: c } = await supabase
          .from("companies")
          .select("name, company_phone, logo_url")
          .eq("id", inv.company_id)
          .maybeSingle();
        companies = c || null;
      }
      return { ...inv, companies } as BookingInvitation;
    },
    enabled: !!token,
  });

  // Update invitation status to "opened" when page is viewed
  useEffect(() => {
    if (invitation && invitation.status === "sent" && token) {
      supabase
        .rpc("mark_booking_invitation_opened", { _token: token })
        .then(() => console.log("Invitation marked as opened"));
    }
  }, [invitation, token]);

  // What this link is for: profile registration, appointment booking, or both.
  const rawMode = (searchParams.get("mode") || invitation?.link_type || "registration").toLowerCase();
  const mode: "registration" | "booking" | "both" =
    rawMode === "booking" ? "booking" : rawMode === "both" ? "both" : "registration";
  const wantsProfile = mode === "registration" || mode === "both";
  const wantsBooking = mode === "booking" || mode === "both";

  // Visit reasons come from the company's own "Our Services" selections,
  // limited to this customer's property type.
  const { data: visitReasonOptions } = useQuery({
    queryKey: ["booking-visit-reasons", invitation?.company_id, invitation?.invitation_type],
    enabled: !!invitation?.company_id && wantsBooking,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("our_services")
        .eq("id", invitation!.company_id)
        .maybeSingle();
      const property =
        APPOINTMENT_TYPE_PROPERTY[(invitation!.invitation_type || "residential").toLowerCase()] ?? null;
      const options = ourServiceVisitOptions(parseOurServices((data as any)?.our_services), property);
      return options.length ? options : FALLBACK_VISIT_REASONS.map((v) => ({ value: v, label: v }));
    },
    staleTime: 30_000,
  });

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!invitation) throw new Error("No invitation found");

      // Create customer registration
      const registrationData = {
        email: formData.email,
        phone: formData.phone,
        ship_to_first_name: formData.shipToFirstName,
        ship_to_last_name: formData.shipToLastName,
        ship_to_business_name: formData.shipToBusinessName || null,
        ship_to_address: formData.shipToAddress,
        ship_to_suite_number: formData.shipToSuiteUnit || null,
        ship_to_city: formData.shipToCity,
        ship_to_state: formData.shipToState,
        ship_to_zip_code: formData.shipToZipCode,
        bill_to_same_as_ship_to: formData.billToSameAsShipTo,
        bill_to_first_name: formData.billToSameAsShipTo ? null : formData.billToFirstName,
        bill_to_last_name: formData.billToSameAsShipTo ? null : formData.billToLastName,
        bill_to_address: formData.billToSameAsShipTo ? null : formData.billToAddress,
        bill_to_suite_number: formData.billToSameAsShipTo ? null : formData.billToSuiteUnit,
        bill_to_city: formData.billToSameAsShipTo ? null : formData.billToCity,
        bill_to_state: formData.billToSameAsShipTo ? null : formData.billToState,
        bill_to_zip_code: formData.billToSameAsShipTo ? null : formData.billToZipCode,
        location_type: invitation.invitation_type,
        residential_type: invitation.invitation_type === "residential" ? formData.residentialType : null,
        residential_occupancy: invitation.invitation_type === "residential" ? formData.residentialOccupancy : null,
        point_of_contact_name: invitation.invitation_type === "commercial" ? `${formData.pocFirstName} ${formData.pocLastName}` : null,
        point_of_contact_phone: invitation.invitation_type === "commercial" ? formData.pocPhone : null,
        point_of_contact_email: invitation.invitation_type === "commercial" ? formData.pocEmail : null,
      };

      const { error: regError } = await supabase
        .from("customer_registrations")
        .insert(registrationData);

      if (regError) throw regError;

      // Update invitation status via secure RPC
      if (token) {
        const { error: updateError } = await supabase
          .rpc("complete_booking_invitation", { _token: token });
        if (updateError) throw updateError;
      }

      return true;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Complete",
        description: "Thank you! Your information has been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.phone || !formData.email) {
      toast({
        title: "Required Fields",
        description: "Please fill in phone and email",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.shipToFirstName || !formData.shipToLastName || !formData.shipToAddress || 
        !formData.shipToCity || !formData.shipToState || !formData.shipToZipCode) {
      toast({
        title: "Required Fields",
        description: "Please fill in all Ship To address fields",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This booking link is no longer valid. Please contact the company for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitation.status === "completed" || isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Registration Complete!</CardTitle>
            <CardDescription className="text-base">
              Thank you for completing your registration with {invitation.companies?.name}. 
              We will be in touch shortly to confirm your appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitation.companies?.company_phone && (
              <p className="text-muted-foreground">
                Questions? Call us at: <strong>{invitation.companies.company_phone}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Link Expired</CardTitle>
            <CardDescription>
              This booking link has expired. Please contact {invitation.companies?.name} for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isResidential = invitation.invitation_type === "residential";

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Company Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            {invitation.companies?.logo_url && (
              <img 
                src={invitation.companies.logo_url} 
                alt={invitation.companies.name}
                className="h-16 mx-auto mb-4 object-contain"
              />
            )}
            <CardTitle className="flex items-center justify-center gap-2">
              {isResidential ? <Home className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              {invitation.companies?.name}
            </CardTitle>
            <CardDescription>
              {isResidential ? "Residential" : "Commercial"} Customer Registration
            </CardDescription>
            {invitation.companies?.company_phone && (
              <p className="text-sm text-muted-foreground mt-2">
                Phone: {invitation.companies.company_phone}
              </p>
            )}
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ship To Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Ship To: Where We Will Visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipToFirstName">First Name *</Label>
                  <Input
                    id="shipToFirstName"
                    value={formData.shipToFirstName}
                    onChange={(e) => handleChange("shipToFirstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipToLastName">Last Name *</Label>
                  <Input
                    id="shipToLastName"
                    value={formData.shipToLastName}
                    onChange={(e) => handleChange("shipToLastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isResidential && (
                <div>
                  <Label htmlFor="shipToBusinessName">Business/Company Name</Label>
                  <Input
                    id="shipToBusinessName"
                    value={formData.shipToBusinessName}
                    onChange={(e) => handleChange("shipToBusinessName", e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="shipToAddress">Address *</Label>
                  <Input
                    id="shipToAddress"
                    value={formData.shipToAddress}
                    onChange={(e) => handleChange("shipToAddress", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipToSuiteUnit">Suite/Unit</Label>
                  <Input
                    id="shipToSuiteUnit"
                    value={formData.shipToSuiteUnit}
                    onChange={(e) => handleChange("shipToSuiteUnit", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="shipToCity">City *</Label>
                  <Input
                    id="shipToCity"
                    value={formData.shipToCity}
                    onChange={(e) => handleChange("shipToCity", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipToState">State *</Label>
                  <Select
                    value={formData.shipToState}
                    onValueChange={(value) => handleChange("shipToState", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shipToZipCode">Zip Code *</Label>
                  <Input
                    id="shipToZipCode"
                    value={formData.shipToZipCode}
                    onChange={(e) => handleChange("shipToZipCode", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill To Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Bill To: Responsible Party Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="billToSameAsShipTo"
                  checked={formData.billToSameAsShipTo}
                  onCheckedChange={(checked) => handleChange("billToSameAsShipTo", !!checked)}
                />
                <Label htmlFor="billToSameAsShipTo">Same as Ship To address</Label>
              </div>

              {!formData.billToSameAsShipTo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billToFirstName">First Name *</Label>
                      <Input
                        id="billToFirstName"
                        value={formData.billToFirstName}
                        onChange={(e) => handleChange("billToFirstName", e.target.value)}
                        required={!formData.billToSameAsShipTo}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billToLastName">Last Name *</Label>
                      <Input
                        id="billToLastName"
                        value={formData.billToLastName}
                        onChange={(e) => handleChange("billToLastName", e.target.value)}
                        required={!formData.billToSameAsShipTo}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="billToAddress">Address *</Label>
                      <Input
                        id="billToAddress"
                        value={formData.billToAddress}
                        onChange={(e) => handleChange("billToAddress", e.target.value)}
                        required={!formData.billToSameAsShipTo}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billToSuiteUnit">Suite/Unit</Label>
                      <Input
                        id="billToSuiteUnit"
                        value={formData.billToSuiteUnit}
                        onChange={(e) => handleChange("billToSuiteUnit", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="billToCity">City *</Label>
                      <Input
                        id="billToCity"
                        value={formData.billToCity}
                        onChange={(e) => handleChange("billToCity", e.target.value)}
                        required={!formData.billToSameAsShipTo}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billToState">State *</Label>
                      <Select
                        value={formData.billToState}
                        onValueChange={(value) => handleChange("billToState", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="billToZipCode">Zip Code *</Label>
                      <Input
                        id="billToZipCode"
                        value={formData.billToZipCode}
                        onChange={(e) => handleChange("billToZipCode", e.target.value)}
                        required={!formData.billToSameAsShipTo}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Residential Specific Fields */}
          {isResidential && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Residential Type</Label>
                  <Select
                    value={formData.residentialType}
                    onValueChange={(value) => handleChange("residentialType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family Home</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="condo">Condominium</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="mobile_home">Mobile Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Your Formal Title to the Property</Label>
                  <RadioGroup
                    value={formData.residentialOccupancy}
                    onValueChange={(value) => handleChange("residentialOccupancy", value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="owner" id="owner" />
                      <Label htmlFor="owner">Owner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="renter" id="renter" />
                      <Label htmlFor="renter">Renter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="res-other" />
                      <Label htmlFor="res-other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Will you be on location personally during our visit?</Label>
                  <RadioGroup
                    value={formData.willBeOnLocation}
                    onValueChange={(value) => handleChange("willBeOnLocation", value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="loc-yes" />
                      <Label htmlFor="loc-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="loc-no" />
                      <Label htmlFor="loc-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unknown" id="loc-unknown" />
                      <Label htmlFor="loc-unknown">Unknown</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commercial Specific Fields */}
          {!isResidential && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Point of Contact</CardTitle>
                  <CardDescription>Who will we be communicating with?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pocFirstName">First Name</Label>
                      <Input
                        id="pocFirstName"
                        value={formData.pocFirstName}
                        onChange={(e) => handleChange("pocFirstName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pocLastName">Last Name</Label>
                      <Input
                        id="pocLastName"
                        value={formData.pocLastName}
                        onChange={(e) => handleChange("pocLastName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pocPhone">Phone or Extension</Label>
                      <Input
                        id="pocPhone"
                        type="tel"
                        value={formData.pocPhone}
                        onChange={(e) => handleChange("pocPhone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pocEmail">Email</Label>
                      <Input
                        id="pocEmail"
                        type="email"
                        value={formData.pocEmail}
                        onChange={(e) => handleChange("pocEmail", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Location Information</CardTitle>
                  <CardDescription>Things we need our technician to know</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Is there a Security Gate Access?</Label>
                    <RadioGroup
                      value={formData.securityGateAccess}
                      onValueChange={(value) => handleChange("securityGateAccess", value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="gate-yes" />
                        <Label htmlFor="gate-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="gate-no" />
                        <Label htmlFor="gate-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unknown" id="gate-unknown" />
                        <Label htmlFor="gate-unknown">Unknown</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Are there any lock boxes or access codes?</Label>
                    <RadioGroup
                      value={formData.lockBoxAccessCodes}
                      onValueChange={(value) => handleChange("lockBoxAccessCodes", value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="lock-yes" />
                        <Label htmlFor="lock-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="lock-no" />
                        <Label htmlFor="lock-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unknown" id="lock-unknown" />
                        <Label htmlFor="lock-unknown">Unknown</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Is there an EMS (Energy Management Service) Monitoring your Location?</Label>
                    <RadioGroup
                      value={formData.emsMonitoring}
                      onValueChange={(value) => handleChange("emsMonitoring", value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="ems-yes" />
                        <Label htmlFor="ems-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="ems-no" />
                        <Label htmlFor="ems-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unknown" id="ems-unknown" />
                        <Label htmlFor="ems-unknown">Unknown</Label>
                      </div>
                    </RadioGroup>
                    {formData.emsMonitoring === "yes" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        If Yes, please have Name, Phone Number and account identification information on hand at visit.
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    We will have a secondary profile questionnaire about the building after the appointment time and date is confirmed. Please note this is required before our initial visit to your location.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notes */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Initial Visit Notes or Memos</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.initialVisitNotes}
                onChange={(e) => handleChange("initialVisitNotes", e.target.value)}
                placeholder="Any additional information you'd like us to know..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto min-w-[200px]"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Proud Member of the Home Comfort Suppliers Network</p>
          <p>Mandating Higher Standards on Ethics, Knowledge, and Professionalism</p>
        </div>
      </div>
    </div>
  );
}
