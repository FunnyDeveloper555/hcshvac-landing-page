import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface CustomersSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
}

export interface SearchFilters {
  searchTerm: string;
  searchField: string;
  locationType: string;
  warrantyStatus: string;
}

const CustomersSearch = ({ onSearch, onClear }: CustomersSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [locationType, setLocationType] = useState("all");
  const [warrantyStatus, setWarrantyStatus] = useState("all");

  const handleSearch = () => {
    onSearch({
      searchTerm,
      searchField,
      locationType,
      warrantyStatus,
    });
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchField("all");
    setLocationType("all");
    setWarrantyStatus("all");
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <Select value={searchField} onValueChange={setSearchField}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="account_number">Account Number</SelectItem>
            <SelectItem value="name">First/Last Name</SelectItem>
            <SelectItem value="email">Email Address</SelectItem>
            <SelectItem value="phone">Phone Number</SelectItem>
            <SelectItem value="address">Address</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationType} onValueChange={setLocationType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Location Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={warrantyStatus} onValueChange={setWarrantyStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Warranty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="none">No Warranty</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default CustomersSearch;
