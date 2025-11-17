export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          affiliations: Json | null
          brands_installed: Json | null
          brands_serviced: Json | null
          company_address: string | null
          company_city: string | null
          company_email_primary: string | null
          company_phone: string | null
          company_state: string | null
          company_support_email: string | null
          company_zip_code: string | null
          created_at: string
          display_order: number
          id: string
          inventory_equipment: string | null
          inventory_locations: string | null
          inventory_parts: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          poc_email: string | null
          poc_first_name: string | null
          poc_last_name: string | null
          poc_phone: string | null
          poc_title: string | null
          secondary_poc_email: string | null
          secondary_poc_first_name: string | null
          secondary_poc_last_name: string | null
          secondary_poc_phone: string | null
          secondary_poc_title: string | null
          service_areas: Json | null
          services_provided: Json | null
        }
        Insert: {
          affiliations?: Json | null
          brands_installed?: Json | null
          brands_serviced?: Json | null
          company_address?: string | null
          company_city?: string | null
          company_email_primary?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_support_email?: string | null
          company_zip_code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          inventory_equipment?: string | null
          inventory_locations?: string | null
          inventory_parts?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          poc_email?: string | null
          poc_first_name?: string | null
          poc_last_name?: string | null
          poc_phone?: string | null
          poc_title?: string | null
          secondary_poc_email?: string | null
          secondary_poc_first_name?: string | null
          secondary_poc_last_name?: string | null
          secondary_poc_phone?: string | null
          secondary_poc_title?: string | null
          service_areas?: Json | null
          services_provided?: Json | null
        }
        Update: {
          affiliations?: Json | null
          brands_installed?: Json | null
          brands_serviced?: Json | null
          company_address?: string | null
          company_city?: string | null
          company_email_primary?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_support_email?: string | null
          company_zip_code?: string | null
          created_at?: string
          display_order?: number
          id?: string
          inventory_equipment?: string | null
          inventory_locations?: string | null
          inventory_parts?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          poc_email?: string | null
          poc_first_name?: string | null
          poc_last_name?: string | null
          poc_phone?: string | null
          poc_title?: string | null
          secondary_poc_email?: string | null
          secondary_poc_first_name?: string | null
          secondary_poc_last_name?: string | null
          secondary_poc_phone?: string | null
          secondary_poc_title?: string | null
          service_areas?: Json | null
          services_provided?: Json | null
        }
        Relationships: []
      }
      customer_registrations: {
        Row: {
          bill_to_address: string | null
          bill_to_business_name: string | null
          bill_to_city: string | null
          bill_to_first_name: string | null
          bill_to_last_name: string | null
          bill_to_same_as_ship_to: boolean | null
          bill_to_state: string | null
          bill_to_suite_number: string | null
          bill_to_zip_code: string | null
          building_occupied: string | null
          cautions_restrictions: string | null
          created_at: string
          email: string
          equipment_location: string | null
          hours_of_operation: string | null
          id: string
          location_age_years: number | null
          location_type: string
          phone: string
          point_of_contact_email: string | null
          point_of_contact_name: string | null
          point_of_contact_phone: string | null
          residential_occupancy: string | null
          residential_type: string | null
          ship_to_address: string
          ship_to_business_name: string | null
          ship_to_city: string
          ship_to_first_name: string
          ship_to_last_name: string
          ship_to_state: string
          ship_to_suite_number: string | null
          ship_to_zip_code: string
          type_of_use: string | null
        }
        Insert: {
          bill_to_address?: string | null
          bill_to_business_name?: string | null
          bill_to_city?: string | null
          bill_to_first_name?: string | null
          bill_to_last_name?: string | null
          bill_to_same_as_ship_to?: boolean | null
          bill_to_state?: string | null
          bill_to_suite_number?: string | null
          bill_to_zip_code?: string | null
          building_occupied?: string | null
          cautions_restrictions?: string | null
          created_at?: string
          email?: string
          equipment_location?: string | null
          hours_of_operation?: string | null
          id?: string
          location_age_years?: number | null
          location_type: string
          phone?: string
          point_of_contact_email?: string | null
          point_of_contact_name?: string | null
          point_of_contact_phone?: string | null
          residential_occupancy?: string | null
          residential_type?: string | null
          ship_to_address: string
          ship_to_business_name?: string | null
          ship_to_city: string
          ship_to_first_name: string
          ship_to_last_name: string
          ship_to_state: string
          ship_to_suite_number?: string | null
          ship_to_zip_code: string
          type_of_use?: string | null
        }
        Update: {
          bill_to_address?: string | null
          bill_to_business_name?: string | null
          bill_to_city?: string | null
          bill_to_first_name?: string | null
          bill_to_last_name?: string | null
          bill_to_same_as_ship_to?: boolean | null
          bill_to_state?: string | null
          bill_to_suite_number?: string | null
          bill_to_zip_code?: string | null
          building_occupied?: string | null
          cautions_restrictions?: string | null
          created_at?: string
          email?: string
          equipment_location?: string | null
          hours_of_operation?: string | null
          id?: string
          location_age_years?: number | null
          location_type?: string
          phone?: string
          point_of_contact_email?: string | null
          point_of_contact_name?: string | null
          point_of_contact_phone?: string | null
          residential_occupancy?: string | null
          residential_type?: string | null
          ship_to_address?: string
          ship_to_business_name?: string | null
          ship_to_city?: string
          ship_to_first_name?: string
          ship_to_last_name?: string
          ship_to_state?: string
          ship_to_suite_number?: string | null
          ship_to_zip_code?: string
          type_of_use?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string
          birth_gender: string | null
          certificates_held: string | null
          city: string
          city_of_birth: string | null
          created_at: string
          date_of_birth: string
          drivers_license_number: string | null
          email_address: string
          first_name: string
          four_year_college: string | null
          high_school: string | null
          id: string
          last_name: string
          licenses_held: string | null
          middle_name: string | null
          phone_number: string
          prev_business_name: string | null
          prev_corporate_address: string | null
          prev_corporate_city: string | null
          prev_corporate_contact_person: string | null
          prev_corporate_phone_number: string | null
          prev_corporate_state: string | null
          prev_corporate_zip_code: string | null
          prev_eligible_for_rehire: boolean | null
          prev_end_month: string | null
          prev_end_year: string | null
          prev_ending_position: string | null
          prev_reason_for_leaving: string | null
          prev_start_month: string | null
          prev_start_year: string | null
          prev_starting_position: string | null
          prev_work_address: string | null
          prev_work_city: string | null
          prev_work_contact_person: string | null
          prev_work_phone_number: string | null
          prev_work_state: string | null
          prev_work_zip_code: string | null
          social_security_number: string | null
          state: string
          state_of_birth: string | null
          trade_school: string | null
          two_year_college: string | null
          updated_at: string
          us_citizen: boolean | null
          zip_code: string
        }
        Insert: {
          address: string
          birth_gender?: string | null
          certificates_held?: string | null
          city: string
          city_of_birth?: string | null
          created_at?: string
          date_of_birth: string
          drivers_license_number?: string | null
          email_address: string
          first_name: string
          four_year_college?: string | null
          high_school?: string | null
          id?: string
          last_name: string
          licenses_held?: string | null
          middle_name?: string | null
          phone_number: string
          prev_business_name?: string | null
          prev_corporate_address?: string | null
          prev_corporate_city?: string | null
          prev_corporate_contact_person?: string | null
          prev_corporate_phone_number?: string | null
          prev_corporate_state?: string | null
          prev_corporate_zip_code?: string | null
          prev_eligible_for_rehire?: boolean | null
          prev_end_month?: string | null
          prev_end_year?: string | null
          prev_ending_position?: string | null
          prev_reason_for_leaving?: string | null
          prev_start_month?: string | null
          prev_start_year?: string | null
          prev_starting_position?: string | null
          prev_work_address?: string | null
          prev_work_city?: string | null
          prev_work_contact_person?: string | null
          prev_work_phone_number?: string | null
          prev_work_state?: string | null
          prev_work_zip_code?: string | null
          social_security_number?: string | null
          state: string
          state_of_birth?: string | null
          trade_school?: string | null
          two_year_college?: string | null
          updated_at?: string
          us_citizen?: boolean | null
          zip_code: string
        }
        Update: {
          address?: string
          birth_gender?: string | null
          certificates_held?: string | null
          city?: string
          city_of_birth?: string | null
          created_at?: string
          date_of_birth?: string
          drivers_license_number?: string | null
          email_address?: string
          first_name?: string
          four_year_college?: string | null
          high_school?: string | null
          id?: string
          last_name?: string
          licenses_held?: string | null
          middle_name?: string | null
          phone_number?: string
          prev_business_name?: string | null
          prev_corporate_address?: string | null
          prev_corporate_city?: string | null
          prev_corporate_contact_person?: string | null
          prev_corporate_phone_number?: string | null
          prev_corporate_state?: string | null
          prev_corporate_zip_code?: string | null
          prev_eligible_for_rehire?: boolean | null
          prev_end_month?: string | null
          prev_end_year?: string | null
          prev_ending_position?: string | null
          prev_reason_for_leaving?: string | null
          prev_start_month?: string | null
          prev_start_year?: string | null
          prev_starting_position?: string | null
          prev_work_address?: string | null
          prev_work_city?: string | null
          prev_work_contact_person?: string | null
          prev_work_phone_number?: string | null
          prev_work_state?: string | null
          prev_work_zip_code?: string | null
          social_security_number?: string | null
          state?: string
          state_of_birth?: string | null
          trade_school?: string | null
          two_year_college?: string | null
          updated_at?: string
          us_citizen?: boolean | null
          zip_code?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          badge_text: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          primary_button_link: string
          primary_button_text: string
          secondary_button_link: string
          secondary_button_text: string
          stat1_label: string
          stat1_value: string
          stat2_label: string
          stat2_value: string
          stat3_label: string
          stat3_value: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          primary_button_link?: string
          primary_button_text?: string
          secondary_button_link?: string
          secondary_button_text?: string
          stat1_label?: string
          stat1_value?: string
          stat2_label?: string
          stat2_value?: string
          stat3_label?: string
          stat3_value?: string
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          primary_button_link?: string
          primary_button_text?: string
          secondary_button_link?: string
          secondary_button_text?: string
          stat1_label?: string
          stat1_value?: string
          stat2_label?: string
          stat2_value?: string
          stat3_label?: string
          stat3_value?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_images: {
        Row: {
          alt_text: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean | null
        }
        Insert: {
          alt_text: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean | null
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          service_id: string
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          service_id: string
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          preferred_date?: string
          preferred_time?: string
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string
          detailed_description: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          price_from: number | null
          price_label: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          detailed_description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          price_from?: number | null
          price_label?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          detailed_description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          price_from?: number | null
          price_label?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_industries: {
        Row: {
          created_at: string
          id: string
          product_brand_name: string
          product_category: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_brand_name: string
          product_category: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_brand_name?: string
          product_category?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_industries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          hours_of_operation: string | null
          id: string
          logo_url: string | null
          our_account_number: string | null
          phone: string
          representative_email: string
          representative_first_name: string
          representative_last_name: string
          representative_phone: string
          updated_at: string
          vendor_address: string
          vendor_name: string
          website: string | null
        }
        Insert: {
          created_at?: string
          hours_of_operation?: string | null
          id?: string
          logo_url?: string | null
          our_account_number?: string | null
          phone: string
          representative_email: string
          representative_first_name: string
          representative_last_name: string
          representative_phone: string
          updated_at?: string
          vendor_address: string
          vendor_name: string
          website?: string | null
        }
        Update: {
          created_at?: string
          hours_of_operation?: string | null
          id?: string
          logo_url?: string | null
          our_account_number?: string | null
          phone?: string
          representative_email?: string
          representative_first_name?: string
          representative_last_name?: string
          representative_phone?: string
          updated_at?: string
          vendor_address?: string
          vendor_name?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
