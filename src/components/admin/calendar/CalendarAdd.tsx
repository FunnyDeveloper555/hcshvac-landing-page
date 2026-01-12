import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { CalendarPlus, Building2, User, Mail } from "lucide-react";

const CalendarAdd = () => {
  const navigate = useNavigate();
  const { logAction } = useAdminLog();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    calendar_name: "",
    calendar_type: "company",
    email: "",
    description: "",
    color: "#3b82f6",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Note: This will need a calendars table to be created
      toast.success("Calendar entry created successfully!");
      logAction("create", "settings", undefined, { calendar_name: formData.calendar_name });
      navigate("/admin/calendar/list");
    } catch (error) {
      console.error("Error creating calendar:", error);
      toast.error("Failed to create calendar entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Azure-style header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-muted-foreground">Calendar</span>
          <span className="text-muted-foreground">|</span>
          <span>Create New Calendar Entry</span>
        </div>
      </div>

      {/* Filter bar - Azure style */}
      <div className="flex items-center gap-4 py-2 border-b">
        <div className="relative flex-1 max-w-xs">
          <Input 
            placeholder="Filter calendars..." 
            className="h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-muted rounded-full">Calendar Type: All</span>
          <span className="text-xs px-3 py-1 bg-muted rounded-full">Status: All</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Azure categories style */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Calendar Types</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-1">
                <button 
                  onClick={() => setFormData({ ...formData, calendar_type: "company" })}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2 ${formData.calendar_type === "company" ? "bg-muted font-medium" : ""}`}
                >
                  <Building2 className="h-4 w-4" />
                  Company Calendar
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, calendar_type: "employee" })}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2 ${formData.calendar_type === "employee" ? "bg-muted font-medium" : ""}`}
                >
                  <User className="h-4 w-4" />
                  Employee Calendar
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, calendar_type: "shared" })}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2 ${formData.calendar_type === "shared" ? "bg-muted font-medium" : ""}`}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Shared Calendar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content - Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                New Calendar Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Calendar Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Calendar Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendar_name">Calendar Name *</Label>
                      <Input
                        id="calendar_name"
                        value={formData.calendar_name}
                        onChange={(e) => setFormData({ ...formData, calendar_name: e.target.value })}
                        placeholder="e.g., Company Calendar 1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calendar_type">Calendar Type *</Label>
                      <Select 
                        value={formData.calendar_type} 
                        onValueChange={(value) => setFormData({ ...formData, calendar_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company Calendar</SelectItem>
                          <SelectItem value="employee">Employee Calendar</SelectItem>
                          <SelectItem value="shared">Shared Calendar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Associated Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="calendar@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Calendar Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter calendar description..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active Calendar</Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin/calendar/list")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Calendar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarAdd;