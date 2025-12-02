import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('File path is required');
    }

    console.log('Downloading CSV file from storage:', filePath);
    
    // Download the CSV file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('business-imports')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    console.log(`Processing ${lines.length} lines`);
    
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or has only headers');
    }

    // Parse CSV with proper quote handling
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

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
    console.log('Headers:', headers);
    
    const records = lines.slice(1)
      .map((line) => {
        try {
          const values = parseCSVLine(line).map(v => v.replace(/"/g, '').trim());
          const record: any = {};
        
          headers.forEach((header, index) => {
            const value = values[index];
            
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
          console.error('Error parsing line:', error);
          return null;
        }
      })
      .filter(record => record !== null);

    console.log(`Parsed ${records.length} valid records, starting batch insert`);
    
    const batchSize = 1000; // Large batch size for server-side processing
    let importedCount = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('business')
        .insert(batch);
      
      if (error) {
        console.error(`Batch insert error at index ${i}:`, error);
        throw error;
      }
      
      importedCount += batch.length;
      console.log(`Imported ${importedCount} / ${records.length} records`);
    }

    // Clean up the uploaded file
    await supabase.storage
      .from('business-imports')
      .remove([filePath]);

    console.log('Import completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        imported: records.length,
        message: `Successfully imported ${records.length} business records`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
