import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MassPageOverrides, MassTextBlock } from "@/lib/massPages";

export interface MassPageContentRow {
  blocks: MassTextBlock[] | null;
  overrides: MassPageOverrides | null;
}

/** Loads the admin-edited content for a single mass page (null while loading). */
export function useMassPageContent(companyId?: string | null, pagePath?: string | null) {
  const [row, setRow] = useState<MassPageContentRow>({ blocks: null, overrides: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !pagePath) {
      setRow({ blocks: null, overrides: null });
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("mass_page_content")
        .select("blocks, overrides")
        .eq("company_id", companyId)
        .eq("page_path", pagePath)
        .eq("status", "active")
        .maybeSingle();
      if (!active) return;
      const blocks = (data?.blocks as unknown as MassTextBlock[] | null) || null;
      const overrides = (data?.overrides as unknown as MassPageOverrides | null) || null;
      setRow({
        blocks: Array.isArray(blocks) ? blocks : null,
        overrides: overrides && typeof overrides === "object" ? overrides : null,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [companyId, pagePath]);

  return { ...row, loading };
}
