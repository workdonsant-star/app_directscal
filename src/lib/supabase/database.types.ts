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
    PostgrestVersion: "14.17"
  }
  app_private: {
    Tables: {
      acquisition_oauth_intents: {
        Row: {
          campaign_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      leadership_invitations: {
        Row: {
          accepted_at: string | null
          access_role: Database["public"]["Enums"]["auth_role"]
          created_at: string
          created_by: string | null
          delivery_error: string | null
          delivery_status: Database["app_private"]["Enums"]["email_delivery_status"]
          expires_at: string
          id: string
          last_sent_at: string | null
          organization_id: string
          person_id: string
          provider_message_id: string | null
          sector_id: string
          status: Database["app_private"]["Enums"]["leadership_invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          access_role?: Database["public"]["Enums"]["auth_role"]
          created_at?: string
          created_by?: string | null
          delivery_error?: string | null
          delivery_status?: Database["app_private"]["Enums"]["email_delivery_status"]
          expires_at: string
          id?: string
          last_sent_at?: string | null
          organization_id: string
          person_id: string
          provider_message_id?: string | null
          sector_id: string
          status?: Database["app_private"]["Enums"]["leadership_invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          access_role?: Database["public"]["Enums"]["auth_role"]
          created_at?: string
          created_by?: string | null
          delivery_error?: string | null
          delivery_status?: Database["app_private"]["Enums"]["email_delivery_status"]
          expires_at?: string
          id?: string
          last_sent_at?: string | null
          organization_id?: string
          person_id?: string
          provider_message_id?: string | null
          sector_id?: string
          status?: Database["app_private"]["Enums"]["leadership_invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_password_credentials: {
        Row: {
          created_at: string
          password_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          password_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          password_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_leadership_invitation: {
        Args: { p_token_hash: string; p_user_id: string }
        Returns: Json
      }
      activate_diagnostic_with_links: {
        Args: {
          p_activated_at: string
          p_actor_user_id: string
          p_diagnostic_id: string
        }
        Returns: {
          diagnostic_id: string
          group_id: Database["public"]["Enums"]["respondent_group"]
          sector_id: string
          token: string
        }[]
      }
      can_access_diagnostic: {
        Args: { target_diagnostic_id: string }
        Returns: boolean
      }
      can_manage_diagnostic: {
        Args: { target_diagnostic_id: string }
        Returns: boolean
      }
      can_view_diagnostic: {
        Args: { target_diagnostic_id: string }
        Returns: boolean
      }
      create_leadership_invitation: {
        Args: {
          p_access_role: Database["public"]["Enums"]["auth_role"]
          p_created_by: string
          p_expires_at: string
          p_leader_email: string
          p_organization_id: string
          p_position: string
          p_sector_name: string
          p_token_hash: string
        }
        Returns: Json
      }
      is_company_owner: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
      sync_diagnostic_leaders: {
        Args: {
          p_actor_user_id: string
          p_diagnostic_id: string
          p_person_ids: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      email_delivery_status: "pendente" | "enviado" | "falhou"
      leadership_invitation_status:
        | "pendente"
        | "aceito"
        | "expirado"
        | "revogado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  next_auth: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          oauth_token: string | null
          oauth_token_secret: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          oauth_token?: string | null
          oauth_token_secret?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          oauth_token?: string | null
          oauth_token_secret?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string | null
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId?: string | null
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Update: {
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          expires: string
          identifier: string | null
          token: string
        }
        Insert: {
          expires: string
          identifier?: string | null
          token: string
        }
        Update: {
          expires?: string
          identifier?: string | null
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      uid: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      acquisition_campaign_fields: {
        Row: {
          campaign_id: string
          id: string
          label: string
          options: Json | null
          order_index: number
          placeholder: string | null
          required: boolean
          type: Database["public"]["Enums"]["acquisition_form_field_type"]
        }
        Insert: {
          campaign_id: string
          id: string
          label: string
          options?: Json | null
          order_index: number
          placeholder?: string | null
          required?: boolean
          type: Database["public"]["Enums"]["acquisition_form_field_type"]
        }
        Update: {
          campaign_id?: string
          id?: string
          label?: string
          options?: Json | null
          order_index?: number
          placeholder?: string | null
          required?: boolean
          type?: Database["public"]["Enums"]["acquisition_form_field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_campaign_fields_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "acquisition_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      acquisition_campaigns: {
        Row: {
          created_at: string
          id: string
          module_id: string
          name: string
          public_path: string
          source: string
          status: Database["public"]["Enums"]["acquisition_campaign_status"]
          token: string
          updated_at: string
          visits: number
        }
        Insert: {
          created_at?: string
          id: string
          module_id: string
          name: string
          public_path: string
          source: string
          status?: Database["public"]["Enums"]["acquisition_campaign_status"]
          token: string
          updated_at?: string
          visits?: number
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          name?: string
          public_path?: string
          source?: string
          status?: Database["public"]["Enums"]["acquisition_campaign_status"]
          token?: string
          updated_at?: string
          visits?: number
        }
        Relationships: []
      }
      acquisition_leads: {
        Row: {
          account_provider:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null
          campaign_id: string
          company_name: string
          company_size: string | null
          created_at: string
          email: string
          field_values: Json
          id: string
          module_id: string
          name: string
          normalized_email: string | null
          objective: string | null
          organization_id: string | null
          phone: string | null
          role: string | null
          status: Database["public"]["Enums"]["acquisition_lead_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_provider?:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null
          campaign_id: string
          company_name: string
          company_size?: string | null
          created_at?: string
          email: string
          field_values?: Json
          id?: string
          module_id: string
          name: string
          normalized_email?: string | null
          objective?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["acquisition_lead_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_provider?:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null
          campaign_id?: string
          company_name?: string
          company_size?: string | null
          created_at?: string
          email?: string
          field_values?: Json
          id?: string
          module_id?: string
          name?: string
          normalized_email?: string | null
          objective?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["acquisition_lead_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "acquisition_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_deliveries: {
        Row: {
          created_at: string
          diagnostic_id: string
          dimension_readings: Json
          organization_id: string
          published_at: string | null
          published_by_user_id: string | null
          report_content: Json
          selected_action_point_ids: string[]
          specialist_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostic_id: string
          dimension_readings?: Json
          organization_id: string
          published_at?: string | null
          published_by_user_id?: string | null
          report_content?: Json
          selected_action_point_ids?: string[]
          specialist_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string
          dimension_readings?: Json
          organization_id?: string
          published_at?: string | null
          published_by_user_id?: string | null
          report_content?: Json
          selected_action_point_ids?: string[]
          specialist_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_deliveries_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: true
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_deliveries_published_by_user_id_fkey"
            columns: ["published_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_leader_assignments: {
        Row: {
          assigned_by_user_id: string | null
          created_at: string
          diagnostic_sector_scope_id: string
          id: string
          organization_id: string
          person_id: string
        }
        Insert: {
          assigned_by_user_id?: string | null
          created_at?: string
          diagnostic_sector_scope_id: string
          id?: string
          organization_id: string
          person_id: string
        }
        Update: {
          assigned_by_user_id?: string | null
          created_at?: string
          diagnostic_sector_scope_id?: string
          id?: string
          organization_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_leader_assignments_diagnostic_sector_scope_id_fkey"
            columns: ["diagnostic_sector_scope_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sector_scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_leader_assignments_diagnostic_sector_scope_id_o_fkey"
            columns: ["diagnostic_sector_scope_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sector_scopes"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "diagnostic_leader_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_leader_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "organization_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_leader_assignments_person_id_organization_id_fkey"
            columns: ["person_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_people"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      diagnostic_sector_scopes: {
        Row: {
          created_at: string
          diagnostic_id: string
          id: string
          organization_id: string
          sector_id: string
        }
        Insert: {
          created_at?: string
          diagnostic_id: string
          id?: string
          organization_id: string
          sector_id: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string
          id?: string
          organization_id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_sector_scopes_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_sector_scopes_diagnostic_id_organization_id_fkey"
            columns: ["diagnostic_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "diagnostic_sector_scopes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_sector_scopes_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "organization_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_sector_scopes_sector_id_organization_id_fkey"
            columns: ["sector_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_sectors"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      diagnostic_share_links: {
        Row: {
          created_at: string
          diagnostic_id: string
          expires_at: string | null
          group_id: Database["public"]["Enums"]["respondent_group"]
          id: string
          sector_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          diagnostic_id: string
          expires_at?: string | null
          group_id: Database["public"]["Enums"]["respondent_group"]
          id?: string
          sector_id?: string | null
          token: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string
          expires_at?: string | null
          group_id?: Database["public"]["Enums"]["respondent_group"]
          id?: string
          sector_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_share_links_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_share_links_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "organization_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_templates: {
        Row: {
          created_at: string
          description: string
          id: string
          is_locked: boolean
          name: string
          slug: string
          version: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_locked?: boolean
          name: string
          slug: string
          version: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_locked?: boolean
          name?: string
          slug?: string
          version?: number
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          activated_at: string | null
          closed_at: string | null
          created_at: string
          created_by_user_id: string | null
          deadline: string | null
          description: string | null
          general_score: number | null
          id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["diagnostic_status"]
          template_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deadline?: string | null
          description?: string | null
          general_score?: number | null
          id?: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["diagnostic_status"]
          template_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deadline?: string | null
          description?: string | null
          general_score?: number | null
          id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["diagnostic_status"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensions: {
        Row: {
          description: string
          id: string
          name: string
          number: number
          question: string
          short_name: string
          slug: string
        }
        Insert: {
          description: string
          id?: string
          name: string
          number: number
          question: string
          short_name: string
          slug: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
          number?: number
          question?: string
          short_name?: string
          slug?: string
        }
        Relationships: []
      }
      likert_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_session_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_session_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_session_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "likert_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likert_answers_response_session_id_fkey"
            columns: ["response_session_id"]
            isOneToOne: false
            referencedRelation: "response_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      likert_scale_points: {
        Row: {
          id: string
          label: string
          template_id: string
          value: number
        }
        Insert: {
          id?: string
          label: string
          template_id: string
          value: number
        }
        Update: {
          id?: string
          label?: string
          template_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "likert_scale_points_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_members: {
        Row: {
          area: string
          email: string
          id: string
          name: string
          normalized_email: string | null
          onboarding_link_id: string | null
          operational_role: string
          organization_id: string
          participates_in_area_decisions: boolean
          perceived_responsibilities: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["operational_member_status"]
          submitted_at: string
        }
        Insert: {
          area: string
          email: string
          id?: string
          name: string
          normalized_email?: string | null
          onboarding_link_id?: string | null
          operational_role: string
          organization_id: string
          participates_in_area_decisions: boolean
          perceived_responsibilities: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["operational_member_status"]
          submitted_at?: string
        }
        Update: {
          area?: string
          email?: string
          id?: string
          name?: string
          normalized_email?: string | null
          onboarding_link_id?: string | null
          operational_role?: string
          organization_id?: string
          participates_in_area_decisions?: boolean
          perceived_responsibilities?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["operational_member_status"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_members_onboarding_link_id_fkey"
            columns: ["onboarding_link_id"]
            isOneToOne: false
            referencedRelation: "operational_onboarding_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_onboarding_links: {
        Row: {
          created_at: string
          created_by: string | null
          disabled_at: string | null
          id: string
          organization_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          id?: string
          organization_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          id?: string
          organization_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_onboarding_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["auth_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["auth_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["auth_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_module_access: {
        Row: {
          created_at: string
          enabled: boolean
          module_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          module_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          module_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_module_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_people: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          normalized_email: string | null
          organization_id: string
          position: string
          status: Database["public"]["Enums"]["organization_person_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          normalized_email?: string | null
          organization_id: string
          position: string
          status?: Database["public"]["Enums"]["organization_person_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          normalized_email?: string | null
          organization_id?: string
          position?: string
          status?: Database["public"]["Enums"]["organization_person_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sector_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          person_id: string
          role: Database["public"]["Enums"]["organization_membership_role"]
          sector_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          person_id: string
          role: Database["public"]["Enums"]["organization_membership_role"]
          sector_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          person_id?: string
          role?: Database["public"]["Enums"]["organization_membership_role"]
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sector_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sector_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "organization_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sector_memberships_person_id_organization_id_fkey"
            columns: ["person_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_people"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_sector_memberships_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "organization_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sector_memberships_sector_id_organization_id_fkey"
            columns: ["sector_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_sectors"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_sectors: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          normalized_name: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          normalized_name?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          employee_count: number
          id: string
          name: string
          operational_onboarding_completed_at: string | null
          operational_onboarding_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          employee_count?: number
          id?: string
          name: string
          operational_onboarding_completed_at?: string | null
          operational_onboarding_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          employee_count?: number
          id?: string
          name?: string
          operational_onboarding_completed_at?: string | null
          operational_onboarding_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          dimension_id: string
          id: string
          is_locked: boolean
          order_index: number
          template_id: string
          text: string
        }
        Insert: {
          dimension_id: string
          id?: string
          is_locked?: boolean
          order_index: number
          template_id: string
          text: string
        }
        Update: {
          dimension_id?: string
          id?: string
          is_locked?: boolean
          order_index?: number
          template_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      respondents: {
        Row: {
          created_at: string
          diagnostic_id: string
          email: string
          group_id: Database["public"]["Enums"]["respondent_group"]
          id: string
          name: string
          normalized_email: string | null
          role: string
        }
        Insert: {
          created_at?: string
          diagnostic_id: string
          email: string
          group_id: Database["public"]["Enums"]["respondent_group"]
          id?: string
          name: string
          normalized_email?: string | null
          role: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string
          email?: string
          group_id?: Database["public"]["Enums"]["respondent_group"]
          id?: string
          name?: string
          normalized_email?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "respondents_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      response_sessions: {
        Row: {
          diagnostic_id: string
          group_id: Database["public"]["Enums"]["respondent_group"]
          id: string
          respondent_id: string | null
          share_link_id: string
          started_at: string
          status: Database["public"]["Enums"]["response_session_status"]
          submitted_at: string | null
        }
        Insert: {
          diagnostic_id: string
          group_id: Database["public"]["Enums"]["respondent_group"]
          id?: string
          respondent_id?: string | null
          share_link_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["response_session_status"]
          submitted_at?: string | null
        }
        Update: {
          diagnostic_id?: string
          group_id?: Database["public"]["Enums"]["respondent_group"]
          id?: string
          respondent_id?: string | null
          share_link_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["response_session_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_sessions_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_sessions_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: true
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_sessions_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_share_links"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      omdx_question_aggregates: {
        Args: { diagnostic_ids: string[] }
        Returns: {
          diagnostic_id: string
          dimension_description: string
          dimension_id: string
          dimension_name: string
          dimension_number: number
          dimension_question: string
          dimension_short_name: string
          dimension_slug: string
          founder_count: number
          founder_score: number
          leadership_count: number
          leadership_score: number
          operation_count: number
          operation_score: number
          question_id: string
          question_order_index: number
          question_text: string
          response_count: number
          score: number
          variance: number
        }[]
      }
    }
    Enums: {
      acquisition_account_provider: "google" | "password"
      acquisition_campaign_status: "ativo" | "pausado"
      acquisition_form_field_type:
        | "text"
        | "email"
        | "phone"
        | "number"
        | "select"
        | "textarea"
      acquisition_lead_status: "lead" | "pending_company" | "account_created"
      auth_role: "superadmin" | "admin" | "cliente"
      diagnostic_status: "rascunho" | "ativo" | "encerrado"
      operational_member_status: "aprovado" | "pendente_aprovacao" | "rejeitado"
      organization_membership_role: "lideranca" | "membro"
      organization_person_status: "convite_pendente" | "ativo" | "inativo"
      respondent_group: "fundador" | "lideranca" | "operacao"
      response_session_status: "iniciado" | "concluido"
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
  app_private: {
    Enums: {
      email_delivery_status: ["pendente", "enviado", "falhou"],
      leadership_invitation_status: [
        "pendente",
        "aceito",
        "expirado",
        "revogado",
      ],
    },
  },
  next_auth: {
    Enums: {},
  },
  public: {
    Enums: {
      acquisition_account_provider: ["google", "password"],
      acquisition_campaign_status: ["ativo", "pausado"],
      acquisition_form_field_type: [
        "text",
        "email",
        "phone",
        "number",
        "select",
        "textarea",
      ],
      acquisition_lead_status: ["lead", "pending_company", "account_created"],
      auth_role: ["superadmin", "admin", "cliente"],
      diagnostic_status: ["rascunho", "ativo", "encerrado"],
      operational_member_status: [
        "aprovado",
        "pendente_aprovacao",
        "rejeitado",
      ],
      organization_membership_role: ["lideranca", "membro"],
      organization_person_status: ["convite_pendente", "ativo", "inativo"],
      respondent_group: ["fundador", "lideranca", "operacao"],
      response_session_status: ["iniciado", "concluido"],
    },
  },
} as const
