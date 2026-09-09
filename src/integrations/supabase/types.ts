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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          account_type: string
          created_at: string
          email: string
          full_name: string
          handle: string
          id: string
          message: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          email: string
          full_name: string
          handle: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          created_at?: string
          email?: string
          full_name?: string
          handle?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_influencers: {
        Row: {
          account_type: string
          campaign_id: string
          content_type: string
          content_views: number
          cost_per_lead: number
          created_at: string
          date_onboarded: string | null
          date_paid: string | null
          email: string | null
          engagements: number
          id: string
          influencer_handle: string
          leads: number
          link_clicks: number
          primary_email: string | null
          slug: string
          status: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          account_type?: string
          campaign_id: string
          content_type: string
          content_views?: number
          cost_per_lead?: number
          created_at?: string
          date_onboarded?: string | null
          date_paid?: string | null
          email?: string | null
          engagements?: number
          id?: string
          influencer_handle: string
          leads?: number
          link_clicks?: number
          primary_email?: string | null
          slug: string
          status?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          account_type?: string
          campaign_id?: string
          content_type?: string
          content_views?: number
          cost_per_lead?: number
          created_at?: string
          date_onboarded?: string | null
          date_paid?: string | null
          email?: string | null
          engagements?: number
          id?: string
          influencer_handle?: string
          leads?: number
          link_clicks?: number
          primary_email?: string | null
          slug?: string
          status?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          campaign_influencer_id: string
          created_at: string
          engagements: number
          id: string
          post_url: string
          shares: number
          views: number
        }
        Insert: {
          campaign_influencer_id: string
          created_at?: string
          engagements?: number
          id?: string
          post_url: string
          shares?: number
          views?: number
        }
        Update: {
          campaign_influencer_id?: string
          created_at?: string
          engagements?: number
          id?: string
          post_url?: string
          shares?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_campaign_influencer_id_fkey"
            columns: ["campaign_influencer_id"]
            isOneToOne: false
            referencedRelation: "campaign_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_settings: {
        Row: {
          button_label: string
          headline: string
          id: string
          singleton: boolean
          subheadline: string
          success_message: string
          updated_at: string
        }
        Insert: {
          button_label?: string
          headline?: string
          id?: string
          singleton?: boolean
          subheadline?: string
          success_message?: string
          updated_at?: string
        }
        Update: {
          button_label?: string
          headline?: string
          id?: string
          singleton?: boolean
          subheadline?: string
          success_message?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_influencer_id: string
          company_name: string
          company_size: string
          created_at: string
          full_name: string
          id: string
          phone: string | null
          roles_hiring_for: string
          talent_preference: string
          work_email: string
        }
        Insert: {
          campaign_influencer_id: string
          company_name: string
          company_size: string
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          roles_hiring_for: string
          talent_preference: string
          work_email: string
        }
        Update: {
          campaign_influencer_id?: string
          company_name?: string
          company_size?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          roles_hiring_for?: string
          talent_preference?: string
          work_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_influencer_id_fkey"
            columns: ["campaign_influencer_id"]
            isOneToOne: false
            referencedRelation: "campaign_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_influencer_access: { Args: never; Returns: number }
      get_influencer_by_slug: {
        Args: { _slug: string }
        Returns: {
          id: string
          influencer_handle: string
        }[]
      }
      get_public_influencer: {
        Args: { _slug: string }
        Returns: {
          id: string
          influencer_handle: string
          slug: string
        }[]
      }
      slugify_handle: { Args: { _handle: string }; Returns: string }
      username_available: {
        Args: { _self?: string; _username: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
