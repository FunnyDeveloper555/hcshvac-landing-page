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
    await importBusiness(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

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

  const importBusiness = async (file: File) => {
    try {
      setImporting(true);
      setProgress(0);
      setImportedCount(0);
      setIsComplete(false);

      console.log('Reading file...');
      const csvText = await file.text();
      console.log('File read, length:', csvText.length);
      
      const lines = csvText.split('\n').filter(line => line.trim());
      console.log('Total lines:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or has only headers');
      }
      
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Headers:', headers);
      
      const records = lines.slice(1)
        .map((line, lineIndex) => {
          try {
            const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim());
            const record: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            
            // Map CSV headers to database columns
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
          console.error(`Error parsing line ${lineIndex + 2}:`, error);
          return null;
        }
      })
      .filter(record => record !== null);

      console.log('Parsed records:', records.length);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }
      
      setTotalCount(records.length);
      
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('business')
          .insert(batch);
        
        if (error) {
          throw error;
        }
        
        setImportedCount(i + batch.length);
        setProgress(((i + batch.length) / records.length) * 100);
      }
      
      setIsComplete(true);
      toast({
        title: "Import successful",
        description: `Successfully imported ${records.length} business records`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      console.error('Error details:', error.message, error.stack);
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
