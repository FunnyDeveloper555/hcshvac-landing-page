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
      applicant_accounts: {
        Row: {
          activated_at: string | null
          application_id: string | null
          company_id: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          invited_at: string | null
          last_name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["applicant_account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          application_id?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["applicant_account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          application_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["applicant_account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_accounts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "hire_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_consents: {
        Row: {
          agreed: boolean
          applicant_account_id: string
          consent_type: Database["public"]["Enums"]["applicant_consent_type"]
          created_at: string
          document_version: string | null
          id: string
          ip_address: string | null
          notes: string | null
          signature_name: string | null
          signed_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreed?: boolean
          applicant_account_id: string
          consent_type: Database["public"]["Enums"]["applicant_consent_type"]
          created_at?: string
          document_version?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_name?: string | null
          signed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreed?: boolean
          applicant_account_id?: string
          consent_type?: Database["public"]["Enums"]["applicant_consent_type"]
          created_at?: string
          document_version?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_name?: string | null
          signed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_consents_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_documents: {
        Row: {
          admin_notes: string | null
          applicant_account_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["applicant_document_type"]
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["applicant_document_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_account_id: string
          created_at?: string
          document_type: Database["public"]["Enums"]["applicant_document_type"]
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["applicant_document_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          applicant_account_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["applicant_document_type"]
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["applicant_document_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_documents_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_handbook_acks: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          applicant_account_id: string
          created_at: string
          handbook_version: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          applicant_account_id: string
          created_at?: string
          handbook_version?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          applicant_account_id?: string
          created_at?: string
          handbook_version?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_handbook_acks_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_interview_forms: {
        Row: {
          applicant_account_id: string
          created_at: string
          id: string
          interview_id: string
          notes: string | null
          rating: number | null
          recommendation: string | null
          responses: Json
          staff_name: string | null
          staff_user_id: string
          strengths: string | null
          submitted_at: string | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          applicant_account_id: string
          created_at?: string
          id?: string
          interview_id: string
          notes?: string | null
          rating?: number | null
          recommendation?: string | null
          responses?: Json
          staff_name?: string | null
          staff_user_id: string
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          applicant_account_id?: string
          created_at?: string
          id?: string
          interview_id?: string
          notes?: string | null
          rating?: number | null
          recommendation?: string | null
          responses?: Json
          staff_name?: string | null
          staff_user_id?: string
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_interview_forms_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_interview_forms_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "applicant_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_interviews: {
        Row: {
          applicant_account_id: string
          applicant_notes: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          internal_notes: string | null
          interviewer_email: string | null
          interviewer_name: string | null
          location: string | null
          meeting_url: string | null
          position_title: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["applicant_interview_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applicant_account_id: string
          applicant_notes?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          internal_notes?: string | null
          interviewer_email?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_url?: string | null
          position_title?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["applicant_interview_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applicant_account_id?: string
          applicant_notes?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          internal_notes?: string | null
          interviewer_email?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_url?: string | null
          position_title?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["applicant_interview_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_interviews_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_psych_exams: {
        Row: {
          admin_notes: string | null
          applicant_account_id: string
          created_at: string
          exam_version: string | null
          id: string
          responses: Json
          result: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_account_id: string
          created_at?: string
          exam_version?: string | null
          id?: string
          responses?: Json
          result?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          applicant_account_id?: string
          created_at?: string
          exam_version?: string | null
          id?: string
          responses?: Json
          result?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_psych_exams_applicant_account_id_fkey"
            columns: ["applicant_account_id"]
            isOneToOne: false
            referencedRelation: "applicant_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_waived: boolean
          item_type: string
          line_total: number
          product_id: string | null
          qty: number
          unit_price: number
          updated_at: string
          waiver_reason: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_waived?: boolean
          item_type?: string
          line_total?: number
          product_id?: string | null
          qty?: number
          unit_price?: number
          updated_at?: string
          waiver_reason?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_waived?: boolean
          item_type?: string
          line_total?: number
          product_id?: string | null
          qty?: number
          unit_price?: number
          updated_at?: string
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "appointment_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_carts: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          paid_at: string | null
          payment_status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_carts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_sms_log: {
        Row: {
          appointment_id: string | null
          created_at: string
          error: string | null
          id: string
          kind: string
          message: string | null
          phone: string
          provider_sid: string | null
          recipient_type: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          message?: string | null
          phone: string
          provider_sid?: string | null
          recipient_type: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          message?: string | null
          phone?: string
          provider_sid?: string | null
          recipient_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_sms_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_number: string | null
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          assigned_employee_id: string | null
          assigned_team: Json
          booking_sms_sent_at: string | null
          calendar_id: string | null
          cancellation_reason: string | null
          closed_at: string | null
          closure_photos: Json
          company_id: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          duration_minutes: number
          equipment_location: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          notes: string | null
          occupied: string | null
          reminder_sms_sent_at: string | null
          scheduled_date: string
          scheduled_time: string
          sms_reminders_enabled: boolean
          staff_escalation_sent_at: string | null
          staff_review_required: boolean
          status: Database["public"]["Enums"]["appointment_status"]
          technician_phone: string | null
          updated_at: string
          visit_summary_notes: string | null
          visit_type: string | null
        }
        Insert: {
          appointment_number?: string | null
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          assigned_employee_id?: string | null
          assigned_team?: Json
          booking_sms_sent_at?: string | null
          calendar_id?: string | null
          cancellation_reason?: string | null
          closed_at?: string | null
          closure_photos?: Json
          company_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          duration_minutes?: number
          equipment_location?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          occupied?: string | null
          reminder_sms_sent_at?: string | null
          scheduled_date: string
          scheduled_time: string
          sms_reminders_enabled?: boolean
          staff_escalation_sent_at?: string | null
          staff_review_required?: boolean
          status?: Database["public"]["Enums"]["appointment_status"]
          technician_phone?: string | null
          updated_at?: string
          visit_summary_notes?: string | null
          visit_type?: string | null
        }
        Update: {
          appointment_number?: string | null
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          assigned_employee_id?: string | null
          assigned_team?: Json
          booking_sms_sent_at?: string | null
          calendar_id?: string | null
          cancellation_reason?: string | null
          closed_at?: string | null
          closure_photos?: Json
          company_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          duration_minutes?: number
          equipment_location?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          occupied?: string | null
          reminder_sms_sent_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          sms_reminders_enabled?: boolean
          staff_escalation_sent_at?: string | null
          staff_review_required?: boolean
          status?: Database["public"]["Enums"]["appointment_status"]
          technician_phone?: string | null
          updated_at?: string
          visit_summary_notes?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_numbers: {
        Row: {
          blocked_by: string | null
          created_at: string
          id: string
          original_phone: string | null
          phone_last10: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          original_phone?: string | null
          phone_last10: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          original_phone?: string | null
          phone_last10?: string
          reason?: string | null
        }
        Relationships: []
      }
      booking_invitations: {
        Row: {
          assigned_employee_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_type: string
          expires_at: string | null
          id: string
          invitation_type: string
          link_type: string | null
          notes: string | null
          opened_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          seen_at: string | null
          sent_at: string | null
          staff_notified_at: string | null
          status: string
          token: string
        }
        Insert: {
          assigned_employee_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_type: string
          expires_at?: string | null
          id?: string
          invitation_type: string
          link_type?: string | null
          notes?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          seen_at?: string | null
          sent_at?: string | null
          staff_notified_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          assigned_employee_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          expires_at?: string | null
          id?: string
          invitation_type?: string
          link_type?: string | null
          notes?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          seen_at?: string | null
          sent_at?: string | null
          staff_notified_at?: string | null
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
      calendars: {
        Row: {
          calendar_name: string
          calendar_type: string
          color: string
          company_id: string | null
          created_at: string
          description: string | null
          email: string | null
          employee_id: string | null
          google_calendar_id: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          calendar_name: string
          calendar_type?: string
          color?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_id?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          calendar_name?: string
          calendar_type?: string
          color?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_id?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendars_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs_3cx: {
        Row: {
          agent_extension: string | null
          agent_name: string | null
          caller_name: string | null
          cost: number | null
          created_at: string
          customer_id: string | null
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          external_call_id: string | null
          from_number: string | null
          id: string
          matched_phone: string | null
          notes: string | null
          queue_name: string | null
          raw_payload: Json
          recording_url: string | null
          ring_seconds: number | null
          started_at: string | null
          status: string | null
          talk_seconds: number | null
          to_number: string | null
          updated_at: string
        }
        Insert: {
          agent_extension?: string | null
          agent_name?: string | null
          caller_name?: string | null
          cost?: number | null
          created_at?: string
          customer_id?: string | null
          direction: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_call_id?: string | null
          from_number?: string | null
          id?: string
          matched_phone?: string | null
          notes?: string | null
          queue_name?: string | null
          raw_payload?: Json
          recording_url?: string | null
          ring_seconds?: number | null
          started_at?: string | null
          status?: string | null
          talk_seconds?: number | null
          to_number?: string | null
          updated_at?: string
        }
        Update: {
          agent_extension?: string | null
          agent_name?: string | null
          caller_name?: string | null
          cost?: number | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_call_id?: string | null
          from_number?: string | null
          id?: string
          matched_phone?: string | null
          notes?: string | null
          queue_name?: string | null
          raw_payload?: Json
          recording_url?: string | null
          ring_seconds?: number | null
          started_at?: string | null
          status?: string | null
          talk_seconds?: number | null
          to_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_3cx_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          external_name: string | null
          external_phone: string | null
          external_type: string | null
          id: string
          kind: string
          last_message_at: string
          name: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          external_name?: string | null
          external_phone?: string | null
          external_type?: string | null
          id?: string
          kind: string
          last_message_at?: string
          name?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          external_name?: string | null
          external_phone?: string | null
          external_type?: string | null
          id?: string
          kind?: string
          last_message_at?: string
          name?: string | null
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_alerted_at: string | null
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_alerted_at?: string | null
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_alerted_at?: string | null
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json
          body: string | null
          conversation_id: string
          created_at: string
          direction: string
          escalation_sent_at: string | null
          id: string
          phone: string | null
          sender_id: string | null
          sender_name: string | null
        }
        Insert: {
          attachments?: Json
          body?: string | null
          conversation_id: string
          created_at?: string
          direction?: string
          escalation_sent_at?: string | null
          id?: string
          phone?: string | null
          sender_id?: string | null
          sender_name?: string | null
        }
        Update: {
          attachments?: Json
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          escalation_sent_at?: string | null
          id?: string
          phone?: string | null
          sender_id?: string | null
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
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
          about_us: Json
          affiliations: Json | null
          air_quality: Json
          banner_image_ids: string[]
          boilers_install: Json
          boilers_repair: Json
          boilers_service: Json
          brands_installed: Json | null
          brands_serviced: Json | null
          coils_install: Json
          coils_repair: Json
          coils_service: Json
          company_address: string | null
          company_city: string | null
          company_email_primary: string | null
          company_initials: string | null
          company_phone: string | null
          company_state: string | null
          company_support_email: string | null
          company_zip_code: string | null
          core_services: Json
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
          faq: Json
          financing: Json
          financing_enabled: boolean | null
          financing_provider: string | null
          financing_url: string | null
          flagship: Json
          footer: Json
          gas_pipe_install: Json
          gas_pipe_repair: Json
          gas_pipe_service: Json
          header_pages: Json | null
          hero: Json
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
          our_services: Json
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
          service_directory: Json
          service_guides: Json
          services_page: Json | null
          services_provided: Json | null
          site_template: string | null
          slug: string | null
          theme_style: string | null
          top_bar: Json
          trust_bar: Json
          water_heaters_install: Json
          water_heaters_repair: Json
          water_heaters_service: Json
          website_description: string | null
          website_tagline: string | null
          website_title: string | null
        }
        Insert: {
          about_us?: Json
          affiliations?: Json | null
          air_quality?: Json
          banner_image_ids?: string[]
          boilers_install?: Json
          boilers_repair?: Json
          boilers_service?: Json
          brands_installed?: Json | null
          brands_serviced?: Json | null
          coils_install?: Json
          coils_repair?: Json
          coils_service?: Json
          company_address?: string | null
          company_city?: string | null
          company_email_primary?: string | null
          company_initials?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_support_email?: string | null
          company_zip_code?: string | null
          core_services?: Json
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
          faq?: Json
          financing?: Json
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          flagship?: Json
          footer?: Json
          gas_pipe_install?: Json
          gas_pipe_repair?: Json
          gas_pipe_service?: Json
          header_pages?: Json | null
          hero?: Json
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
          our_services?: Json
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
          service_directory?: Json
          service_guides?: Json
          services_page?: Json | null
          services_provided?: Json | null
          site_template?: string | null
          slug?: string | null
          theme_style?: string | null
          top_bar?: Json
          trust_bar?: Json
          water_heaters_install?: Json
          water_heaters_repair?: Json
          water_heaters_service?: Json
          website_description?: string | null
          website_tagline?: string | null
          website_title?: string | null
        }
        Update: {
          about_us?: Json
          affiliations?: Json | null
          air_quality?: Json
          banner_image_ids?: string[]
          boilers_install?: Json
          boilers_repair?: Json
          boilers_service?: Json
          brands_installed?: Json | null
          brands_serviced?: Json | null
          coils_install?: Json
          coils_repair?: Json
          coils_service?: Json
          company_address?: string | null
          company_city?: string | null
          company_email_primary?: string | null
          company_initials?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_support_email?: string | null
          company_zip_code?: string | null
          core_services?: Json
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
          faq?: Json
          financing?: Json
          financing_enabled?: boolean | null
          financing_provider?: string | null
          financing_url?: string | null
          flagship?: Json
          footer?: Json
          gas_pipe_install?: Json
          gas_pipe_repair?: Json
          gas_pipe_service?: Json
          header_pages?: Json | null
          hero?: Json
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
          our_services?: Json
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
          service_directory?: Json
          service_guides?: Json
          services_page?: Json | null
          services_provided?: Json | null
          site_template?: string | null
          slug?: string | null
          theme_style?: string | null
          top_bar?: Json
          trust_bar?: Json
          water_heaters_install?: Json
          water_heaters_repair?: Json
          water_heaters_service?: Json
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
          staff_escalation_sent_at: string | null
          staff_review_required: boolean
          status: string
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
          staff_escalation_sent_at?: string | null
          staff_review_required?: boolean
          status?: string
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
          staff_escalation_sent_at?: string | null
          staff_review_required?: boolean
          status?: string
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
      diagnostic_fees: {
        Row: {
          company_id: string | null
          created_at: string
          fee_amount: number
          id: string
          is_active: boolean
          is_waivable: boolean
          notes: string | null
          updated_at: string
          visit_type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          fee_amount?: number
          id?: string
          is_active?: boolean
          is_waivable?: boolean
          notes?: string | null
          updated_at?: string
          visit_type: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          fee_amount?: number
          id?: string
          is_active?: boolean
          is_waivable?: boolean
          notes?: string | null
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_fees_company_id_fkey"
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
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
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
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
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_education: {
        Row: {
          certificates_held: string | null
          created_at: string
          employee_id: string
          id: string
          licenses_held: string | null
          school_name: string | null
          school_type: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          certificates_held?: string | null
          created_at?: string
          employee_id: string
          id?: string
          licenses_held?: string | null
          school_name?: string | null
          school_type?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          certificates_held?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          licenses_held?: string | null
          school_name?: string | null
          school_type?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_previous_employers: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          prev_business_name: string | null
          prev_corporate_address: string | null
          prev_corporate_city: string | null
          prev_corporate_contact_person: string | null
          prev_corporate_name: string | null
          prev_corporate_phone_extension: string | null
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
          prev_website_url: string | null
          prev_work_address: string | null
          prev_work_city: string | null
          prev_work_contact_person: string | null
          prev_work_phone_extension: string | null
          prev_work_phone_number: string | null
          prev_work_state: string | null
          prev_work_zip_code: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          prev_business_name?: string | null
          prev_corporate_address?: string | null
          prev_corporate_city?: string | null
          prev_corporate_contact_person?: string | null
          prev_corporate_name?: string | null
          prev_corporate_phone_extension?: string | null
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
          prev_website_url?: string | null
          prev_work_address?: string | null
          prev_work_city?: string | null
          prev_work_contact_person?: string | null
          prev_work_phone_extension?: string | null
          prev_work_phone_number?: string | null
          prev_work_state?: string | null
          prev_work_zip_code?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          prev_business_name?: string | null
          prev_corporate_address?: string | null
          prev_corporate_city?: string | null
          prev_corporate_contact_person?: string | null
          prev_corporate_name?: string | null
          prev_corporate_phone_extension?: string | null
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
          prev_website_url?: string | null
          prev_work_address?: string | null
          prev_work_city?: string | null
          prev_work_contact_person?: string | null
          prev_work_phone_extension?: string | null
          prev_work_phone_number?: string | null
          prev_work_state?: string | null
          prev_work_zip_code?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_previous_employers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_references: {
        Row: {
          company_name: string | null
          created_at: string
          email_address: string | null
          employee_id: string
          first_name: string | null
          id: string
          known_for: string | null
          last_name: string | null
          phone_number: string | null
          position_held: string | null
          sort_order: number
          updated_at: string
          validates_strengths: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email_address?: string | null
          employee_id: string
          first_name?: string | null
          id?: string
          known_for?: string | null
          last_name?: string | null
          phone_number?: string | null
          position_held?: string | null
          sort_order?: number
          updated_at?: string
          validates_strengths?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email_address?: string | null
          employee_id?: string
          first_name?: string | null
          id?: string
          known_for?: string | null
          last_name?: string | null
          phone_number?: string | null
          position_held?: string | null
          sort_order?: number
          updated_at?: string
          validates_strengths?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_references_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active_company_ids: string[]
          address: string
          assigned_tools: string | null
          bio_notes: string | null
          birth_gender: string | null
          certificates_held: string | null
          city: string
          city_of_birth: string | null
          comfort_assessment: Json | null
          company_id: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          drivers_license_number: string | null
          email_address: string
          emergency_contacts: Json
          employee_code: string | null
          employee_id_number: string | null
          employment_status: string | null
          first_name: string
          four_year_college: string | null
          high_school: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          languages: Json | null
          last_name: string
          licenses_held: string | null
          middle_name: string | null
          phone_number: string
          photo_path: string | null
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
          resume_certificates_achievements: string | null
          resume_certificates_file_url: string | null
          resume_skills: string | null
          resume_summary: string | null
          sms_email_pager: string | null
          sms_text_pager: string | null
          social_security_number: string | null
          state: string
          state_of_birth: string | null
          status_end_date: string | null
          status_final_day: string | null
          status_revisit_date: string | null
          status_start_date: string | null
          status_tbd: boolean
          trade_school: string | null
          truck_number: string | null
          two_year_college: string | null
          updated_at: string
          us_citizen: boolean | null
          zip_code: string
        }
        Insert: {
          active_company_ids?: string[]
          address: string
          assigned_tools?: string | null
          bio_notes?: string | null
          birth_gender?: string | null
          certificates_held?: string | null
          city: string
          city_of_birth?: string | null
          comfort_assessment?: Json | null
          company_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          drivers_license_number?: string | null
          email_address: string
          emergency_contacts?: Json
          employee_code?: string | null
          employee_id_number?: string | null
          employment_status?: string | null
          first_name: string
          four_year_college?: string | null
          high_school?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name: string
          licenses_held?: string | null
          middle_name?: string | null
          phone_number: string
          photo_path?: string | null
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
          resume_certificates_achievements?: string | null
          resume_certificates_file_url?: string | null
          resume_skills?: string | null
          resume_summary?: string | null
          sms_email_pager?: string | null
          sms_text_pager?: string | null
          social_security_number?: string | null
          state: string
          state_of_birth?: string | null
          status_end_date?: string | null
          status_final_day?: string | null
          status_revisit_date?: string | null
          status_start_date?: string | null
          status_tbd?: boolean
          trade_school?: string | null
          truck_number?: string | null
          two_year_college?: string | null
          updated_at?: string
          us_citizen?: boolean | null
          zip_code: string
        }
        Update: {
          active_company_ids?: string[]
          address?: string
          assigned_tools?: string | null
          bio_notes?: string | null
          birth_gender?: string | null
          certificates_held?: string | null
          city?: string
          city_of_birth?: string | null
          comfort_assessment?: Json | null
          company_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          drivers_license_number?: string | null
          email_address?: string
          emergency_contacts?: Json
          employee_code?: string | null
          employee_id_number?: string | null
          employment_status?: string | null
          first_name?: string
          four_year_college?: string | null
          high_school?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string
          licenses_held?: string | null
          middle_name?: string | null
          phone_number?: string
          photo_path?: string | null
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
          resume_certificates_achievements?: string | null
          resume_certificates_file_url?: string | null
          resume_skills?: string | null
          resume_summary?: string | null
          sms_email_pager?: string | null
          sms_text_pager?: string | null
          social_security_number?: string | null
          state?: string
          state_of_birth?: string | null
          status_end_date?: string | null
          status_final_day?: string | null
          status_revisit_date?: string | null
          status_start_date?: string | null
          status_tbd?: boolean
          trade_school?: string | null
          truck_number?: string | null
          two_year_college?: string | null
          updated_at?: string
          us_citizen?: boolean | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      hire_applications: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          invitation_id: string | null
          last_name: string
          notes: string | null
          phone: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          invitation_id?: string | null
          last_name: string
          notes?: string | null
          phone: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          invitation_id?: string | null
          last_name?: string
          notes?: string | null
          phone?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_applications_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "hire_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_invitations: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          department: string | null
          expires_at: string | null
          id: string
          notes: string | null
          opened_at: string | null
          qualifications: string[]
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          send_method: string
          sent_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          qualifications?: string[]
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          send_method?: string
          sent_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          qualifications?: string[]
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          send_method?: string
          sent_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      installation_jobs: {
        Row: {
          appointment_id: string | null
          completed_by_employee_id: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          install_date: string | null
          notes: string | null
          pickup_date: string | null
          status: string
          supply_vendor_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          completed_by_employee_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          install_date?: string | null
          notes?: string | null
          pickup_date?: string | null
          status?: string
          supply_vendor_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          completed_by_employee_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          install_date?: string | null
          notes?: string | null
          pickup_date?: string | null
          status?: string
          supply_vendor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_jobs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_jobs_completed_by_employee_id_fkey"
            columns: ["completed_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_jobs_supply_vendor_id_fkey"
            columns: ["supply_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_pickup_photos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string | null
          job_id: string
          note: string | null
          phase: string
          slot: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string | null
          job_id: string
          note?: string | null
          phase?: string
          slot: string
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string | null
          job_id?: string
          note?: string | null
          phase?: string
          slot?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_pickup_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "installation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_pickup_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "installation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_records: {
        Row: {
          appointment_id: string | null
          brand_name: string | null
          category: string
          company_id: string | null
          completed_by_employee_id: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          equipment_warranty_years: number | null
          id: string
          install_date: string | null
          item_type: string
          job_id: string | null
          labor_warranty_years: number | null
          last_maintenance_date: string | null
          maintenance_interval_months: number
          model_number: string | null
          notes: string | null
          pickup_date: string | null
          serial_number: string | null
          spec: Json
          supply_vendor_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          brand_name?: string | null
          category: string
          company_id?: string | null
          completed_by_employee_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          equipment_warranty_years?: number | null
          id?: string
          install_date?: string | null
          item_type: string
          job_id?: string | null
          labor_warranty_years?: number | null
          last_maintenance_date?: string | null
          maintenance_interval_months?: number
          model_number?: string | null
          notes?: string | null
          pickup_date?: string | null
          serial_number?: string | null
          spec?: Json
          supply_vendor_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          brand_name?: string | null
          category?: string
          company_id?: string | null
          completed_by_employee_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          equipment_warranty_years?: number | null
          id?: string
          install_date?: string | null
          item_type?: string
          job_id?: string | null
          labor_warranty_years?: number | null
          last_maintenance_date?: string | null
          maintenance_interval_months?: number
          model_number?: string | null
          notes?: string | null
          pickup_date?: string | null
          serial_number?: string | null
          spec?: Json
          supply_vendor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_records_completed_by_employee_id_fkey"
            columns: ["completed_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "installation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_records_supply_vendor_id_fkey"
            columns: ["supply_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          appointment_id: string | null
          assign_type: string
          brand_name: string | null
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          item_type: string | null
          model_number: string | null
          notes: string | null
          po_number: string | null
          product_id: string | null
          quantity: number
          received_date: string | null
          seer_rating: string | null
          serial_number: string | null
          status: string
          supply_vendor_id: string | null
          tons_btu: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assign_type?: string
          brand_name?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          item_type?: string | null
          model_number?: string | null
          notes?: string | null
          po_number?: string | null
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          seer_rating?: string | null
          serial_number?: string | null
          status?: string
          supply_vendor_id?: string | null
          tons_btu?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assign_type?: string
          brand_name?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          item_type?: string | null
          model_number?: string | null
          notes?: string | null
          po_number?: string | null
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          seer_rating?: string | null
          serial_number?: string | null
          status?: string
          supply_vendor_id?: string | null
          tons_btu?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mass_page_content: {
        Row: {
          blocks: Json
          company_id: string
          created_at: string
          id: string
          overrides: Json
          page_path: string
          status: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          company_id: string
          created_at?: string
          id?: string
          overrides?: Json
          page_path: string
          status?: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          company_id?: string
          created_at?: string
          id?: string
          overrides?: Json
          page_path?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mass_page_content_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mass_page_history: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_email: string | null
          changed_fields: string[]
          company_id: string
          content_id: string | null
          created_at: string
          id: string
          page_path: string
          previous_status: string | null
          snapshot: Json | null
          status: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_email?: string | null
          changed_fields?: string[]
          company_id: string
          content_id?: string | null
          created_at?: string
          id?: string
          page_path: string
          previous_status?: string | null
          snapshot?: Json | null
          status?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          changed_fields?: string[]
          company_id?: string
          content_id?: string | null
          created_at?: string
          id?: string
          page_path?: string
          previous_status?: string | null
          snapshot?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      notification_targets: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          label: string
          notify_appointments: boolean
          notify_chat: boolean
          notify_events: boolean
          notify_submissions: boolean
          phone: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          label?: string
          notify_appointments?: boolean
          notify_chat?: boolean
          notify_events?: boolean
          notify_submissions?: boolean
          phone?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          label?: string
          notify_appointments?: boolean
          notify_chat?: boolean
          notify_events?: boolean
          notify_submissions?: boolean
          phone?: string | null
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
      product_activity_history: {
        Row: {
          created_at: string
          downloads: number
          enquiries: number
          id: string
          other_page_views: number
          page_visits: number
          product_id: string
          purchased_installed: number
          recalls_active: string | null
          sent_as_estimate: number
          updated_at: string
          warranty_repaired: number
          warranty_visits: number
        }
        Insert: {
          created_at?: string
          downloads?: number
          enquiries?: number
          id?: string
          other_page_views?: number
          page_visits?: number
          product_id: string
          purchased_installed?: number
          recalls_active?: string | null
          sent_as_estimate?: number
          updated_at?: string
          warranty_repaired?: number
          warranty_visits?: number
        }
        Update: {
          created_at?: string
          downloads?: number
          enquiries?: number
          id?: string
          other_page_views?: number
          page_visits?: number
          product_id?: string
          purchased_installed?: number
          recalls_active?: string | null
          sent_as_estimate?: number
          updated_at?: string
          warranty_repaired?: number
          warranty_visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_activity_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
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
      product_purchase_orders: {
        Row: {
          created_at: string
          customer_id_info: string | null
          id: string
          manufacture_part_number: string | null
          notes: string | null
          po_number: string | null
          product_id: string
          purchase_date: string | null
          purchase_type: string | null
          receipt_scan_url: string | null
          tech_id: string | null
          updated_at: string
          vendor_id_number: string | null
        }
        Insert: {
          created_at?: string
          customer_id_info?: string | null
          id?: string
          manufacture_part_number?: string | null
          notes?: string | null
          po_number?: string | null
          product_id: string
          purchase_date?: string | null
          purchase_type?: string | null
          receipt_scan_url?: string | null
          tech_id?: string | null
          updated_at?: string
          vendor_id_number?: string | null
        }
        Update: {
          created_at?: string
          customer_id_info?: string | null
          id?: string
          manufacture_part_number?: string | null
          notes?: string | null
          po_number?: string | null
          product_id?: string
          purchase_date?: string | null
          purchase_type?: string | null
          receipt_scan_url?: string | null
          tech_id?: string | null
          updated_at?: string
          vendor_id_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_purchase_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          city: string | null
          created_at: string
          display_order: number
          freight_cost: number | null
          has_freight: boolean
          has_shipping: boolean
          id: string
          is_active: boolean
          manufacture_product_url: string | null
          notes: string | null
          our_price: number | null
          price_commercial_city: number | null
          price_commercial_suburbs: number | null
          price_custom_formula: string | null
          price_residential_city: number | null
          price_residential_suburbs: number | null
          product_id: string
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          shipping_cost: number | null
          state: string | null
          supplier_location: string | null
          supplier_name: string
          supplier_product_url: string | null
          tax_rate: number | null
          updated_at: string
          vendor_cost: number | null
          vendor_id_code: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          display_order?: number
          freight_cost?: number | null
          has_freight?: boolean
          has_shipping?: boolean
          id?: string
          is_active?: boolean
          manufacture_product_url?: string | null
          notes?: string | null
          our_price?: number | null
          price_commercial_city?: number | null
          price_commercial_suburbs?: number | null
          price_custom_formula?: string | null
          price_residential_city?: number | null
          price_residential_suburbs?: number | null
          product_id: string
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          shipping_cost?: number | null
          state?: string | null
          supplier_location?: string | null
          supplier_name?: string
          supplier_product_url?: string | null
          tax_rate?: number | null
          updated_at?: string
          vendor_cost?: number | null
          vendor_id_code?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          display_order?: number
          freight_cost?: number | null
          has_freight?: boolean
          has_shipping?: boolean
          id?: string
          is_active?: boolean
          manufacture_product_url?: string | null
          notes?: string | null
          our_price?: number | null
          price_commercial_city?: number | null
          price_commercial_suburbs?: number | null
          price_custom_formula?: string | null
          price_residential_city?: number | null
          price_residential_suburbs?: number | null
          product_id?: string
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          shipping_cost?: number | null
          state?: string | null
          supplier_location?: string | null
          supplier_name?: string
          supplier_product_url?: string | null
          tax_rate?: number | null
          updated_at?: string
          vendor_cost?: number | null
          vendor_id_code?: string
          website_url?: string | null
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
          invoice_foot_notes: string
          invoice_html_template: string | null
          invoice_line_description: string
          invoice_notes: string
          invoice_payment_plan: string
          invoice_ship_via: string
          invoice_terms: string
          invoice_unit_price_text: string
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
          spec_type: string | null
          specifications: Json
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
          invoice_foot_notes?: string
          invoice_html_template?: string | null
          invoice_line_description?: string
          invoice_notes?: string
          invoice_payment_plan?: string
          invoice_ship_via?: string
          invoice_terms?: string
          invoice_unit_price_text?: string
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
          spec_type?: string | null
          specifications?: Json
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
          invoice_foot_notes?: string
          invoice_html_template?: string | null
          invoice_line_description?: string
          invoice_notes?: string
          invoice_payment_plan?: string
          invoice_ship_via?: string
          invoice_terms?: string
          invoice_unit_price_text?: string
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
          spec_type?: string | null
          specifications?: Json
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
      site_profile_photos: {
        Row: {
          component_slot: string
          content_type: string | null
          created_at: string
          id: string
          profile_id: string
          public_url: string | null
          size_bytes: number | null
          slot_about: string | null
          slot_note: string | null
          slot_title: string | null
          storage_path: string
          system_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          component_slot: string
          content_type?: string | null
          created_at?: string
          id?: string
          profile_id: string
          public_url?: string | null
          size_bytes?: number | null
          slot_about?: string | null
          slot_note?: string | null
          slot_title?: string | null
          storage_path: string
          system_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          component_slot?: string
          content_type?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          public_url?: string | null
          size_bytes?: number | null
          slot_about?: string | null
          slot_note?: string | null
          slot_title?: string | null
          storage_path?: string
          system_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "site_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_profile_photos_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "site_profile_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      site_profile_report_counters: {
        Row: {
          company_key: string
          next_num: number
          year_key: string
        }
        Insert: {
          company_key: string
          next_num?: number
          year_key: string
        }
        Update: {
          company_key?: string
          next_num?: number
          year_key?: string
        }
        Relationships: []
      }
      site_profile_systems: {
        Row: {
          created_at: string
          data: Json
          id: string
          notes: string | null
          profile_id: string
          sort_order: number
          system_kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          profile_id: string
          sort_order?: number
          system_kind: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          profile_id?: string
          sort_order?: number
          system_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_profile_systems_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "site_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_profiles: {
        Row: {
          appointment_id: string | null
          assigned_company_id: string | null
          assigned_to: string | null
          bill_to: Json | null
          booking_method: string | null
          created_at: string
          created_by: string | null
          customer_deemed_status: string | null
          customer_id: string | null
          entered_by: string | null
          equipment_location: string | null
          equipment_type: string | null
          id: string
          job_number: string | null
          location_type: string | null
          mdu: boolean | null
          notes: string | null
          primary_contact: Json | null
          profile_type: string
          report_number: string | null
          secondary_contact: Json | null
          session_id: string | null
          ship_to: Json | null
          status: string
          submitted_at: string | null
          ticket_status: string | null
          unit_label: string | null
          updated_at: string
          visit_type: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_company_id?: string | null
          assigned_to?: string | null
          bill_to?: Json | null
          booking_method?: string | null
          created_at?: string
          created_by?: string | null
          customer_deemed_status?: string | null
          customer_id?: string | null
          entered_by?: string | null
          equipment_location?: string | null
          equipment_type?: string | null
          id?: string
          job_number?: string | null
          location_type?: string | null
          mdu?: boolean | null
          notes?: string | null
          primary_contact?: Json | null
          profile_type?: string
          report_number?: string | null
          secondary_contact?: Json | null
          session_id?: string | null
          ship_to?: Json | null
          status?: string
          submitted_at?: string | null
          ticket_status?: string | null
          unit_label?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_company_id?: string | null
          assigned_to?: string | null
          bill_to?: Json | null
          booking_method?: string | null
          created_at?: string
          created_by?: string | null
          customer_deemed_status?: string | null
          customer_id?: string | null
          entered_by?: string | null
          equipment_location?: string | null
          equipment_type?: string | null
          id?: string
          job_number?: string | null
          location_type?: string | null
          mdu?: boolean | null
          notes?: string | null
          primary_contact?: Json | null
          profile_type?: string
          report_number?: string | null
          secondary_contact?: Json | null
          session_id?: string | null
          ship_to?: Json | null
          status?: string
          submitted_at?: string | null
          ticket_status?: string | null
          unit_label?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_profiles_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_profiles_assigned_company_id_fkey"
            columns: ["assigned_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_profiles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          appointment_id: string | null
          assigned_employee_id: string | null
          assigned_team: Json
          attachments: Json
          calendar_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          due_date: string | null
          duration_minutes: number | null
          for_type: string
          google_event_id: string | null
          id: string
          location: string | null
          notes: string | null
          public_notes: string | null
          quote_responded_at: string | null
          quote_sent_at: string | null
          quote_status: string | null
          quote_token: string
          quote_total: number | null
          reminder_2h_sent_at: string | null
          reminder_night_sent_at: string | null
          reminder_sent_at: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          send_sms_reminder: boolean
          sourcing: Json
          status: string
          task_number: string | null
          task_type: string
          title: string
          updated_at: string
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_employee_id?: string | null
          assigned_team?: Json
          attachments?: Json
          calendar_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          for_type?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          public_notes?: string | null
          quote_responded_at?: string | null
          quote_sent_at?: string | null
          quote_status?: string | null
          quote_token?: string
          quote_total?: number | null
          reminder_2h_sent_at?: string | null
          reminder_night_sent_at?: string | null
          reminder_sent_at?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          send_sms_reminder?: boolean
          sourcing?: Json
          status?: string
          task_number?: string | null
          task_type?: string
          title: string
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_employee_id?: string | null
          assigned_team?: Json
          attachments?: Json
          calendar_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          for_type?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          public_notes?: string | null
          quote_responded_at?: string | null
          quote_sent_at?: string | null
          quote_status?: string | null
          quote_token?: string
          quote_total?: number | null
          reminder_2h_sent_at?: string | null
          reminder_night_sent_at?: string | null
          reminder_sent_at?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          send_sms_reminder?: boolean
          sourcing?: Json
          status?: string
          task_number?: string | null
          task_type?: string
          title?: string
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          appointment_id: string | null
          assigned_employee_id: string | null
          assigned_team: Json
          attachments: Json
          calendar_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_minutes: number | null
          expected_completion_date: string | null
          for_type: string
          google_event_id: string | null
          id: string
          location: string | null
          notes: string | null
          priority: string
          public_notes: string | null
          reason: string | null
          reminder_2h_sent_at: string | null
          reminder_night_sent_at: string | null
          reminder_sent_at: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          send_sms_reminder: boolean
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_employee_id?: string | null
          assigned_team?: Json
          attachments?: Json
          calendar_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          expected_completion_date?: string | null
          for_type?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string
          public_notes?: string | null
          reason?: string | null
          reminder_2h_sent_at?: string | null
          reminder_night_sent_at?: string | null
          reminder_sent_at?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          send_sms_reminder?: boolean
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_employee_id?: string | null
          assigned_team?: Json
          attachments?: Json
          calendar_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          expected_completion_date?: string | null
          for_type?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: string
          public_notes?: string | null
          reason?: string | null
          reminder_2h_sent_at?: string | null
          reminder_night_sent_at?: string | null
          reminder_sent_at?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          send_sms_reminder?: boolean
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      work_item_replies: {
        Row: {
          author_id: string | null
          author_name: string | null
          channel: string | null
          created_at: string
          direction: string
          id: string
          item_id: string
          item_type: string
          media: Json
          message: string
          phone: string | null
          read_at: string | null
          vendor_id: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          channel?: string | null
          created_at?: string
          direction?: string
          id?: string
          item_id: string
          item_type: string
          media?: Json
          message: string
          phone?: string | null
          read_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          channel?: string | null
          created_at?: string
          direction?: string
          id?: string
          item_id?: string
          item_type?: string
          media?: Json
          message?: string
          phone?: string | null
          read_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_close_past_appointments: { Args: never; Returns: number }
      can_access_chat: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      chat_external_names: {
        Args: never
        Returns: {
          conversation_id: string
          match_type: string
          phone_number: string
          resolved_name: string
        }[]
      }
      chat_unread_counts: {
        Args: never
        Returns: {
          conversation_id: string
          unread: number
        }[]
      }
      company_initials: { Args: { _name: string }; Returns: string }
      complete_booking_invitation: {
        Args: { _token: string }
        Returns: undefined
      }
      complete_hire_invitation: { Args: { _token: string }; Returns: undefined }
      crm_pending_submissions: {
        Args: never
        Returns: {
          company_name: string
          customer_name: string
          id: string
          kind: string
          scheduled_date: string
          scheduled_time: string
          submitted_at: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      employee_code_for: { Args: { _company_id: string }; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_booking_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          assigned_employee_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_type: string
          expires_at: string | null
          id: string
          invitation_type: string
          link_type: string | null
          notes: string | null
          opened_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          seen_at: string | null
          sent_at: string | null
          staff_notified_at: string | null
          status: string
          token: string
        }[]
        SetofOptions: {
          from: "*"
          to: "booking_invitations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      get_hire_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          department: string | null
          expires_at: string | null
          id: string
          notes: string | null
          opened_at: string | null
          qualifications: string[]
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          send_method: string
          sent_at: string | null
          status: string
          token: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "hire_invitations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_employees: {
        Args: never
        Returns: {
          city: string
          first_name: string
          id: string
          last_name: string
          state: string
        }[]
      }
      get_task_quote: {
        Args: { _token: string }
        Returns: {
          company_name: string
          customer_name: string
          quote_status: string
          quote_total: number
          task_number: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_phone_blocked: { Args: { _phone: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      lookup_caller_by_phone:
        | { Args: { _phone: string }; Returns: Json }
        | { Args: { _phone: string; _to_number?: string }; Returns: Json }
      mark_booking_invitation_opened: {
        Args: { _token: string }
        Returns: undefined
      }
      mark_hire_invitation_opened: {
        Args: { _token: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalc_cart_totals: { Args: { _cart_id: string }; Returns: undefined }
      respond_task_quote: {
        Args: { _decision: string; _token: string }
        Returns: string
      }
      submit_appointment_request: {
        Args: {
          _customer_address: string
          _customer_email: string
          _customer_name: string
          _customer_phone: string
          _notes: string
          _scheduled_date: string
          _scheduled_time: string
          _token: string
          _visit_type: string
        }
        Returns: string
      }
      work_item_prefix: { Args: { _company_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      applicant_account_status: "invited" | "active" | "suspended"
      applicant_consent_type:
        | "criminal_background_check"
        | "drug_testing"
        | "driving_history"
        | "citizenship_affidavit"
        | "general_terms"
      applicant_document_status: "pending" | "approved" | "rejected"
      applicant_document_type:
        | "personal_photo"
        | "drivers_license"
        | "birth_certificate"
        | "social_security_card"
        | "irs_1099"
        | "irs_w4"
        | "work_authorization"
        | "citizenship_affidavit"
        | "address_proof_1"
        | "address_proof_2"
        | "other"
      applicant_interview_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "no_show"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      applicant_account_status: ["invited", "active", "suspended"],
      applicant_consent_type: [
        "criminal_background_check",
        "drug_testing",
        "driving_history",
        "citizenship_affidavit",
        "general_terms",
      ],
      applicant_document_status: ["pending", "approved", "rejected"],
      applicant_document_type: [
        "personal_photo",
        "drivers_license",
        "birth_certificate",
        "social_security_card",
        "irs_1099",
        "irs_w4",
        "work_authorization",
        "citizenship_affidavit",
        "address_proof_1",
        "address_proof_2",
        "other",
      ],
      applicant_interview_status: [
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
      ],
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
