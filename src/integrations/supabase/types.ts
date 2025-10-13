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
      contact_conversions: {
        Row: {
          contact_id: string
          converted_at: string | null
          converted_by: string | null
          from_status: Database["public"]["Enums"]["contact_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["contact_status"]
        }
        Insert: {
          contact_id: string
          converted_at?: string | null
          converted_by?: string | null
          from_status?: Database["public"]["Enums"]["contact_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["contact_status"]
        }
        Update: {
          contact_id?: string
          converted_at?: string | null
          converted_by?: string | null
          from_status?: Database["public"]["Enums"]["contact_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["contact_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_conversions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          communication_method:
            | Database["public"]["Enums"]["communication_method"]
            | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          communication_method?:
            | Database["public"]["Enums"]["communication_method"]
            | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          communication_method?:
            | Database["public"]["Enums"]["communication_method"]
            | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email_verified: boolean | null
          first_name: string
          id: string
          last_name: string
          phone_number: string
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          phone_verified: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email_verified?: boolean | null
          first_name: string
          id: string
          last_name: string
          phone_number: string
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          phone_verified?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email_verified?: boolean | null
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          phone_verified?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string | null
          reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      status_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          comment: string | null
          contact_id: string
          id: string
          new_status: Database["public"]["Enums"]["contact_status"]
          old_status: Database["public"]["Enums"]["contact_status"] | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          comment?: string | null
          contact_id: string
          id?: string
          new_status: Database["public"]["Enums"]["contact_status"]
          old_status?: Database["public"]["Enums"]["contact_status"] | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          comment?: string | null
          contact_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["contact_status"]
          old_status?: Database["public"]["Enums"]["contact_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      communication_method: "email" | "phone" | "both"
      contact_status: "new" | "in_progress" | "on_hold" | "resolved" | "closed"
      verification_status: "pending" | "verified" | "failed"
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
      app_role: ["super_admin", "admin", "user"],
      communication_method: ["email", "phone", "both"],
      contact_status: ["new", "in_progress", "on_hold", "resolved", "closed"],
      verification_status: ["pending", "verified", "failed"],
    },
  },
} as const
