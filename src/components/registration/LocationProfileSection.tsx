import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";

interface LocationProfileSectionProps {
  form: UseFormReturn<any>;
  locationType: string;
}

const LocationProfileSection = ({ form, locationType }: LocationProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Ship To Location Profile</h3>

      <FormField
        control={form.control}
        name="location_age_years"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Age of Location (Years)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
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
                      <SelectValue placeholder="Select residential type" />
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
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="owner_occupied" id="owner" />
                      <Label htmlFor="owner">Owner Occupied</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tenant_occupied" id="tenant" />
                      <Label htmlFor="tenant">Tenant Occupied</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_occupied" id="not-occupied" />
                      <Label htmlFor="not-occupied">Not Occupied</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {(locationType === "commercial" || locationType === "industrial" || locationType === "educational") && (
        <>
          <FormField
            control={form.control}
            name="building_occupied"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building Occupancy</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={(val) => field.onChange(val === "true")} value={field.value?.toString()} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="occupied" />
                      <Label htmlFor="occupied">Building is Occupied</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="not-occupied-bldg" />
                      <Label htmlFor="not-occupied-bldg">Not Occupied</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h4 className="font-medium">Point of Contact</h4>
            
            <FormField
              control={form.control}
              name="point_of_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
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
                      <Input type="email" placeholder="jane@example.com" {...field} />
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
                  <Input placeholder="Building A, Floor 2, Room 205" {...field} />
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
                  <Input placeholder="Office space, retail, etc." {...field} />
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
                  <Textarea placeholder="Any safety concerns, access restrictions, etc." {...field} />
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
                  <Input placeholder="Mon-Fri: 9AM-5PM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};

export default LocationProfileSection;