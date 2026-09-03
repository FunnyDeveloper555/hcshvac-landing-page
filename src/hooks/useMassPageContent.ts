import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MassPageOverrides, MassTextBlock } from "@/lib/massPages";

export interface MassPageContentRow {
  blocks: MassTextBlock[] | null;
  overrides: MassPageOverrides | null;
}

const parseRow = (data: { blocks?: unknown; overrides?: unknown } | null): MassPageContentRow => {
  const blocks = (data?.blocks as MassTextBlock[] | null) || null;
  const overrides = (data?.overrides as MassPageOverrides | null) || null;
  return {
    blocks: Array.isArray(blocks) ? blocks : null,
    overrides: overrides && typeof overrides === "object" ? overrides : null,
  };
};

/**
 * Loads the admin-edited content for a single mass page.
 * The master template (campaign) content is used as the base and the
 * page-specific content is layered on top of it.
 */
export function useMassPageContent(
  companyId?: string | null,
  pagePath?: string | null,
  templatePath?: string | null,
) {
  const [row, setRow] = useState<MassPageContentRow>({ blocks: null, overrides: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || (!pagePath && !templatePath)) {
      setRow({ blocks: null, overrides: null });
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const paths = [templatePath, pagePath].filter(Boolean) as string[];
      const { data } = await supabase
        .from("mass_page_content")
        .select("page_path, blocks, overrides")
        .eq("company_id", companyId)
        .eq("status", "active")
        .in("page_path", paths);
      if (!active) return;

      const rows = data || [];
      const template = parseRow(rows.find((r) => r.page_path === templatePath) || null);
      const specific = parseRow(rows.find((r) => r.page_path === pagePath) || null);

      setRow({
        blocks: specific.blocks ?? template.blocks,
        overrides:
          specific.overrides || template.overrides
            ? {
                ...(template.overrides || {}),
                ...(specific.overrides || {}),
                sections: {
                  ...(template.overrides?.sections || {}),
                  ...(specific.overrides?.sections || {}),
                },
              }
            : null,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [companyId, pagePath, templatePath]);

  return { ...row, loading };
}
