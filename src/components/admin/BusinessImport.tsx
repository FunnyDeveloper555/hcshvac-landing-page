import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CHUNK_SIZE = 5000; // Records per chunk

interface BusinessRecord {
  no?: number | null;
  contact_name?: string | null;
  company_name?: string | null;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  county_code?: string | null;
  area_code?: string | null;
  telephone_number?: string | null;
  toll_free_number?: string | null;
  fax_number?: string | null;
  web_address?: string | null;
  total_employees?: number | null;
  revenue_1?: number | null;
  revenue_2?: number | null;
  naics?: string | null;
  year_founded?: number | null;
  sic_2?: string | null;
  sic_4?: string | null;
  job_title?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  base_category?: string | null;
  detailed_category?: string | null;
  exact_category?: string | null;
  location_type?: string | null;
  market_variable?: string | null;
}

const BusinessImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseRecord = (headers: string[], values: string[]): BusinessRecord | null => {
    try {
      const record: BusinessRecord = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/"/g, '').trim();
        
        switch(header.toLowerCase()) {
          case 'no':
            record.no = value ? parseInt(value) : null;
            break;
          case 'contact name':
            record.contact_name = value || null;
            break;
          case 'company name':
            record.company_name = value || null;
            break;
          case 'address':
            record.address = value || null;
            break;
          case 'address2':
            record.address2 = value || null;
            break;
          case 'city':
            record.city = value || null;
            break;
          case 'state':
            record.state = value || null;
            break;
          case 'zip':
            record.zip = value || null;
            break;
          case 'latitude':
            record.latitude = value ? parseFloat(value) : null;
            break;
          case 'longitude':
            record.longitude = value ? parseFloat(value) : null;
            break;
          case 'county code':
            record.county_code = value || null;
            break;
          case 'area code':
            record.area_code = value || null;
            break;
          case 'telephone number':
            record.telephone_number = value || null;
            break;
          case 'toll free number':
            record.toll_free_number = value || null;
            break;
          case 'fax number':
            record.fax_number = value || null;
            break;
          case 'web address':
            record.web_address = value || null;
            break;
          case 'total employees':
            record.total_employees = value ? parseInt(value) : null;
            break;
          case 'revenue 1':
            record.revenue_1 = value ? parseFloat(value) : null;
            break;
          case 'revenue 2':
            record.revenue_2 = value ? parseFloat(value) : null;
            break;
          case 'naics':
            record.naics = value || null;
            break;
          case 'year founded':
            record.year_founded = value ? parseInt(value) : null;
            break;
          case 'sic 2':
            record.sic_2 = value || null;
            break;
          case 'sic 4':
            record.sic_4 = value || null;
            break;
          case 'job title':
            record.job_title = value || null;
            break;
          case 'facebook':
            record.facebook = value || null;
            break;
          case 'twitter':
            record.twitter = value || null;
            break;
          case 'base category':
            record.base_category = value || null;
            break;
          case 'detailed category':
            record.detailed_category = value || null;
            break;
          case 'exact category':
            record.exact_category = value || null;
            break;
          case 'location type':
            record.location_type = value || null;
            break;
          case 'market variable':
            record.market_variable = value || null;
            break;
        }
      });
      
      return record;
    } catch (error) {
      console.error('Error parsing record:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file (.csv)",
        variant: "destructive",
      });
      return;
    }
    
    setIsComplete(false);
    await processLargeCSV(file);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const processLargeCSV = async (file: File) => {
    try {
      setImporting(true);
      setProgress(0);
      setImportedCount(0);
      setTotalCount(0);
      setCurrentChunk(0);
      setTotalChunks(0);

      console.log("Reading CSV file...");
      
      // Read file as text
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or has only headers');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Headers:', headers);
      
      const dataLines = lines.slice(1);
      const total = dataLines.length;
      setTotalCount(total);
      
      const chunks = Math.ceil(total / CHUNK_SIZE);
      setTotalChunks(chunks);
      
      console.log(`Processing ${total} records in ${chunks} chunks`);

      let imported = 0;

      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
        setCurrentChunk(chunkIndex + 1);
        
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, total);
        const chunkLines = dataLines.slice(startIdx, endIdx);
        
        // Parse records for this chunk
        const records: BusinessRecord[] = [];
        for (const line of chunkLines) {
          const values = parseCSVLine(line);
          const record = parseRecord(headers, values);
          if (record) {
            records.push(record);
          }
        }

        console.log(`Sending chunk ${chunkIndex + 1}/${chunks} with ${records.length} records`);

        // Send chunk to edge function
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          imported?: number;
          message?: string;
          error?: string;
        }>("import-business", {
          body: { records },
        });

        if (error) {
          throw new Error(`Chunk ${chunkIndex + 1} failed: ${error.message}`);
        }

        if (!data?.success) {
          throw new Error(data?.error || `Chunk ${chunkIndex + 1} import failed`);
        }

        imported += data.imported ?? records.length;
        setImportedCount(imported);
        setProgress(Math.round(((chunkIndex + 1) / chunks) * 100));
        
        console.log(`Chunk ${chunkIndex + 1}/${chunks} complete. Total imported: ${imported}`);
      }

      setIsComplete(true);
      toast({
        title: "Import successful",
        description: `Imported ${imported} business records.`,
      });

    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import Business Data</h2>
        <p className="text-muted-foreground">Import business records from CSV file (supports large files)</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Data Import</CardTitle>
          <CardDescription>
            Select a CSV file from your computer. Large files (200MB+) are processed in chunks automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!importing && !isComplete && (
            <Button onClick={handleButtonClick}>
              <Upload className="mr-2 h-4 w-4" />
              Select CSV File
            </Button>
          )}
          
          {importing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Processing chunk {currentChunk} of {totalChunks}...
                </span>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="text-sm text-muted-foreground">
                Imported {importedCount.toLocaleString()} of {totalCount.toLocaleString()} records ({progress}%)
              </div>
            </div>
          )}
          
          {isComplete && (
            <div className="space-y-4">
              <div className="text-green-600 font-medium">
                ✓ Import completed successfully! Imported {importedCount.toLocaleString()} records.
              </div>
              <Button onClick={handleButtonClick} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessImport;
