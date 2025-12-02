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
      setProgress(25);
      setImportedCount(0);
      setIsComplete(false);

      console.log('Uploading CSV file to storage...');
      
      // Generate unique filename
      const fileName = `import_${Date.now()}_${file.name}`;
      
      // Upload CSV to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-imports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded, starting server-side import...');
      setProgress(50);

      // Call edge function to process the import server-side
      const { data, error: functionError } = await supabase.functions.invoke('import-business', {
        body: { filePath: fileName }
      });

      if (functionError) {
        throw new Error(`Import failed: ${functionError.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setProgress(100);
      setImportedCount(data.imported);
      setTotalCount(data.imported);
      setIsComplete(true);
      
      toast({
        title: "Import successful",
        description: data.message,
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
