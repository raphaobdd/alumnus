/**
 * Tipos TypeScript derivados do schema do banco de dados Supabase.
 * Em projetos maiores, gere este arquivo com: npx supabase gen types typescript
 *
 * IMPORTANTE: O tipo Database deve implementar a interface GenericDatabase
 * do @supabase/supabase-js, incluindo Views, Functions, Enums, CompositeTypes
 * e Relationships por tabela, para que a inferência de tipos funcione corretamente.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string | null;
          professor: string | null;
          workload: number | null;
          max_absences: number | null;
          color: string;
          semester: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code?: string | null;
          professor?: string | null;
          workload?: number | null;
          max_absences?: number | null;
          color?: string;
          semester?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          code?: string | null;
          professor?: string | null;
          workload?: number | null;
          max_absences?: number | null;
          color?: string;
          semester?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          title: string;
          value: number;
          weight: number;
          period: string | null;
          exam_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          title: string;
          value: number;
          weight?: number;
          period?: string | null;
          exam_date?: string | null;
          notes?: string | null;
        };
        Update: {
          title?: string;
          value?: number;
          weight?: number;
          period?: string | null;
          exam_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grades_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          status: "pending" | "in_progress" | "done";
          priority: "low" | "medium" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "in_progress" | "done";
          priority?: "low" | "medium" | "high";
        };
        Update: {
          subject_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "in_progress" | "done";
          priority?: "low" | "medium" | "high";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          date: string;
          present: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          date: string;
          present?: boolean;
          notes?: string | null;
        };
        Update: {
          present?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      schedule: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          room: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          room?: string | null;
        };
        Update: {
          subject_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          room?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity: string;
          entity_id?: string | null;
          metadata?: Json | null;
        };
        // Audit logs are immutable — no updates allowed
        Update: {
          id?: string;
        };
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          user_id: string;
          report_date: string;
          signals_snapshot: Json;
          report_text: string;
          risk_level: "none" | "attention" | "high";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_date: string;
          signals_snapshot: Json;
          report_text: string;
          risk_level?: "none" | "attention" | "high";
          created_at?: string;
        };
        Update: {
          report_date?: string;
          signals_snapshot?: Json;
          report_text?: string;
          risk_level?: "none" | "attention" | "high";
        };
        Relationships: [];
      };
      important_dates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          category: "prova" | "entrega" | "evento" | "administrativo" | "outro";
          subject_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          category?: "prova" | "entrega" | "evento" | "administrativo" | "outro";
          subject_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_date?: string;
          category?: "prova" | "entrega" | "evento" | "administrativo" | "outro";
          subject_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "important_dates_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Aliases convenientes
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Grade = Database["public"]["Tables"]["grades"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedule"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
export type ImportantDate = Database["public"]["Tables"]["important_dates"]["Row"];

// Tipos de insert
export type InsertSubject = Database["public"]["Tables"]["subjects"]["Insert"];
export type InsertGrade = Database["public"]["Tables"]["grades"]["Insert"];
export type InsertTask = Database["public"]["Tables"]["tasks"]["Insert"];
export type InsertAttendance = Database["public"]["Tables"]["attendance"]["Insert"];
export type InsertSchedule = Database["public"]["Tables"]["schedule"]["Insert"];
export type InsertDailyReport = Database["public"]["Tables"]["daily_reports"]["Insert"];
export type InsertImportantDate = Database["public"]["Tables"]["important_dates"]["Insert"];

// Subject com stats calculados (join)
export type SubjectWithStats = Subject & {
  averageGrade: number | null;
  totalAbsences: number;
  attendancePercentage: number | null;
  absencesRemaining: number | null;
};

// Task com nome da matéria
export type TaskWithSubject = Task & {
  subjects: Pick<Subject, "name" | "color"> | null;
};

// Grade com nome da matéria
export type GradeWithSubject = Grade & {
  subjects: Pick<Subject, "name" | "color">;
};

// Schedule com dados da matéria
export type ScheduleWithSubject = Schedule & {
  subjects: Pick<Subject, "name" | "color" | "professor">;
};

// ImportantDate com nome da matéria
export type ImportantDateWithSubject = ImportantDate & {
  subjects: Pick<Subject, "name" | "color"> | null;
};

