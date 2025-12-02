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

  const importBusinessViaStorage = async (file: File) => {
    try {
      setImporting(true);
      setProgress(10);
      setImportedCount(0);
      setTotalCount(0);
      setIsComplete(false);

      console.log("Uploading CSV file to storage for server-side import...");

      const filePath = `imports/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("business-imports")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      setProgress(40);

      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        imported?: number;
        message?: string;
        error?: string;
      }>("import-business", {
        body: { filePath },
      });

      if (error) {
        throw new Error(error.message || "Import function failed");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Import failed on server");
      }

      const imported = data.imported ?? 0;

      setImportedCount(imported);
      setTotalCount(imported);
      setProgress(100);
      setIsComplete(true);

      toast({
        title: "Import successful",
        description: data.message || `Imported ${imported} business records.`,
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
                <span>Importing business data... This may take several minutes for large files.</span>
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
