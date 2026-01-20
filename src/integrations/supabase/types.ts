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
      admin_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          closed_at: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_invitations: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_type: string
          expires_at: string | null
          id: string
          invitation_type: string
          notes: string | null
          opened_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_type: string
          expires_at?: string | null
          id?: string
          invitation_type: string
          notes?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          expires_at?: string | null
          id?: string
          invitation_type?: string
          notes?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business: {
        Row: {
          address: string | null
          address2: string | null
          area_code: string | null
          base_category: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          county_code: string | null
          created_at: string
          detailed_category: string | null
          exact_category: string | null
          facebook: string | null
          fax_number: string | null
          id: string
          job_title: string | null
          latitude: number | null
          location_type: string | null
          longitude: number | null
          market_variable: string | null
          naics: string | null
          no: number | null
          revenue_1: number | null
          revenue_2: number | null
          sic_2: string | null
          sic_4: string | null
          state: string | null
          telephone_number: string | null
          toll_free_number: string | null
          total_employees: number | null
          twitter: string | null
          updated_at: string
          web_address: string | null
          year_founded: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          address2?: string | null
          area_code?: string | null
          base_category?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          county_code?: string | null
          created_at?: string
          detailed_category?: string | null
          exact_category?: string | null
          facebook?: string | null
          fax_number?: string | null
          id?: string
          job_title?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          market_variable?: string | null
          naics?: string | null
          no?: number | null
          revenue_1?: number | null
          revenue_2?: number | null
          sic_2?: string | null
          sic_4?: string | null
          state?: string | null
          telephone_number?: string | null
          toll_free_number?: string | null
          total_employees?: number | null
          twitter?: string | null
          updated_at?: string
          web_address?: string | null
          year_founded?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          address2?: string | null
          area_code?: string | null
          base_category?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          county_code?: string | null
          created_at?: string
          detailed_category?: string | null
          exact_category?: string | null
          facebook?: string | null
          fax_number?: string | null
          id?: string
          job_title?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          market_variable?: string | null
          naics?: string | null
          no?: number | null
          revenue_1?: number | null
          revenue_2?: number | null
          sic_2?: string | null
          sic_4?: string | null
          state?: string | null
          telephone_number?: string | null
          toll_free_number?: string | null
          total_employees?: number | null
          twitter?: string | null
          updated_at?: string
          web_address?: string | null
          year_founded?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          area_code: string | null
          city_id: number
          county: string | null
          created_at: string
          households: number | null
          id: string
          land_area: number | null
          latitude: number | null
          longitude: number | null
          median_income: number | null
          name: string
          population: number | null
          state: string
          state_code: string
          time_zone: string | null
          type: string | null
          water_area: number | null
          zip_codes: string | null
        }
        Insert: {
          area_code?: string | null
          city_id: number
          county?: string | null
          created_at?: string
          households?: number | null
          id?: string
          land_area?: number | null
          latitude?: number | null
          longitude?: number | null
          median_income?: number | null
          name: string
          population?: number | null
          state: string
          state_code: string
          time_zone?: string | null
          type?: string | null
          water_area?: number | null
          zip_codes?: string | null
        }
        Update: {
          area_code?: string | null
          city_id?: number
          county?: string | null
          created_at?: string
          households?: number | null
          id?: string
          land_area?: number | null
          latitude?: number | null
          longitude?: number | null
          median_income?: number | null
          name?: string
          population?: number | null
          state?: string
          state_code?: string
          time_zone?: string | null
          type?: string | null
          water_area?: number | null
          zip_codes?: string | null
        }
        Relationships: []
      }
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
          coupon_1_code: string | null
          coupon_1_description: string | null
          coupon_1_title: string | null
          coupon_2_code: string | null
          coupon_2_description: string | null
          coupon_2_title: string | null
          coupon_3_code: string | null
          coupon_3_description: string | null
          coupon_3_title: string | null
          created_at: string
          display_order: number
          financing_enabled: boolean | null
          financing_provider: string | null
          financing_url: string | null
          hero_image_url: string | null
          hvac_brands_install: Json | null
          hvac_brands_repair: Json | null
          hvac_brands_service: Json | null
          hvac_equipment_install: Json | null
          hvac_equipment_repair: Json | null
          hvac_equipment_service: Json | null
          id: string
          inventory_equipment: string | null
          inventory_locations: string | null
          inventory_parts: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          partner_companies: Json | null
          plumbing_equipment_install: Json | null
          plumbing_equipment_repair: Json | null
          plumbing_equipment_service: Json | null
          poc_email: string | null
          poc_first_name: string | null
          poc_last_name: string | null
          poc_phone: string | null
          poc_title: string | null
          primary_color: string | null
          secondary_poc_email: string | null
          secondary_poc_first_name: string | null
          secondary_poc_last_name: string | null
          secondary_poc_phone: string | null
          secondary_poc_title: string | null
          service_areas: Json | null
          services_provided: Json | null
          slug: string | null
          theme_style: string | null
          website_description: string | null
          website_tagline: string | null
          website_title: string | null
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
          coupon_1_code?: string | null
          coupon_1_description?: string | null
          coupon_1_title?: string | null
          coupon_2_code?: string | null
          coupon_2_description?: string | null
          coupon_2_title?: string | null
          coupon_3_code?: string | null
          coupon_3_description?: string | null
          coupon_3_title?: string | null
          created_at?: string
          display_order?: number
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          hero_image_url?: string | null
          hvac_brands_install?: Json | null
          hvac_brands_repair?: Json | null
          hvac_brands_service?: Json | null
          hvac_equipment_install?: Json | null
          hvac_equipment_repair?: Json | null
          hvac_equipment_service?: Json | null
          id?: string
          inventory_equipment?: string | null
          inventory_locations?: string | null
          inventory_parts?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          partner_companies?: Json | null
          plumbing_equipment_install?: Json | null
          plumbing_equipment_repair?: Json | null
          plumbing_equipment_service?: Json | null
          poc_email?: string | null
          poc_first_name?: string | null
          poc_last_name?: string | null
          poc_phone?: string | null
          poc_title?: string | null
          primary_color?: string | null
          secondary_poc_email?: string | null
          secondary_poc_first_name?: string | null
          secondary_poc_last_name?: string | null
          secondary_poc_phone?: string | null
          secondary_poc_title?: string | null
          service_areas?: Json | null
          services_provided?: Json | null
          slug?: string | null
          theme_style?: string | null
          website_description?: string | null
          website_tagline?: string | null
          website_title?: string | null
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
          coupon_1_code?: string | null
          coupon_1_description?: string | null
          coupon_1_title?: string | null
          coupon_2_code?: string | null
          coupon_2_description?: string | null
          coupon_2_title?: string | null
          coupon_3_code?: string | null
          coupon_3_description?: string | null
          coupon_3_title?: string | null
          created_at?: string
          display_order?: number
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          hero_image_url?: string | null
          hvac_brands_install?: Json | null
          hvac_brands_repair?: Json | null
          hvac_brands_service?: Json | null
          hvac_equipment_install?: Json | null
          hvac_equipment_repair?: Json | null
          hvac_equipment_service?: Json | null
          id?: string
          inventory_equipment?: string | null
          inventory_locations?: string | null
          inventory_parts?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          partner_companies?: Json | null
          plumbing_equipment_install?: Json | null
          plumbing_equipment_repair?: Json | null
          plumbing_equipment_service?: Json | null
          poc_email?: string | null
          poc_first_name?: string | null
          poc_last_name?: string | null
          poc_phone?: string | null
          poc_title?: string | null
          primary_color?: string | null
          secondary_poc_email?: string | null
          secondary_poc_first_name?: string | null
          secondary_poc_last_name?: string | null
          secondary_poc_phone?: string | null
          secondary_poc_title?: string | null
          service_areas?: Json | null
          services_provided?: Json | null
          slug?: string | null
          theme_style?: string | null
          website_description?: string | null
          website_tagline?: string | null
          website_title?: string | null
        }
        Relationships: []
      }
      customer_registrations: {
        Row: {
          account_number: string | null
          bill_to_address: string | null
          bill_to_business_name: string | null
          bill_to_city: string | null
          bill_to_first_name: string | null
          bill_to_last_name: string | null
          bill_to_same_as_ship_to: boolean | null
          bill_to_state: string | null
          bill_to_suite_number: string | null
          bill_to_zip_code: string | null
          build_year: number | null
          building_occupied: string | null
          business_phone: string | null
          business_type: string | null
          cautions_restrictions: string | null
          company_id: string | null
          corporation_name: string | null
          created_at: string
          email: string
          ems_monitoring: boolean | null
          ems_provider_info: string | null
          equipment_location: string | null
          hours_of_operation: string | null
          housing_type: string | null
          id: string
          initial_visit_notes: string | null
          last_visit_date: string | null
          location_age_years: number | null
          location_type: string
          lock_boxes_codes: string | null
          occupied_by: string | null
          on_location_during_visit: string | null
          phone: string
          point_of_contact_email: string | null
          point_of_contact_name: string | null
          point_of_contact_phone: string | null
          residential_occupancy: string | null
          residential_type: string | null
          responsible_billing_party: string | null
          security_gate_access: boolean | null
          ship_to_address: string
          ship_to_business_name: string | null
          ship_to_city: string
          ship_to_first_name: string
          ship_to_last_name: string
          ship_to_state: string
          ship_to_suite_number: string | null
          ship_to_zip_code: string
          title_to_location: string | null
          type_of_use: string | null
          warranty_status: string | null
        }
        Insert: {
          account_number?: string | null
          bill_to_address?: string | null
          bill_to_business_name?: string | null
          bill_to_city?: string | null
          bill_to_first_name?: string | null
          bill_to_last_name?: string | null
          bill_to_same_as_ship_to?: boolean | null
          bill_to_state?: string | null
          bill_to_suite_number?: string | null
          bill_to_zip_code?: string | null
          build_year?: number | null
          building_occupied?: string | null
          business_phone?: string | null
          business_type?: string | null
          cautions_restrictions?: string | null
          company_id?: string | null
          corporation_name?: string | null
          created_at?: string
          email?: string
          ems_monitoring?: boolean | null
          ems_provider_info?: string | null
          equipment_location?: string | null
          hours_of_operation?: string | null
          housing_type?: string | null
          id?: string
          initial_visit_notes?: string | null
          last_visit_date?: string | null
          location_age_years?: number | null
          location_type: string
          lock_boxes_codes?: string | null
          occupied_by?: string | null
          on_location_during_visit?: string | null
          phone?: string
          point_of_contact_email?: string | null
          point_of_contact_name?: string | null
          point_of_contact_phone?: string | null
          residential_occupancy?: string | null
          residential_type?: string | null
          responsible_billing_party?: string | null
          security_gate_access?: boolean | null
          ship_to_address: string
          ship_to_business_name?: string | null
          ship_to_city: string
          ship_to_first_name: string
          ship_to_last_name: string
          ship_to_state: string
          ship_to_suite_number?: string | null
          ship_to_zip_code: string
          title_to_location?: string | null
          type_of_use?: string | null
          warranty_status?: string | null
        }
        Update: {
          account_number?: string | null
          bill_to_address?: string | null
          bill_to_business_name?: string | null
          bill_to_city?: string | null
          bill_to_first_name?: string | null
          bill_to_last_name?: string | null
          bill_to_same_as_ship_to?: boolean | null
          bill_to_state?: string | null
          bill_to_suite_number?: string | null
          bill_to_zip_code?: string | null
          build_year?: number | null
          building_occupied?: string | null
          business_phone?: string | null
          business_type?: string | null
          cautions_restrictions?: string | null
          company_id?: string | null
          corporation_name?: string | null
          created_at?: string
          email?: string
          ems_monitoring?: boolean | null
          ems_provider_info?: string | null
          equipment_location?: string | null
          hours_of_operation?: string | null
          housing_type?: string | null
          id?: string
          initial_visit_notes?: string | null
          last_visit_date?: string | null
          location_age_years?: number | null
          location_type?: string
          lock_boxes_codes?: string | null
          occupied_by?: string | null
          on_location_during_visit?: string | null
          phone?: string
          point_of_contact_email?: string | null
          point_of_contact_name?: string | null
          point_of_contact_phone?: string | null
          residential_occupancy?: string | null
          residential_type?: string | null
          responsible_billing_party?: string | null
          security_gate_access?: boolean | null
          ship_to_address?: string
          ship_to_business_name?: string | null
          ship_to_city?: string
          ship_to_first_name?: string
          ship_to_last_name?: string
          ship_to_state?: string
          ship_to_suite_number?: string | null
          ship_to_zip_code?: string
          title_to_location?: string | null
          type_of_use?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_registrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      generated_pages: {
        Row: {
          areas_content: Json | null
          audience_type: string | null
          brands_content: Json | null
          campaign_id: string
          company_id: string | null
          coupons_content: Json | null
          created_at: string
          equipment_type: string | null
          hero_content: Json | null
          id: string
          location_city: string | null
          location_county: string | null
          location_state: string | null
          location_zip: string | null
          meta_description: string | null
          published_at: string | null
          reviews_content: Json | null
          services_content: Json | null
          slug: string
          status: string
          title: string
          updated_at: string
          visit_type: string | null
        }
        Insert: {
          areas_content?: Json | null
          audience_type?: string | null
          brands_content?: Json | null
          campaign_id: string
          company_id?: string | null
          coupons_content?: Json | null
          created_at?: string
          equipment_type?: string | null
          hero_content?: Json | null
          id?: string
          location_city?: string | null
          location_county?: string | null
          location_state?: string | null
          location_zip?: string | null
          meta_description?: string | null
          published_at?: string | null
          reviews_content?: Json | null
          services_content?: Json | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          visit_type?: string | null
        }
        Update: {
          areas_content?: Json | null
          audience_type?: string | null
          brands_content?: Json | null
          campaign_id?: string
          company_id?: string | null
          coupons_content?: Json | null
          created_at?: string
          equipment_type?: string | null
          hero_content?: Json | null
          id?: string
          location_city?: string | null
          location_county?: string | null
          location_state?: string | null
          location_zip?: string | null
          meta_description?: string | null
          published_at?: string | null
          reviews_content?: Json | null
          services_content?: Json | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_pages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "page_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      page_campaigns: {
        Row: {
          audience_types: Json | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          equipment_types: Json | null
          id: string
          location_cities: Json | null
          location_counties: Json | null
          location_states: Json | null
          name: string
          naming_pattern: string | null
          pages_published: number | null
          status: string
          template_id: string | null
          total_pages_generated: number | null
          updated_at: string
          visit_types: Json | null
        }
        Insert: {
          audience_types?: Json | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_types?: Json | null
          id?: string
          location_cities?: Json | null
          location_counties?: Json | null
          location_states?: Json | null
          name: string
          naming_pattern?: string | null
          pages_published?: number | null
          status?: string
          template_id?: string | null
          total_pages_generated?: number | null
          updated_at?: string
          visit_types?: Json | null
        }
        Update: {
          audience_types?: Json | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_types?: Json | null
          id?: string
          location_cities?: Json | null
          location_counties?: Json | null
          location_states?: Json | null
          name?: string
          naming_pattern?: string | null
          pages_published?: number | null
          status?: string
          template_id?: string | null
          total_pages_generated?: number | null
          updated_at?: string
          visit_types?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "page_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      page_filter_options: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          value?: string
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
      service_terms: {
        Row: {
          applies_to: string
          company_id: string | null
          created_at: string
          display_order: number | null
          equipment_type: string | null
          hours_of_service: string | null
          id: string
          industry_category: string | null
          is_active: boolean | null
          listing_id: string
          location_type: string | null
          page_url: string | null
          primary_keyword: string
          service_type: string | null
          updated_at: string
        }
        Insert: {
          applies_to: string
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          equipment_type?: string | null
          hours_of_service?: string | null
          id?: string
          industry_category?: string | null
          is_active?: boolean | null
          listing_id: string
          location_type?: string | null
          page_url?: string | null
          primary_keyword: string
          service_type?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          equipment_type?: string | null
          hours_of_service?: string | null
          id?: string
          industry_category?: string | null
          is_active?: boolean | null
          listing_id?: string
          location_type?: string | null
          page_url?: string | null
          primary_keyword?: string
          service_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      get_business_counts_by_cities: {
        Args: { city_names: string[]; state_codes: string[] }
        Returns: {
          business_count: number
          city_name: string
          state_code: string
        }[]
      }
      get_counties_by_states: {
        Args: { state_codes: string[] }
        Returns: {
          county: string
          state_code: string
        }[]
      }
      get_distinct_states: {
        Args: never
        Returns: {
          state: string
          state_code: string
        }[]
      }
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
      appointment_status: "open" | "closed" | "cancelled"
      appointment_type:
        | "residential"
        | "commercial"
        | "non_profit"
        | "church"
        | "school"
        | "government"
        | "other"
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
      appointment_status: ["open", "closed", "cancelled"],
      appointment_type: [
        "residential",
        "commercial",
        "non_profit",
        "church",
        "school",
        "government",
        "other",
      ],
    },
  },
} as const
