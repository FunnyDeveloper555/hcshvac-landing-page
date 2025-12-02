import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

const BusinessImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, 'Type:', file.type);
    
    // Accept .csv files regardless of MIME type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file (.csv)",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    setIsComplete(false);
    
    // Start import immediately after file selection
    await importBusinessViaStorage(file);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Map CSV headers to database column names
  const HEADER_MAPPING: Record<string, string> = {
    "contact name": "contact_name",
    "company name": "company_name",
    "address": "address",
    "address2": "address2",
    "city": "city",
    "state": "state",
    "zip": "zip",
    "latitude": "latitude",
    "longitude": "longitude",
    "county code": "county_code",
    "area code": "area_code",
    "telephone number": "telephone_number",
    "toll free number": "toll_free_number",
    "fax number": "fax_number",
    "web address": "web_address",
    "total employees": "total_employees",
    "revenue 1": "revenue_1",
    "revenue 2": "revenue_2",
    "naics": "naics",
    "year founded": "year_founded",
    "sic 2": "sic_2",
    "sic 4": "sic_4",
    "job title": "job_title",
    "facebook": "facebook",
    "twitter": "twitter",
    "base category": "base_category",
    "detailed category": "detailed_category",
    "exact category": "exact_category",
    "location type": "location_type",
    "market variable": "market_variable",
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const importBusinessViaStorage = async (file: File) => {
    try {
      setImporting(true);
      setProgress(10);
      setImportedCount(0);
      setIsComplete(false);

      console.log('Reading CSV file locally...');
      const csvText = await file.text();

      const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file does not contain any data rows');
      }

      const rawHeaders = parseCSVLine(lines[0]);
      const mappedHeaders = rawHeaders.map((h) => {
        const normalized = h.trim().toLowerCase();
        return HEADER_MAPPING[normalized] || null;
      });

      const records: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.every((v) => v.trim() === '')) continue;

        const record: Record<string, any> = {};
        mappedHeaders.forEach((dbColumn, index) => {
          if (!dbColumn) return; // Skip unmapped columns
          const value = values[index] ?? '';
          record[dbColumn] = value === '' ? null : value.trim();
        });
        
        // Only add record if it has at least one mapped field
        if (Object.keys(record).length > 0) {
          records.push(record);
        }
      }

      setTotalCount(records.length);

      const batchSize = 100;
      let imported = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { error } = await supabase.from('business').insert(batch as any);
        if (error) {
          throw new Error(`Import failed at row ${i + 1}: ${error.message}`);
        }

        imported += batch.length;
        setImportedCount(imported);
        setProgress(10 + Math.round((imported / records.length) * 90));
      }

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Import successful",
        description: `Imported ${imported} business records.`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import Business Data</h2>
        <p className="text-muted-foreground">Import business records from CSV file</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Data Import</CardTitle>
          <CardDescription>
            Select a CSV file from your computer to import business records
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
              Start Import
            </Button>
          )}
          
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importing... {importedCount} / {totalCount}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {isComplete && (
            <div className="text-green-600 font-medium">
              ✓ Import completed successfully! Imported {importedCount} records.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessImport;
