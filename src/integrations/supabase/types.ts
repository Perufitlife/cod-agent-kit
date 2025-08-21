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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_credentials: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          name: string
          permissions: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          name: string
          permissions?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          name?: string
          permissions?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          customer_phone: string
          id: string
          order_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          workflow_run_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_phone: string
          id?: string
          order_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_phone?: string
          id?: string
          order_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          payload: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          payload: Json
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      field_definitions: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          key: string
          label: string
          required: boolean | null
          tenant_id: string
          type: string
          version: number
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          key: string
          label: string
          required?: boolean | null
          tenant_id: string
          type: string
          version: number
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          key?: string
          label?: string
          required?: boolean | null
          tenant_id?: string
          type?: string
          version?: number
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_catalog: {
        Row: {
          created_at: string | null
          id: string
          intents: Json
          tenant_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          intents: Json
          tenant_id: string
          updated_at?: string | null
          version: number
        }
        Update: {
          created_at?: string | null
          id?: string
          intents?: Json
          tenant_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "intent_catalog_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_inbox: {
        Row: {
          conversation_id: string
          created_at: string | null
          customer_phone: string | null
          id: string
          message_text: string
          raw: Json | null
          received_at: string | null
          tenant_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          customer_phone?: string | null
          id?: string
          message_text: string
          raw?: Json | null
          received_at?: string | null
          tenant_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          customer_phone?: string | null
          id?: string
          message_text?: string
          raw?: Json | null
          received_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_inbox_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_inbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_outbox: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message_text: string
          payload: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text: string
          payload?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text?: string
          payload?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_outbox_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_phone_e164: string | null
          data: Json
          external_order_id: string | null
          id: string
          needs_attention: boolean | null
          notes: string[] | null
          schema_version: number
          source: string | null
          status: string | null
          system_order_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_phone_e164?: string | null
          data?: Json
          external_order_id?: string | null
          id?: string
          needs_attention?: boolean | null
          notes?: string[] | null
          schema_version: number
          source?: string | null
          status?: string | null
          system_order_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_phone_e164?: string | null
          data?: Json
          external_order_id?: string | null
          id?: string
          needs_attention?: boolean | null
          notes?: string[] | null
          schema_version?: number
          source?: string | null
          status?: string | null
          system_order_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_packs: {
        Row: {
          created_at: string | null
          few_shots: Json | null
          id: string
          name: string
          system_prompt: string
          tenant_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          few_shots?: Json | null
          id?: string
          name: string
          system_prompt: string
          tenant_id: string
          updated_at?: string | null
          version: number
        }
        Update: {
          created_at?: string | null
          few_shots?: Json | null
          id?: string
          name?: string
          system_prompt?: string
          tenant_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_packs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          ai_mode: string | null
          created_at: string | null
          id: string
          openai_api_key_encrypted: string | null
          sis_counter: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_mode?: string | null
          created_at?: string | null
          id?: string
          openai_api_key_encrypted?: string | null
          sis_counter?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_mode?: string | null
          created_at?: string | null
          id?: string
          openai_api_key_encrypted?: string | null
          sis_counter?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          subdomain: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          subdomain?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          subdomain?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      timers: {
        Row: {
          created_at: string | null
          fire_at: string
          fired_at: string | null
          id: string
          purpose: string
          status: string | null
          tenant_id: string
          workflow_run_id: string
        }
        Insert: {
          created_at?: string | null
          fire_at: string
          fired_at?: string | null
          id?: string
          purpose: string
          status?: string | null
          tenant_id: string
          workflow_run_id: string
        }
        Update: {
          created_at?: string | null
          fire_at?: string
          fired_at?: string | null
          id?: string
          purpose?: string
          status?: string | null
          tenant_id?: string
          workflow_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timers_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_registry: {
        Row: {
          created_at: string | null
          id: string
          is_built_in: boolean | null
          name: string
          spec: Json
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_built_in?: boolean | null
          name: string
          spec: Json
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_built_in?: boolean | null
          name?: string
          spec?: Json
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_registry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          trigger_conditions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          trigger_conditions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          trigger_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          context: Json | null
          conversation_id: string | null
          current_state: string
          error_message: string | null
          id: string
          order_id: string | null
          started_at: string | null
          status: string | null
          tenant_id: string
          workflow_version_id: string
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          current_state?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          workflow_version_id: string
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          current_state?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_versions: {
        Row: {
          created_at: string | null
          definition: Json
          id: string
          is_published: boolean | null
          version: number
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          definition: Json
          id?: string
          is_published?: boolean | null
          version: number
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          definition?: Json
          id?: string
          is_published?: boolean | null
          version?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_increment_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_sis_counter: {
        Args: { p_tenant_id: string }
        Returns: number
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
    Enums: {},
  },
} as const
