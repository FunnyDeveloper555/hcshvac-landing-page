import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Pause, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CHUNK_SIZE = 500; // Records per chunk
const DELAY_BETWEEN_CHUNKS = 100; // ms delay between chunks to prevent overwhelming

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
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [failedChunks, setFailedChunks] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [startFromRecord, setStartFromRecord] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    setFailedChunks([]);
    pauseRef.current = false;
    setIsPaused(false);
    await processLargeCSV(file);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  const sendChunkWithRetry = async (records: BusinessRecord[], chunkIndex: number, maxRetries = 3): Promise<{ success: boolean; imported: number }> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          imported?: number;
          message?: string;
          error?: string;
        }>("import-business", {
          body: { records },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Import failed');
        }

        return { success: true, imported: data.imported ?? records.length };
      } catch (err: any) {
        console.error(`Chunk ${chunkIndex + 1} attempt ${attempt} failed:`, err.message);
        if (attempt === maxRetries) {
          return { success: false, imported: 0 };
        }
        await delay(1000 * attempt); // Exponential backoff
      }
    }
    return { success: false, imported: 0 };
  };

  const processLargeCSV = async (file: File) => {
    try {
      setImporting(true);
      setProgress(0);
      setImportedCount(0);
      setTotalCount(0);
      setCurrentChunk(0);
      setTotalChunks(0);
      setStatusMessage("Reading CSV file...");

      console.log("Reading CSV file...");
      
      // Read file as text
      const text = await file.text();
      setStatusMessage("Parsing CSV...");
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or has only headers');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Headers:', headers);
      
      const dataLines = lines.slice(1);
      const total = dataLines.length;
      setTotalCount(total);
      
      // Calculate starting chunk based on startFromRecord
      const startingChunk = Math.floor(startFromRecord / CHUNK_SIZE);
      const chunks = Math.ceil(total / CHUNK_SIZE);
      setTotalChunks(chunks);
      
      console.log(`Processing ${total} records in ${chunks} chunks, starting from chunk ${startingChunk + 1}`);
      setStatusMessage(`Found ${total.toLocaleString()} records. Starting from record ${startFromRecord.toLocaleString()}`);

      let imported = startFromRecord; // Start count from where we resume
      setImportedCount(imported);
      const failed: number[] = [];

      for (let chunkIndex = startingChunk; chunkIndex < chunks; chunkIndex++) {
        // Check for pause
        while (pauseRef.current) {
          setStatusMessage("Paused - click Resume to continue");
          await delay(500);
        }

        setCurrentChunk(chunkIndex + 1);
        setStatusMessage(`Processing chunk ${chunkIndex + 1} of ${chunks}...`);
        
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

        const result = await sendChunkWithRetry(records, chunkIndex);
        
        if (result.success) {
          imported += result.imported;
          setImportedCount(imported);
        } else {
          failed.push(chunkIndex + 1);
          setFailedChunks([...failed]);
          console.error(`Chunk ${chunkIndex + 1} failed after retries`);
        }

        setProgress(Math.round(((chunkIndex + 1) / chunks) * 100));
        console.log(`Chunk ${chunkIndex + 1}/${chunks} complete. Total imported: ${imported}`);

        // Add delay between chunks
        if (chunkIndex < chunks - 1) {
          await delay(DELAY_BETWEEN_CHUNKS);
        }
      }

      setIsComplete(true);
      setStatusMessage("");
      
      if (failed.length > 0) {
        toast({
          title: "Import completed with errors",
          description: `Imported ${imported.toLocaleString()} records. ${failed.length} chunks failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import successful",
          description: `Imported ${imported.toLocaleString()} business records.`,
        });
      }

    } catch (error: any) {
      console.error("Import error:", error);
      setStatusMessage("");
      toast({
        title: "Import failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setIsPaused(false);
      pauseRef.current = false;
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
            Select a CSV file from your computer. Large files (200MB+) are processed in chunks with retry logic.
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startFrom">Start from record (for resuming)</Label>
                <Input
                  id="startFrom"
                  type="number"
                  min="0"
                  value={startFromRecord}
                  onChange={(e) => setStartFromRecord(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 to start fresh, or enter the last imported count to resume (e.g., 104000)
                </p>
              </div>
              <Button onClick={handleButtonClick}>
                <Upload className="mr-2 h-4 w-4" />
                {startFromRecord > 0 ? `Resume from Record ${startFromRecord.toLocaleString()}` : 'Select CSV File'}
              </Button>
            </div>
          )}
          
          {importing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Chunk {currentChunk} of {totalChunks}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={togglePause}>
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Imported {importedCount.toLocaleString()} of {totalCount.toLocaleString()} records ({progress}%)</div>
                {statusMessage && <div className="text-xs">{statusMessage}</div>}
                {failedChunks.length > 0 && (
                  <div className="text-destructive text-xs">
                    Failed chunks: {failedChunks.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isComplete && (
            <div className="space-y-4">
              <div className={failedChunks.length > 0 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                {failedChunks.length > 0 
                  ? `⚠ Import completed with ${failedChunks.length} failed chunks. Imported ${importedCount.toLocaleString()} records.`
                  : `✓ Import completed successfully! Imported ${importedCount.toLocaleString()} records.`
                }
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
