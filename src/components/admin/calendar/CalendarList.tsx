import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, User, CalendarPlus, Mail, Plus, Search, Star, Grid3X3, List } from "lucide-react";

// Mock data - will be replaced with actual database data
const mockCalendars = [
  { id: "1", name: "Company Calendar 1", type: "company", email: "company1@email.com", color: "#3b82f6", is_active: true },
  { id: "2", name: "Company Calendar 2", type: "company", email: "company2@email.com", color: "#10b981", is_active: true },
  { id: "3", name: "Company Calendar 3", type: "company", email: "company3@email.com", color: "#f59e0b", is_active: true },
  { id: "4", name: "Employee_Calendar", type: "employee", email: "employee1@email.com", color: "#8b5cf6", is_active: true },
  { id: "5", name: "Employee_Calendar", type: "employee", email: "employee2@email.com", color: "#ec4899", is_active: true },
  { id: "6", name: "Employee_Calendar", type: "employee", email: "employee3@email.com", color: "#06b6d4", is_active: false },
];

const CalendarList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCalendars = mockCalendars.filter((cal) => {
    const matchesSearch = cal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cal.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || cal.type === filterType;
    return matchesSearch && matchesType;
  });

  const companyCalendars = filteredCalendars.filter(c => c.type === "company");
  const employeeCalendars = filteredCalendars.filter(c => c.type === "employee");

  const CalendarItem = ({ calendar }: { calendar: typeof mockCalendars[0] }) => (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group"
      onClick={() => navigate(`/admin/calendar/edit/${calendar.id}`)}
    >
      <div 
        className="w-8 h-8 rounded flex items-center justify-center"
        style={{ backgroundColor: calendar.color + "20" }}
      >
        {calendar.type === "company" ? (
          <Building2 className="h-4 w-4" style={{ color: calendar.color }} />
        ) : (
          <User className="h-4 w-4" style={{ color: calendar.color }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{calendar.name}</span>
          {!calendar.is_active && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{calendar.email}</span>
        </div>
      </div>
      <Star className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Azure-style header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-muted-foreground">Calendar</span>
            <span className="text-muted-foreground">|</span>
            <span>Current Calendar</span>
          </div>
          <Button onClick={() => navigate("/admin/calendar/add")} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Calendar
          </Button>
        </div>
      </div>

      {/* Filter bar - Azure style */}
      <div className="flex items-center justify-between gap-4 py-2 border-b">
        <div className="flex items-center gap-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter calendars..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm pl-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filterType === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("company")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filterType === "company" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              Company
            </button>
            <button
              onClick={() => setFilterType("employee")}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filterType === "employee" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              Employee
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Detail view</span>
          <Switch 
            checked={viewMode === "list"} 
            onCheckedChange={(checked) => setViewMode(checked ? "list" : "grid")} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Azure categories style */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <button 
                  onClick={() => setFilterType("all")}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors ${filterType === "all" ? "bg-muted font-medium" : ""}`}
                >
                  All
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors">
                  Favorites
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors">
                  Recents
                </button>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">Categories</p>
                <div className="space-y-1">
                  <button 
                    onClick={() => setFilterType("company")}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2 ${filterType === "company" ? "bg-muted font-medium" : ""}`}
                  >
                    <Building2 className="h-4 w-4" />
                    Company Calendars
                  </button>
                  <button 
                    onClick={() => setFilterType("employee")}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2 ${filterType === "employee" ? "bg-muted font-medium" : ""}`}
                  >
                    <User className="h-4 w-4" />
                    Employee Calendars
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content - Calendar grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Company Calendars Section */}
          {companyCalendars.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Calendars
              </h3>
              <Card>
                <CardContent className="p-2">
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
                      {companyCalendars.map((calendar) => (
                        <CalendarItem key={calendar.id} calendar={calendar} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {companyCalendars.map((calendar) => (
                        <CalendarItem key={calendar.id} calendar={calendar} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Employee Calendars Section */}
          {employeeCalendars.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee Calendars
              </h3>
              <Card>
                <CardContent className="p-2">
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
                      {employeeCalendars.map((calendar) => (
                        <CalendarItem key={calendar.id} calendar={calendar} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {employeeCalendars.map((calendar) => (
                        <CalendarItem key={calendar.id} calendar={calendar} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {filteredCalendars.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No calendars found</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/admin/calendar/add")}
                >
                  Create New Calendar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Give feedback section */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium">Give feedback</p>
            <a href="#" className="text-sm text-primary hover:underline">Help improve this page</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarList;