export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_credentials: {
        Row: {
          api_key: string
          api_name: string
          api_secret: string | null
          api_type: string | null
          created_at: string | null
          id: string
          nickname: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key: string
          api_name: string
          api_secret?: string | null
          api_type?: string | null
          created_at?: string | null
          id?: string
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string
          api_name?: string
          api_secret?: string | null
          api_type?: string | null
          created_at?: string | null
          id?: string
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      channel_mappings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          source_channel_id: string
          target_channel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_channel_id: string
          target_channel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_channel_id?: string
          target_channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_mappings_source_channel_id_fkey"
            columns: ["source_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_mappings_target_channel_id_fkey"
            columns: ["target_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_pairs: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_active: boolean
          source_channel: string
          target_channel: string
          target_username: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_channel: string
          target_channel: string
          target_username?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_channel?: string
          target_channel?: string
          target_username?: string | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_id: string
          channel_name: string
          channel_type: string
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
        }
        Insert: {
          channel_id: string
          channel_name: string
          channel_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          channel_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          is_active: boolean
          username: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          username: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contains_competitor_mention: boolean
          created_at: string
          detected_competitors: string[] | null
          id: string
          message_id: string
          modified_text: string | null
          original_text: string
          processed: boolean
          processed_at: string | null
          source_channel_id: string
          target_channel_id: string | null
        }
        Insert: {
          contains_competitor_mention?: boolean
          created_at?: string
          detected_competitors?: string[] | null
          id?: string
          message_id: string
          modified_text?: string | null
          original_text: string
          processed?: boolean
          processed_at?: string | null
          source_channel_id: string
          target_channel_id?: string | null
        }
        Update: {
          contains_competitor_mention?: boolean
          created_at?: string
          detected_competitors?: string[] | null
          id?: string
          message_id?: string
          modified_text?: string | null
          original_text?: string
          processed?: boolean
          processed_at?: string | null
          source_channel_id?: string
          target_channel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_source_channel_id_fkey"
            columns: ["source_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_target_channel_id_fkey"
            columns: ["target_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
