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
      applications: {
        Row: {
          batch: string
          college_office_comment: string | null
          college_office_verified: boolean | null
          created_at: string | null
          department: Database["public"]["Enums"]["department"]
          faculty_comment: string | null
          faculty_verified: boolean | null
          hod_comment: string | null
          hod_verified: boolean | null
          hostel_comment: string | null
          hostel_verified: boolean | null
          id: string
          lab_comment: string | null
          lab_verified: boolean | null
          library_comment: string | null
          library_verified: boolean | null
          payment_comment: string | null
          payment_verified: boolean | null
          semester: number
          status: string | null
          student_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          batch: string
          college_office_comment?: string | null
          college_office_verified?: boolean | null
          created_at?: string | null
          department: Database["public"]["Enums"]["department"]
          faculty_comment?: string | null
          faculty_verified?: boolean | null
          hod_comment?: string | null
          hod_verified?: boolean | null
          hostel_comment?: string | null
          hostel_verified?: boolean | null
          id?: string
          lab_comment?: string | null
          lab_verified?: boolean | null
          library_comment?: string | null
          library_verified?: boolean | null
          payment_comment?: string | null
          payment_verified?: boolean | null
          semester: number
          status?: string | null
          student_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          batch?: string
          college_office_comment?: string | null
          college_office_verified?: boolean | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          faculty_comment?: string | null
          faculty_verified?: boolean | null
          hod_comment?: string | null
          hod_verified?: boolean | null
          hostel_comment?: string | null
          hostel_verified?: boolean | null
          id?: string
          lab_comment?: string | null
          lab_verified?: boolean | null
          library_comment?: string | null
          library_verified?: boolean | null
          payment_comment?: string | null
          payment_verified?: boolean | null
          semester?: number
          status?: string | null
          student_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          created_at: string | null
          current_semester: number | null
          end_year: number
          id: string
          name: string
          start_year: number
        }
        Insert: {
          created_at?: string | null
          current_semester?: number | null
          end_year: number
          id?: string
          name: string
          start_year: number
        }
        Update: {
          created_at?: string | null
          current_semester?: number | null
          end_year?: number
          id?: string
          name?: string
          start_year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          batch: string | null
          created_at: string | null
          department: Database["public"]["Enums"]["department"] | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo: string | null
          profile_completed: boolean | null
          section: Database["public"]["Enums"]["section"] | null
          semester: number | null
          student_type: Database["public"]["Enums"]["student_type"] | null
          updated_at: string | null
          usn: string | null
        }
        Insert: {
          batch?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          email?: string | null
          id: string
          name: string
          phone?: string | null
          photo?: string | null
          profile_completed?: boolean | null
          section?: Database["public"]["Enums"]["section"] | null
          semester?: number | null
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string | null
          usn?: string | null
        }
        Update: {
          batch?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo?: string | null
          profile_completed?: boolean | null
          section?: Database["public"]["Enums"]["section"] | null
          semester?: number | null
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string | null
          usn?: string | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          date_of_joining: string | null
          department: Database["public"]["Enums"]["department"] | null
          designation: string | null
          email: string
          employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          office_location: string | null
          phone: string | null
          photo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_joining?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          designation?: string | null
          email: string
          employee_id?: string | null
          id: string
          is_active?: boolean | null
          name: string
          office_location?: string | null
          phone?: string | null
          photo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_joining?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          designation?: string | null
          email?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          office_location?: string | null
          phone?: string | null
          photo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          department: Database["public"]["Enums"]["department"]
          id: string
          is_elective: boolean | null
          name: string
          semester: number
        }
        Insert: {
          code: string
          created_at?: string | null
          department: Database["public"]["Enums"]["department"]
          id?: string
          is_elective?: boolean | null
          name: string
          semester: number
        }
        Update: {
          code?: string
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          id?: string
          is_elective?: boolean | null
          name?: string
          semester?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_audit_log: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_message: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
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
      app_role:
        | "admin"
        | "student"
        | "faculty"
        | "library"
        | "hostel"
        | "college_office"
        | "hod"
        | "lab_instructor"
      department: "MECH" | "CSE" | "CIVIL" | "EC" | "AIML" | "CD"
      section: "A" | "B"
      student_type: "local" | "hostel"
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
      app_role: [
        "admin",
        "student",
        "faculty",
        "library",
        "hostel",
        "college_office",
        "hod",
        "lab_instructor",
      ],
      department: ["MECH", "CSE", "CIVIL", "EC", "AIML", "CD"],
      section: ["A", "B"],
      student_type: ["local", "hostel"],
    },
  },
} as const
