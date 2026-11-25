import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TYPE_NAMES, defaultForm, readFieldKeys, type FormElement, type ProductTypeForm } from "@/lib/productForms";

export function useProductForms() {
  return useQuery({
    queryKey: ["product-type-forms"], staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_type_forms").select("id,name,fields,is_active,applicable_areas").order("name");
      if (error) throw error;
      return (data || []).map(row => ({ ...row, fields: readFieldKeys(row.fields), applicable_areas: row.applicable_areas || [] })) as ProductTypeForm[];
    },
  });
}
export function useProductFormElements() {
  return useQuery({
    queryKey: ["product-form-elements"], staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_form_elements").select("key,label,kind,options").order("created_at");
      if (error) throw error;
      return (data || []).map(row => ({ ...row, options: readFieldKeys(row.options), section: "Custom Elements" })) as FormElement[];
    },
  });
}
export function availableProductForms(saved: ProductTypeForm[] = []): ProductTypeForm[] {
  const forms = DEFAULT_TYPE_NAMES.map(name => saved.find(row => row.name.toLowerCase() === name.toLowerCase()) || defaultForm(name));
  return [...forms, ...saved.filter(row => !DEFAULT_TYPE_NAMES.some(name => name.toLowerCase() === row.name.toLowerCase()))];
}