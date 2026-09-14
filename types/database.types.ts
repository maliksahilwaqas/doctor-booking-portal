// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript` once a project is linked, and keep this
// file in sync if you edit the migrations by hand.

import type { AccentName } from "@/lib/calc/accents";

export type StaffRole = "reception" | "doctor" | "admin" | "store";
export type SessionName = "morning" | "evening";
export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";
export type QueueStatus = "waiting" | "checked_in" | "in_room" | "done";
export type SessionLabelStyle = "morning_evening" | "am_pm" | "numbered";
export type LocationTerm = "hospital" | "clinic" | "branch";
export type CurrencyCode = "PKR" | "AED" | "USD";

export interface PrescriptionItem {
  name: string;
  morning: boolean;
  night: boolean;
}

export interface Database {
  public: {
    Tables: {
      doctor_profile: {
        Row: {
          id: boolean;
          name: string;
          speciality: string;
          quals: string;
          phone: string;
          clinic_name: string;
          address: string;
          accent: AccentName;
          session_labels: SessionLabelStyle;
          location_term: LocationTerm;
          currency: CurrencyCode;
          booking_window_days: number;
          overbook_per_session: number;
          allowed_slot_minutes: number[];
          off_days: number[];
          feat_pay: boolean;
          feat_sms: boolean;
          feat_video: boolean;
          feat_cancel: boolean;
          feat_doctor_settings: boolean;
          feat_queue_screen: boolean;
          feat_prescriptions: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["doctor_profile"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["doctor_profile"]["Row"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: StaffRole;
          created_at: string;
        };
        Insert: { id: string; full_name: string; email: string; role: StaffRole };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          area: string;
          session: SessionName;
          days: number[];
          from_min: number;
          to_min: number;
          slot_min: number;
          fee: number;
          follow_up_fee: number;
          detail: string;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["locations"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          location_id: string;
          visit_date: string;
          token_number: number;
          status: BookingStatus;
          patient_name: string;
          patient_phone: string;
          is_follow_up: boolean;
          fee: number;
          checked_in: boolean;
          paid: boolean;
          queue_status: QueueStatus;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "status" | "is_follow_up" | "checked_in" | "paid" | "queue_status"
        > & {
          id?: string;
          status?: BookingStatus;
          is_follow_up?: boolean;
          checked_in?: boolean;
          paid?: boolean;
          queue_status?: QueueStatus;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          booking_id: string;
          items: PrescriptionItem[];
          notes: string;
          follow_up_days: number | null;
          dispensed: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prescriptions"]["Row"], "id" | "created_at" | "dispensed"> & {
          id?: string;
          dispensed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      token_availability: {
        Row: {
          location_id: string;
          visit_date: string;
          token_number: number;
          status: BookingStatus;
        };
        Relationships: [];
      };
      now_serving_public: {
        Row: {
          location_id: string;
          visit_date: string;
          token_number: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
