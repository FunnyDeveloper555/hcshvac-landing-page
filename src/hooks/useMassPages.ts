import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildCountyGroups,
  cityKey,
  CityMeta,
  MassCountyGroup,
} from "@/lib/massPages";

/**
 * Loads county + zip metadata for a company's service areas so the Mass Pages
 * menu (and each generated page URL) can include county and zip.
 */
export const useMassPages = (serviceAreas: string[] | null | undefined) => {
  const [cityMeta, setCityMeta] = useState<Record<string, CityMeta>>({});
  const [loading, setLoading] = useState(false);

  const areasKey = (serviceAreas || []).join("|");

  useEffect(() => {
    const areas = serviceAreas || [];
    if (areas.length === 0) {
      setCityMeta({});
      return;
    }

    const names = new Set<string>();
    const states = new Set<string>();
    areas.forEach((raw) => {
      const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length < 2) return;
      names.add(parts[0].replace(/\s*\(township\)\s*/i, "").trim());
      states.add(parts[parts.length - 1]);
    });
    if (names.size === 0) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const nameList = Array.from(names);
      const map: Record<string, CityMeta> = {};

      for (let i = 0; i < nameList.length; i += 200) {
        const chunk = nameList.slice(i, i + 200);
        const { data } = await supabase
          .from("cities")
          .select("name, county, state_code, zip_codes")
          .in("name", chunk)
          .in("state_code", Array.from(states));

        (data || []).forEach((row) => {
          const key = cityKey(row.name || "", row.state_code || "");
          if (!map[key]) map[key] = { county: row.county, zip: row.zip_codes };
        });
      }

      if (!cancelled) {
        setCityMeta(map);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasKey]);

  const groups: MassCountyGroup[] = useMemo(
    () => buildCountyGroups(serviceAreas, cityMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areasKey, cityMeta],
  );

  return { groups, cityMeta, loading };
};
