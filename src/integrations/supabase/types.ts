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
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          student_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          student_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          id: string
          message: string
          target: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          target?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          target?: string
          title?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          attachments: string[] | null
          category: Database["public"]["Enums"]["category"]
          close_requested: boolean | null
          closed_at: string | null
          created_at: string
          custom_category_text: string | null
          description: string
          id: string
          is_anonymous: boolean
          priority: Database["public"]["Enums"]["priority"]
          satisfaction: Database["public"]["Enums"]["satisfaction"] | null
          status: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          student_name_cached: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          category: Database["public"]["Enums"]["category"]
          close_requested?: boolean | null
          closed_at?: string | null
          created_at?: string
          custom_category_text?: string | null
          description: string
          id?: string
          is_anonymous?: boolean
          priority?: Database["public"]["Enums"]["priority"]
          satisfaction?: Database["public"]["Enums"]["satisfaction"] | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          student_name_cached: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          category?: Database["public"]["Enums"]["category"]
          close_requested?: boolean | null
          closed_at?: string | null
          created_at?: string
          custom_category_text?: string | null
          description?: string
          id?: string
          is_anonymous?: boolean
          priority?: Database["public"]["Enums"]["priority"]
          satisfaction?: Database["public"]["Enums"]["satisfaction"] | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string
          student_name_cached?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          batch_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          learning_track: Database["public"]["Enums"]["learning_track"] | null
          location: Database["public"]["Enums"]["location"] | null
          mode: Database["public"]["Enums"]["mode"] | null
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          batch_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          learning_track?: Database["public"]["Enums"]["learning_track"] | null
          location?: Database["public"]["Enums"]["location"] | null
          mode?: Database["public"]["Enums"]["mode"] | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          batch_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          learning_track?: Database["public"]["Enums"]["learning_track"] | null
          location?: Database["public"]["Enums"]["location"] | null
          mode?: Database["public"]["Enums"]["mode"] | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      resolution_notes: {
        Row: {
          admin_id: string
          attachments: string[] | null
          complaint_id: string
          created_at: string
          id: string
          message: string
          type: Database["public"]["Enums"]["note_type"]
        }
        Insert: {
          admin_id: string
          attachments?: string[] | null
          complaint_id: string
          created_at?: string
          id?: string
          message: string
          type?: Database["public"]["Enums"]["note_type"]
        }
        Update: {
          admin_id?: string
          attachments?: string[] | null
          complaint_id?: string
          created_at?: string
          id?: string
          message?: string
          type?: Database["public"]["Enums"]["note_type"]
        }
        Relationships: [
          {
            foreignKeyName: "resolution_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_notes_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_escalation: { Args: never; Returns: undefined }
      detect_priority: {
        Args: { description: string }
        Returns: Database["public"]["Enums"]["priority"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student"
      category:
        | "Hostel / Accommodation"
        | "Mentor Behavior / Staff Attitude"
        | "Curriculum / Teaching"
        | "Batch Management"
        | "Laptop / Lab / Internet / Wi-Fi Issue"
        | "Payment / Finance"
        | "Food / Canteen"
        | "Mental Health / Harassment / Bullying"
        | "Miscommunication / Misleading Information"
        | "Personal Safety"
        | "Other"
      complaint_status:
        | "Pending"
        | "In Progress"
        | "Resolved"
        | "Closed"
        | "Escalated"
      learning_track:
        | "Web Dev"
        | "Mobile"
        | "Cybersecurity"
        | "AI"
        | "Game Dev"
        | "Blockchain"
        | "Data Science"
        | "AR/VR"
        | "Software Testing"
        | "DevOps"
      location:
        | "Kochi"
        | "Calicut"
        | "Trivandrum"
        | "Bangalore"
        | "Coimbatore"
        | "Chennai"
        | "Other"
      mode: "Offline" | "Online"
      note_type:
        | "public"
        | "internal"
        | "clarification_request"
        | "close_request"
      priority: "Critical" | "Urgent" | "Normal"
      satisfaction: "satisfied" | "unsatisfied"
      user_role: "student" | "admin"
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
      app_role: ["admin", "student"],
      category: [
        "Hostel / Accommodation",
        "Mentor Behavior / Staff Attitude",
        "Curriculum / Teaching",
        "Batch Management",
        "Laptop / Lab / Internet / Wi-Fi Issue",
        "Payment / Finance",
        "Food / Canteen",
        "Mental Health / Harassment / Bullying",
        "Miscommunication / Misleading Information",
        "Personal Safety",
        "Other",
      ],
      complaint_status: [
        "Pending",
        "In Progress",
        "Resolved",
        "Closed",
        "Escalated",
      ],
      learning_track: [
        "Web Dev",
        "Mobile",
        "Cybersecurity",
        "AI",
        "Game Dev",
        "Blockchain",
        "Data Science",
        "AR/VR",
        "Software Testing",
        "DevOps",
      ],
      location: [
        "Kochi",
        "Calicut",
        "Trivandrum",
        "Bangalore",
        "Coimbatore",
        "Chennai",
        "Other",
      ],
      mode: ["Offline", "Online"],
      note_type: [
        "public",
        "internal",
        "clarification_request",
        "close_request",
      ],
      priority: ["Critical", "Urgent", "Normal"],
      satisfaction: ["satisfied", "unsatisfied"],
      user_role: ["student", "admin"],
    },
  },
} as const
