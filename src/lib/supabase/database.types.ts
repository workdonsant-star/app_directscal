export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  next_auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          emailVerified: string | null;
          image: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: string | null;
          image?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: string | null;
          image?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      uid: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  app_private: {
    Tables: {
      user_password_credentials: {
        Row: {
          user_id: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      acquisition_oauth_intents: {
        Row: {
          id: string;
          campaign_id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  public: {
    Enums: {
      acquisition_account_provider: "google" | "password";
      acquisition_campaign_status: "ativo" | "pausado";
      acquisition_form_field_type:
        | "text"
        | "email"
        | "phone"
        | "number"
        | "select"
        | "textarea";
      acquisition_lead_status:
        | "lead"
        | "pending_company"
        | "account_created";
      auth_role: "superadmin" | "admin" | "cliente";
      diagnostic_status: "rascunho" | "ativo" | "encerrado";
      operational_member_status:
        | "aprovado"
        | "pendente_aprovacao"
        | "rejeitado";
      respondent_group: "fundador" | "lideranca" | "operacao";
      response_session_status: "iniciado" | "concluido";
    };
    Tables: {
      acquisition_campaigns: {
        Row: {
          id: string;
          module_id: string;
          name: string;
          source: string;
          status: Database["public"]["Enums"]["acquisition_campaign_status"];
          token: string;
          public_path: string;
          visits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          module_id: string;
          name: string;
          source: string;
          status?: Database["public"]["Enums"]["acquisition_campaign_status"];
          token: string;
          public_path: string;
          visits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          name?: string;
          source?: string;
          status?: Database["public"]["Enums"]["acquisition_campaign_status"];
          token?: string;
          public_path?: string;
          visits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      acquisition_campaign_fields: {
        Row: {
          campaign_id: string;
          id: string;
          label: string;
          type: Database["public"]["Enums"]["acquisition_form_field_type"];
          required: boolean;
          placeholder: string | null;
          options: Json | null;
          order_index: number;
        };
        Insert: {
          campaign_id: string;
          id: string;
          label: string;
          type: Database["public"]["Enums"]["acquisition_form_field_type"];
          required?: boolean;
          placeholder?: string | null;
          options?: Json | null;
          order_index: number;
        };
        Update: {
          campaign_id?: string;
          id?: string;
          label?: string;
          type?: Database["public"]["Enums"]["acquisition_form_field_type"];
          required?: boolean;
          placeholder?: string | null;
          options?: Json | null;
          order_index?: number;
        };
        Relationships: [];
      };
      acquisition_leads: {
        Row: {
          id: string;
          module_id: string;
          campaign_id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          email: string;
          normalized_email: string;
          phone: string | null;
          role: string | null;
          company_name: string;
          company_size: string | null;
          objective: string | null;
          field_values: Json;
          status: Database["public"]["Enums"]["acquisition_lead_status"];
          account_provider:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          campaign_id: string;
          user_id?: string | null;
          organization_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          role?: string | null;
          company_name: string;
          company_size?: string | null;
          objective?: string | null;
          field_values?: Json;
          status?: Database["public"]["Enums"]["acquisition_lead_status"];
          account_provider?:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          campaign_id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: string | null;
          company_name?: string;
          company_size?: string | null;
          objective?: string | null;
          field_values?: Json;
          status?: Database["public"]["Enums"]["acquisition_lead_status"];
          account_provider?:
            | Database["public"]["Enums"]["acquisition_account_provider"]
            | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          employee_count: number;
          domain: string | null;
          operational_onboarding_required: boolean;
          operational_onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          employee_count?: number;
          domain?: string | null;
          operational_onboarding_required?: boolean;
          operational_onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          employee_count?: number;
          domain?: string | null;
          operational_onboarding_required?: boolean;
          operational_onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      operational_onboarding_links: {
        Row: {
          id: string;
          organization_id: string;
          token: string;
          created_by: string | null;
          created_at: string;
          disabled_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          token: string;
          created_by?: string | null;
          created_at?: string;
          disabled_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          token?: string;
          created_by?: string | null;
          created_at?: string;
          disabled_at?: string | null;
        };
        Relationships: [];
      };
      operational_members: {
        Row: {
          id: string;
          organization_id: string;
          onboarding_link_id: string | null;
          name: string;
          email: string;
          normalized_email: string;
          area: string;
          operational_role: string;
          perceived_responsibilities: string;
          participates_in_area_decisions: boolean;
          status: Database["public"]["Enums"]["operational_member_status"];
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          onboarding_link_id?: string | null;
          name: string;
          email: string;
          area: string;
          operational_role: string;
          perceived_responsibilities: string;
          participates_in_area_decisions: boolean;
          status?: Database["public"]["Enums"]["operational_member_status"];
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          onboarding_link_id?: string | null;
          name?: string;
          email?: string;
          area?: string;
          operational_role?: string;
          perceived_responsibilities?: string;
          participates_in_area_decisions?: boolean;
          status?: Database["public"]["Enums"]["operational_member_status"];
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["auth_role"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["auth_role"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["auth_role"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_module_access: {
        Row: {
          organization_id: string;
          module_id: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          module_id: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          module_id?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      diagnostics: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["diagnostic_status"];
          created_at: string;
          updated_at: string;
          activated_at: string | null;
          closed_at: string | null;
          deadline: string | null;
          general_score: number | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          template_id: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["diagnostic_status"];
          created_at?: string;
          updated_at?: string;
          activated_at?: string | null;
          closed_at?: string | null;
          deadline?: string | null;
          general_score?: number | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          template_id?: string;
          name?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["diagnostic_status"];
          created_at?: string;
          updated_at?: string;
          activated_at?: string | null;
          closed_at?: string | null;
          deadline?: string | null;
          general_score?: number | null;
        };
        Relationships: [];
      };
      diagnostic_templates: {
        Row: {
          id: string;
          slug: string;
          version: number;
          name: string;
          description: string;
          is_locked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          version: number;
          name: string;
          description: string;
          is_locked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          version?: number;
          name?: string;
          description?: string;
          is_locked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      dimensions: {
        Row: {
          id: string;
          slug: string;
          number: number;
          name: string;
          short_name: string;
          question: string;
          description: string;
        };
        Insert: {
          id?: string;
          slug: string;
          number: number;
          name: string;
          short_name: string;
          question: string;
          description: string;
        };
        Update: {
          id?: string;
          slug?: string;
          number?: number;
          name?: string;
          short_name?: string;
          question?: string;
          description?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          template_id: string;
          dimension_id: string;
          order_index: number;
          text: string;
          is_locked: boolean;
        };
        Insert: {
          id?: string;
          template_id: string;
          dimension_id: string;
          order_index: number;
          text: string;
          is_locked?: boolean;
        };
        Update: {
          id?: string;
          template_id?: string;
          dimension_id?: string;
          order_index?: number;
          text?: string;
          is_locked?: boolean;
        };
        Relationships: [];
      };
      likert_scale_points: {
        Row: {
          id: string;
          template_id: string;
          value: number;
          label: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          value: number;
          label: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          value?: number;
          label?: string;
        };
        Relationships: [];
      };
      diagnostic_share_links: {
        Row: {
          id: string;
          diagnostic_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          token: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          token: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          group_id?: Database["public"]["Enums"]["respondent_group"];
          token?: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      respondents: {
        Row: {
          id: string;
          diagnostic_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          name: string;
          email: string;
          normalized_email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          name: string;
          email: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          group_id?: Database["public"]["Enums"]["respondent_group"];
          name?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      response_sessions: {
        Row: {
          id: string;
          diagnostic_id: string;
          respondent_id: string | null;
          share_link_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          status: Database["public"]["Enums"]["response_session_status"];
          started_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          respondent_id?: string | null;
          share_link_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          status?: Database["public"]["Enums"]["response_session_status"];
          started_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          respondent_id?: string | null;
          share_link_id?: string;
          group_id?: Database["public"]["Enums"]["respondent_group"];
          status?: Database["public"]["Enums"]["response_session_status"];
          started_at?: string;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      likert_answers: {
        Row: {
          id: string;
          response_session_id: string;
          question_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_session_id: string;
          question_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_session_id?: string;
          question_id?: string;
          value?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      omdx_question_aggregates: {
        Args: {
          diagnostic_ids: string[];
        };
        Returns: {
          diagnostic_id: string;
          dimension_id: string;
          dimension_slug: string;
          dimension_number: number;
          dimension_name: string;
          dimension_short_name: string;
          dimension_question: string;
          dimension_description: string;
          question_id: string;
          question_order_index: number;
          question_text: string;
          response_count: number;
          founder_count: number;
          leadership_count: number;
          operation_count: number;
          score: number | null;
          variance: number | null;
          founder_score: number | null;
          leadership_score: number | null;
          operation_score: number | null;
        }[];
      };
    };
    CompositeTypes: Record<string, never>;
  };
};
