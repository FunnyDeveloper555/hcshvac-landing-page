import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CitiesImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const importCities = async () => {
    setImporting(true);
    setProgress(0);
    setImportedCount(0);
    setIsComplete(false);

    try {
      // Fetch the CSV file
      const response = await fetch('/data/us-cities.csv');
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find column indices - CSV uses "id" not "city_id"
      const cityIdIndex = headers.indexOf('id');
      const nameIndex = headers.indexOf('name');
      const countyIndex = headers.indexOf('county');
      const stateCodeIndex = headers.indexOf('state_code');
      const stateIndex = headers.indexOf('state');
      const zipCodesIndex = headers.indexOf('zip_codes');
      const typeIndex = headers.indexOf('type');
      const latitudeIndex = headers.indexOf('latitude');
      const longitudeIndex = headers.indexOf('longitude');
      const areaCodeIndex = headers.indexOf('area_code');
      const populationIndex = headers.indexOf('population');
      const householdsIndex = headers.indexOf('households');
      const medianIncomeIndex = headers.indexOf('median_income');
      const landAreaIndex = headers.indexOf('land_area');
      const waterAreaIndex = headers.indexOf('water_area');
      const timeZoneIndex = headers.indexOf('time_zone');

      const cities = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        cities.push({
          city_id: parseInt(values[cityIdIndex]) || 0,
          name: values[nameIndex] || '',
          county: values[countyIndex] || null,
          state_code: values[stateCodeIndex] || '',
          state: values[stateIndex] || '',
          zip_codes: values[zipCodesIndex] || null,
          type: values[typeIndex] || null,
          latitude: values[latitudeIndex] ? parseFloat(values[latitudeIndex]) : null,
          longitude: values[longitudeIndex] ? parseFloat(values[longitudeIndex]) : null,
          area_code: values[areaCodeIndex] || null,
          population: values[populationIndex] ? parseInt(values[populationIndex]) : null,
          households: values[householdsIndex] ? parseInt(values[householdsIndex]) : null,
          median_income: values[medianIncomeIndex] ? parseFloat(values[medianIncomeIndex]) : null,
          land_area: values[landAreaIndex] ? parseFloat(values[landAreaIndex]) : null,
          water_area: values[waterAreaIndex] ? parseFloat(values[waterAreaIndex]) : null,
          time_zone: values[timeZoneIndex] || null,
        });
      }

      setTotalCount(cities.length);

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('cities')
          .insert(batch);

        if (error) {
          console.error('Batch insert error:', error);
          throw error;
        }

        setImportedCount(i + batch.length);
        setProgress(((i + batch.length) / cities.length) * 100);
      }

      setIsComplete(true);
      toast({
        title: "Success",
        description: `Successfully imported ${cities.length} cities`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import cities",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Import US Cities</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>CSV Import</CardTitle>
          <CardDescription>
            Import US cities data from the CSV file into the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!importing && !isComplete && (
            <Button onClick={importCities} size="lg">
              <Upload className="mr-2 h-4 w-4" />
              Start Import
            </Button>
          )}

          {importing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importing cities...</span>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                Imported {importedCount} of {totalCount} cities ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {isComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                Import complete! {importedCount} cities imported successfully.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CitiesImport;
