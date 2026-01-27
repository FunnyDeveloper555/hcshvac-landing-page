import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CTAIcon {
  id: string;
  image_url: string;
  alt_text: string;
  custom_name: string;
}

interface Assignment {
  id: string;
  cta_icon_id: string;
  page_name: string;
  position: number | null;
  use_on_page: boolean;
  cta_icons: CTAIcon;
}

interface CompanyCTAIconsProps {
  companyId: string;
  pageName: string;
}

const CompanyCTAIcons = ({ companyId, pageName }: CompanyCTAIconsProps) => {
  // Convert page name format (about-us -> about_us)
  const normalizedPageName = pageName.replace(/-/g, '_');

  const { data: assignments = [] } = useQuery({
    queryKey: ["cta-icons-display", companyId, normalizedPageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_cta_assignments")
        .select(`
          id,
          cta_icon_id,
          page_name,
          position,
          use_on_page,
          cta_icons (
            id,
            image_url,
            alt_text,
            custom_name,
            is_active
          )
        `)
        .eq("company_id", companyId)
        .eq("page_name", normalizedPageName)
        .eq("use_on_page", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data || []).filter((item: any) => item.cta_icons?.is_active !== false);
    },
    enabled: !!companyId && !!pageName,
  });

  if (assignments.length === 0) return null;

  return (
    <div className="py-6 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {assignments.map((assignment: any) => (
            <div
              key={assignment.id}
              className="flex items-center justify-center p-2 transition-transform hover:scale-105"
            >
              <img
                src={assignment.cta_icons.image_url}
                alt={assignment.cta_icons.alt_text || assignment.cta_icons.custom_name}
                className="h-12 md:h-16 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyCTAIcons;
