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
  public: {
    Enums: {
      auth_role: "superadmin" | "admin" | "cliente";
      diagnostic_status: "rascunho" | "ativo" | "encerrado";
      respondent_group: "fundador" | "lideranca" | "operacao";
      response_session_status: "iniciado" | "concluido";
    };
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          employee_count: number;
          domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          employee_count?: number;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          employee_count?: number;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
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
          respondent_id: string;
          share_link_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          status: Database["public"]["Enums"]["response_session_status"];
          started_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          respondent_id: string;
          share_link_id: string;
          group_id: Database["public"]["Enums"]["respondent_group"];
          status?: Database["public"]["Enums"]["response_session_status"];
          started_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          respondent_id?: string;
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
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
