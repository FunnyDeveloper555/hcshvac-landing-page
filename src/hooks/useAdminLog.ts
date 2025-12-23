import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

type EntityType = 
  | "appointment" 
  | "company" 
  | "employee" 
  | "vendor" 
  | "service" 
  | "hero_content" 
  | "hero_image"
  | "hero"
  | "customer_registration"
  | "customer"
  | "settings"
  | "auth"
  | "booking_invitation";

type ActionType = "create" | "update" | "delete" | "view" | "status_change" | "import" | "export" | "login" | "logout" | "send_booking_link";

export function useAdminLog() {
  const { user } = useAuth();

  const logAction = async (
    action: ActionType,
    entityType: EntityType,
    entityId?: string,
    details?: Record<string, string | number | boolean | null>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("admin_logs").insert([{
        user_id: user.id,
        user_email: user.email || "unknown",
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details as Json || null,
      }]);

      if (error) {
        console.error("Failed to log admin action:", error);
      }
    } catch (err) {
      console.error("Error logging admin action:", err);
    }
  };

  return { logAction };
}
