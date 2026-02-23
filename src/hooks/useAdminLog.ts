import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

type EntityType = 
  | "appointment" 
  | "company" 
  | "company_image"
  | "cta_icon"
  | "cta_assignment"
  | "employee" 
  | "vendor" 
  | "service" 
  | "service_term"
  | "hero_content" 
  | "hero_image"
  | "hero"
  | "customer_registration"
  | "customer"
  | "settings"
  | "auth"
  | "booking_invitation"
  | "call"
  | "location_profile"
  | "photo"
  | "partner_listing"
  | "company_marquee"
  | "company_popup"
  | "admin_module"
  | "role_module_assignment"
  | "email_list";

type ActionType = 
  | "create" 
  | "update" 
  | "delete" 
  | "view" 
  | "status_change" 
  | "import" 
  | "export" 
  | "login" 
  | "logout" 
  | "send_booking_link"
  // Call actions
  | "call_in"
  | "call_out"
  // Communication actions
  | "email_sent"
  | "email_received"
  | "sms_sent"
  | "sms_received"
  // Customer/Location actions
  | "location_profile_created"
  | "location_profile_updated"
  | "photo_added"
  | "warranty_status_changed"
  | "note_added";

// Call reasons for tracking
export type CallReason = 
  | "looking_for_person"
  | "login_issues"
  | "account_status"
  | "update_profile"
  | "book_appointment"
  | "cancel_appointment"
  | "service_fees_inquiry"
  | "past_records"
  | "insurance_claims"
  | "warranty_status"
  | "telemarketer"
  | "robo_dialer"
  | "other";

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
