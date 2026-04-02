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
      admin_modules: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          name?: string
          updated_at?: string
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
      brands: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
          banner_image_ids: string[]
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
          coupons: Json | null
          created_at: string
          display_order: number
          financing_enabled: boolean | null
          financing_provider: string | null
          financing_url: string | null
          header_pages: Json | null
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
          banner_image_ids?: string[]
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
          coupons?: Json | null
          created_at?: string
          display_order?: number
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          header_pages?: Json | null
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
          banner_image_ids?: string[]
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
          coupons?: Json | null
          created_at?: string
          display_order?: number
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          header_pages?: Json | null
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
      company_banners: {
        Row: {
          animation_style: string
          company_id: string
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean | null
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          animation_style?: string
          company_id: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
          tagline?: string
          title?: string
          updated_at?: string
        }
        Update: {
          animation_style?: string
          company_id?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_banners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_domains: {
        Row: {
          company_id: string
          created_at: string
          domain_name: string
          id: string
          is_primary: boolean | null
          notes: string | null
          record_type: string
          ssl_status: string
          status: string
          subdomain: string | null
          target_ip: string
          txt_verify_value: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          domain_name: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          record_type?: string
          ssl_status?: string
          status?: string
          subdomain?: string | null
          target_ip?: string
          txt_verify_value?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          domain_name?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          record_type?: string
          ssl_status?: string
          status?: string
          subdomain?: string | null
          target_ip?: string
          txt_verify_value?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_images: {
        Row: {
          alt_text: string
          company_id: string
          created_at: string
          display_order: number
          id: string
          image_type: string
          image_url: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          alt_text?: string
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_type?: string
          image_url: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          alt_text?: string
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_type?: string
          image_url?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_marquees: {
        Row: {
          company_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          link_url: string | null
          marquee_type: string
          reference_id: string | null
          text: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          marquee_type?: string
          reference_id?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          marquee_type?: string
          reference_id?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_marquees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_popups: {
        Row: {
          background_color: string | null
          button_text: string | null
          button_url: string | null
          company_id: string
          content_type: string
          created_at: string
          destination_window: string
          display_order: number | null
          file_url: string | null
          id: string
          image_urls: Json | null
          is_active: boolean | null
          message: string
          popup_type: string
          publish_end_date: string | null
          publish_start_date: string | null
          redirect_url: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          company_id: string
          content_type?: string
          created_at?: string
          destination_window?: string
          display_order?: number | null
          file_url?: string | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean | null
          message?: string
          popup_type?: string
          publish_end_date?: string | null
          publish_start_date?: string | null
          redirect_url?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          button_text?: string | null
          button_url?: string | null
          company_id?: string
          content_type?: string
          created_at?: string
          destination_window?: string
          display_order?: number | null
          file_url?: string | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean | null
          message?: string
          popup_type?: string
          publish_end_date?: string | null
          publish_start_date?: string | null
          redirect_url?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_popups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          author_email: string | null
          author_name: string
          comment_text: string
          content_id: string
          created_at: string
          id: string
          is_active: boolean
          is_approved: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_email?: string | null
          author_name?: string
          comment_text: string
          content_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          comment_text?: string
          content_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_history: {
        Row: {
          allow_comments: boolean
          change_summary: string | null
          changed_by: string
          content_id: string
          created_at: string
          html_content: string
          id: string
          publish_status: string
          short_description: string | null
          show_author_name: boolean
          slug: string | null
          spot_image_url: string | null
          spot_text: string | null
          tags: string[]
          title: string
          version_number: number
        }
        Insert: {
          allow_comments?: boolean
          change_summary?: string | null
          changed_by: string
          content_id: string
          created_at?: string
          html_content?: string
          id?: string
          publish_status?: string
          short_description?: string | null
          show_author_name?: boolean
          slug?: string | null
          spot_image_url?: string | null
          spot_text?: string | null
          tags?: string[]
          title: string
          version_number?: number
        }
        Update: {
          allow_comments?: boolean
          change_summary?: string | null
          changed_by?: string
          content_id?: string
          created_at?: string
          html_content?: string
          id?: string
          publish_status?: string
          short_description?: string | null
          show_author_name?: boolean
          slug?: string | null
          spot_image_url?: string | null
          spot_text?: string | null
          tags?: string[]
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_metadata: {
        Row: {
          content_id: string
          created_at: string
          display_order: number
          field_key: string
          field_value: string
          file_url: string | null
          id: string
          is_active: boolean
          metadata_type: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          display_order?: number
          field_key?: string
          field_value?: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata_type?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          display_order?: number
          field_key?: string
          field_value?: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_metadata_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_recommendations: {
        Row: {
          content_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          recommended_content_id: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          recommended_content_id: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          recommended_content_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_recommendations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_recommendations_recommended_content_id_fkey"
            columns: ["recommended_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          allow_comments: boolean
          author_id: string
          created_at: string
          display_order: number
          html_content: string
          id: string
          is_active: boolean
          publish_end_date: string | null
          publish_start_date: string | null
          publish_status: string
          short_description: string | null
          show_author_name: boolean
          slug: string | null
          spot_image_url: string | null
          spot_text: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          allow_comments?: boolean
          author_id: string
          created_at?: string
          display_order?: number
          html_content?: string
          id?: string
          is_active?: boolean
          publish_end_date?: string | null
          publish_start_date?: string | null
          publish_status?: string
          short_description?: string | null
          show_author_name?: boolean
          slug?: string | null
          spot_image_url?: string | null
          spot_text?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          allow_comments?: boolean
          author_id?: string
          created_at?: string
          display_order?: number
          html_content?: string
          id?: string
          is_active?: boolean
          publish_end_date?: string | null
          publish_start_date?: string | null
          publish_status?: string
          short_description?: string | null
          show_author_name?: boolean
          slug?: string | null
          spot_image_url?: string | null
          spot_text?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cta_icons: {
        Row: {
          alt_text: string
          company_id: string
          created_at: string
          custom_name: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean | null
          is_usable: boolean | null
          unique_id_number: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          company_id: string
          created_at?: string
          custom_name?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean | null
          is_usable?: boolean | null
          unique_id_number: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          company_id?: string
          created_at?: string
          custom_name?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
          is_usable?: boolean | null
          unique_id_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cta_icons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      email_list_emails: {
        Row: {
          created_at: string
          display_order: number
          email_list_id: string
          html_content: string
          id: string
          is_active: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          email_list_id: string
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          email_list_id?: string
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_list_emails_email_list_id_fkey"
            columns: ["email_list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_list_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_list_posts: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          email_list_id: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          email_list_id: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          email_list_id?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_list_posts_email_list_id_fkey"
            columns: ["email_list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_list_unsubscribes: {
        Row: {
          created_at: string
          email: string
          email_list_id: string
          email_list_post_id: string | null
          id: string
          reason: string | null
          unsubscribed_at: string
          unsubscribed_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_list_id: string
          email_list_post_id?: string | null
          id?: string
          reason?: string | null
          unsubscribed_at?: string
          unsubscribed_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_list_id?: string
          email_list_post_id?: string | null
          id?: string
          reason?: string | null
          unsubscribed_at?: string
          unsubscribed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_list_unsubscribes_email_list_id_fkey"
            columns: ["email_list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_list_unsubscribes_email_list_post_id_fkey"
            columns: ["email_list_post_id"]
            isOneToOne: false
            referencedRelation: "email_list_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_list_user_groups: {
        Row: {
          created_at: string
          email_list_id: string
          id: string
          user_group_id: string
        }
        Insert: {
          created_at?: string
          email_list_id: string
          id?: string
          user_group_id: string
        }
        Update: {
          created_at?: string
          email_list_id?: string
          id?: string
          user_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_list_user_groups_email_list_id_fkey"
            columns: ["email_list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_list_user_groups_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lists: {
        Row: {
          created_at: string
          description: string | null
          email_list_group_id: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_list_group_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email_list_group_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_lists_email_list_group_id_fkey"
            columns: ["email_list_group_id"]
            isOneToOne: false
            referencedRelation: "email_list_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          email_id: string
          email_list_id: string
          failed_count: number | null
          id: string
          scheduled_at: string
          sent_count: number | null
          started_at: string | null
          status: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          email_id: string
          email_list_id: string
          failed_count?: number | null
          id?: string
          scheduled_at: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          email_id?: string
          email_list_id?: string
          failed_count?: number | null
          id?: string
          scheduled_at?: string
          sent_count?: number | null
          started_at?: string | null
          status?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_send_jobs_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "email_list_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_jobs_email_list_id_fkey"
            columns: ["email_list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_recipients: {
        Row: {
          bounced_at: string | null
          click_count: number | null
          clicked_at: string | null
          created_at: string
          email: string
          id: string
          open_count: number | null
          opened_at: string | null
          send_job_id: string
          sent_at: string | null
          status: string
          tracking_id: string
        }
        Insert: {
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          email: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          send_job_id: string
          sent_at?: string | null
          status?: string
          tracking_id?: string
        }
        Update: {
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          email?: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          send_job_id?: string
          sent_at?: string | null
          status?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_send_recipients_send_job_id_fkey"
            columns: ["send_job_id"]
            isOneToOne: false
            referencedRelation: "email_send_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_content: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          recipient_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_send_recipients"
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
      file_folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      file_items: {
        Row: {
          created_at: string
          created_by: string
          file_size: number | null
          file_url: string
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      fileserver_items: {
        Row: {
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      fileserver_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          progress: number
          result: Json | null
          status: string
          updated_at: string
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          result?: Json | null
          status?: string
          updated_at?: string
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          result?: Json | null
          status?: string
          updated_at?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          activity_date: string | null
          author_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          activity_date?: string | null
          author_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          activity_date?: string | null
          author_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          file_url: string
          gallery_id: string
          id: string
          is_active: boolean
          item_type: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          file_url: string
          gallery_id: string
          id?: string
          is_active?: boolean
          item_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          file_url?: string
          gallery_id?: string
          id?: string
          is_active?: boolean
          item_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
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
          template_id: string | null
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
          template_id?: string | null
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
          template_id?: string | null
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
          {
            foreignKeyName: "generated_pages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "page_templates"
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
            foreignKeyName: "fk_page_campaigns_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "page_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      page_cta_assignments: {
        Row: {
          company_id: string
          created_at: string
          cta_icon_id: string
          id: string
          page_name: string
          position: number | null
          updated_at: string
          use_on_page: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          cta_icon_id: string
          id?: string
          page_name: string
          position?: number | null
          updated_at?: string
          use_on_page?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          cta_icon_id?: string
          id?: string
          page_name?: string
          position?: number | null
          updated_at?: string
          use_on_page?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "page_cta_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_cta_assignments_cta_icon_id_fkey"
            columns: ["cta_icon_id"]
            isOneToOne: false
            referencedRelation: "cta_icons"
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
      page_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          preview_image_url: string | null
          sections: Json
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          preview_image_url?: string | null
          sections?: Json
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          preview_image_url?: string | null
          sections?: Json
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      partner_listings: {
        Row: {
          affiliates: Json | null
          best_if_used_for: string | null
          bg_alt_text: string | null
          bg_custom_name: string | null
          bg_image_url: string | null
          business_name: string
          business_phone: string | null
          company_id: string
          contact_email: string | null
          created_at: string
          display_order: number
          first_bullets: Json | null
          first_paragraph: string | null
          id: string
          is_active: boolean | null
          logo_alt_text: string | null
          logo_custom_name: string | null
          logo_url: string | null
          second_bullets: Json | null
          second_paragraph: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliates?: Json | null
          best_if_used_for?: string | null
          bg_alt_text?: string | null
          bg_custom_name?: string | null
          bg_image_url?: string | null
          business_name: string
          business_phone?: string | null
          company_id: string
          contact_email?: string | null
          created_at?: string
          display_order?: number
          first_bullets?: Json | null
          first_paragraph?: string | null
          id?: string
          is_active?: boolean | null
          logo_alt_text?: string | null
          logo_custom_name?: string | null
          logo_url?: string | null
          second_bullets?: Json | null
          second_paragraph?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliates?: Json | null
          best_if_used_for?: string | null
          bg_alt_text?: string | null
          bg_custom_name?: string | null
          bg_image_url?: string | null
          business_name?: string
          business_phone?: string | null
          company_id?: string
          contact_email?: string | null
          created_at?: string
          display_order?: number
          first_bullets?: Json | null
          first_paragraph?: string | null
          id?: string
          is_active?: boolean | null
          logo_alt_text?: string | null
          logo_custom_name?: string | null
          logo_url?: string | null
          second_bullets?: Json | null
          second_paragraph?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          level: number
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_documents: {
        Row: {
          created_at: string
          display_order: number
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          mime_type: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          document_name: string
          document_type?: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          previous_price: number | null
          price: number
          product_supplier_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          previous_price?: number | null
          price: number
          product_supplier_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          previous_price?: number | null
          price?: number
          product_supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_supplier_id_fkey"
            columns: ["product_supplier_id"]
            isOneToOne: false
            referencedRelation: "product_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          product_id: string
          recommended_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          product_id: string
          recommended_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          product_id?: string
          recommended_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_suppliers: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          notes: string | null
          our_price: number | null
          product_id: string
          supplier_location: string | null
          supplier_name: string
          updated_at: string
          vendor_id_code: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          our_price?: number | null
          product_id: string
          supplier_location?: string | null
          supplier_name?: string
          updated_at?: string
          vendor_id_code?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          our_price?: number | null
          product_id?: string
          supplier_location?: string | null
          supplier_name?: string
          updated_at?: string
          vendor_id_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          price: number | null
          product_id: string
          sku: string
          stock_status: string
          updated_at: string
          variant_name: string
          weight: number | null
        }
        Insert: {
          attributes?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price?: number | null
          product_id: string
          sku: string
          stock_status?: string
          updated_at?: string
          variant_name: string
          weight?: number | null
        }
        Update: {
          attributes?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price?: number | null
          product_id?: string
          sku?: string
          stock_status?: string
          updated_at?: string
          variant_name?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          afue: string | null
          alternative_product_statement: string | null
          alternative_product_url: string | null
          brand_id: string | null
          brand_name: string | null
          bullet_points: string[] | null
          category: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          discontinued_banner_text: string | null
          discontinued_description: string | null
          display_order: number | null
          height: string | null
          id: string
          installed_banner_text: string | null
          installed_description: string | null
          is_part: boolean | null
          is_promo_active: boolean
          is_repair_eligible: boolean
          labor_warranty: string | null
          length_depth: string | null
          model_number: string | null
          part_category: string | null
          part_location_type: string | null
          part_subcategory: string | null
          parts_warranty: string | null
          poise: string | null
          product_name: string
          promo_description: string | null
          promo_end_date: string | null
          promo_image_url: string | null
          promo_start_date: string | null
          promo_title: string | null
          refrigerant_type: string | null
          repair_tags: string[]
          seer_rating: string | null
          spot_images: Json | null
          spot_text: string | null
          stages: string | null
          status: Database["public"]["Enums"]["product_status"]
          stick_count: number | null
          tons_btu: string | null
          updated_at: string
          voltage: string | null
          weight: number | null
          width_size: string | null
        }
        Insert: {
          afue?: string | null
          alternative_product_statement?: string | null
          alternative_product_url?: string | null
          brand_id?: string | null
          brand_name?: string | null
          bullet_points?: string[] | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          discontinued_banner_text?: string | null
          discontinued_description?: string | null
          display_order?: number | null
          height?: string | null
          id?: string
          installed_banner_text?: string | null
          installed_description?: string | null
          is_part?: boolean | null
          is_promo_active?: boolean
          is_repair_eligible?: boolean
          labor_warranty?: string | null
          length_depth?: string | null
          model_number?: string | null
          part_category?: string | null
          part_location_type?: string | null
          part_subcategory?: string | null
          parts_warranty?: string | null
          poise?: string | null
          product_name: string
          promo_description?: string | null
          promo_end_date?: string | null
          promo_image_url?: string | null
          promo_start_date?: string | null
          promo_title?: string | null
          refrigerant_type?: string | null
          repair_tags?: string[]
          seer_rating?: string | null
          spot_images?: Json | null
          spot_text?: string | null
          stages?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stick_count?: number | null
          tons_btu?: string | null
          updated_at?: string
          voltage?: string | null
          weight?: number | null
          width_size?: string | null
        }
        Update: {
          afue?: string | null
          alternative_product_statement?: string | null
          alternative_product_url?: string | null
          brand_id?: string | null
          brand_name?: string | null
          bullet_points?: string[] | null
          category?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          discontinued_banner_text?: string | null
          discontinued_description?: string | null
          display_order?: number | null
          height?: string | null
          id?: string
          installed_banner_text?: string | null
          installed_description?: string | null
          is_part?: boolean | null
          is_promo_active?: boolean
          is_repair_eligible?: boolean
          labor_warranty?: string | null
          length_depth?: string | null
          model_number?: string | null
          part_category?: string | null
          part_location_type?: string | null
          part_subcategory?: string | null
          parts_warranty?: string | null
          poise?: string | null
          product_name?: string
          promo_description?: string | null
          promo_end_date?: string | null
          promo_image_url?: string | null
          promo_start_date?: string | null
          promo_title?: string | null
          refrigerant_type?: string | null
          repair_tags?: string[]
          seer_rating?: string | null
          spot_images?: Json | null
          spot_text?: string | null
          stages?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stick_count?: number | null
          tons_btu?: string | null
          updated_at?: string
          voltage?: string | null
          weight?: number | null
          width_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_module_assignments: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          module_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          module_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "admin_modules"
            referencedColumns: ["id"]
          },
        ]
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
      user_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
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
      app_role: "admin" | "user" | "moderator"
      appointment_status: "open" | "closed" | "cancelled"
      appointment_type:
        | "residential"
        | "commercial"
        | "non_profit"
        | "church"
        | "school"
        | "government"
        | "other"
      product_status:
        | "active_showing"
        | "active_not_showing"
        | "discontinued_showing"
        | "deactivated"
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
      app_role: ["admin", "user", "moderator"],
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
      product_status: [
        "active_showing",
        "active_not_showing",
        "discontinued_showing",
        "deactivated",
      ],
    },
  },
} as const
