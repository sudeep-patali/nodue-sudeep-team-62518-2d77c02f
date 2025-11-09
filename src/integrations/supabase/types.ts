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
      application_subject_faculty: {
        Row: {
          application_id: string
          created_at: string | null
          faculty_comment: string | null
          faculty_id: string
          faculty_verified: boolean | null
          id: string
          subject_id: string
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          faculty_comment?: string | null
          faculty_id: string
          faculty_verified?: boolean | null
          id?: string
          subject_id: string
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          faculty_comment?: string | null
          faculty_id?: string
          faculty_verified?: boolean | null
          id?: string
          subject_id?: string
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_subject_faculty_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_subject_faculty_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_subject_faculty_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_subject_faculty_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          batch: string
          class_advisor_comment: string | null
          class_advisor_verified: boolean | null
          class_advisor_verified_at: string | null
          college_office_comment: string | null
          college_office_verified: boolean | null
          counsellor_comment: string | null
          counsellor_verified: boolean | null
          counsellor_verified_at: string | null
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
          class_advisor_comment?: string | null
          class_advisor_verified?: boolean | null
          class_advisor_verified_at?: string | null
          college_office_comment?: string | null
          college_office_verified?: boolean | null
          counsellor_comment?: string | null
          counsellor_verified?: boolean | null
          counsellor_verified_at?: string | null
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
          class_advisor_comment?: string | null
          class_advisor_verified?: boolean | null
          class_advisor_verified_at?: string | null
          college_office_comment?: string | null
          college_office_verified?: boolean | null
          counsellor_comment?: string | null
          counsellor_verified?: boolean | null
          counsellor_verified_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      batch_submission_settings: {
        Row: {
          batch_name: string
          enabled: boolean
          id: string
          scheduled_end: string | null
          scheduled_start: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          batch_name: string
          enabled?: boolean
          id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          batch_name?: string
          enabled?: boolean
          id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_batch"
            columns: ["batch_name"]
            isOneToOne: true
            referencedRelation: "batches"
            referencedColumns: ["name"]
          },
        ]
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
      global_submission_settings: {
        Row: {
          enabled: boolean
          id: string
          scheduled_end: string | null
          scheduled_start: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          password_change_required: boolean | null
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
          password_change_required?: boolean | null
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
          password_change_required?: boolean | null
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
          password_change_required: boolean | null
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
          password_change_required?: boolean | null
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
          password_change_required?: boolean | null
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
      faculty_public: {
        Row: {
          department: Database["public"]["Enums"]["department"] | null
          designation: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          department?: Database["public"]["Enums"]["department"] | null
          designation?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          department?: Database["public"]["Enums"]["department"] | null
          designation?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_submission_allowed: {
        Args: { p_batch_name: string }
        Returns: boolean
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      create_bulk_notifications: {
        Args: { notifications: Json }
        Returns: undefined
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
      get_users_by_role: {
        Args: { role_name: Database["public"]["Enums"]["app_role"] }
        Returns: {
          user_id: string
        }[]
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
        | "counsellor"
        | "class_advisor"
      department: "MECH" | "CSE" | "CIVIL" | "EC" | "AIML" | "CD"
      section: "A" | "B"
      student_type: "local" | "hostel"
      verification_status: "pending" | "approved" | "rejected"
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
        "counsellor",
        "class_advisor",
      ],
      department: ["MECH", "CSE", "CIVIL", "EC", "AIML", "CD"],
      section: ["A", "B"],
      student_type: ["local", "hostel"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
