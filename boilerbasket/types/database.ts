// Auto-generate this file with: npm run db:generate-types
// Manual scaffold provided here — regenerate after running migrations.

export type OrderStatus = "open" | "claimed" | "picked_up" | "delivered" | "cancelled";
export type RevieweeRole = "requester" | "picker";
export type PaymentStatus =
  | "pending"
  | "held"
  | "captured"
  | "released"
  | "refunded";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          purdue_id: string | null;
          avatar_url: string | null;
          rating_as_requester: number | null;
          rating_as_picker: number | null;
          review_count_requester: number;
          review_count_picker: number;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          purdue_id?: string | null;
          avatar_url?: string | null;
          rating_as_requester?: number | null;
          rating_as_picker?: number | null;
          review_count_requester?: number;
          review_count_picker?: number;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          purdue_id?: string | null;
          avatar_url?: string | null;
          rating_as_requester?: number | null;
          rating_as_picker?: number | null;
          review_count_requester?: number;
          review_count_picker?: number;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          requester_id: string;
          picker_id: string | null;
          dining_hall: string;
          items: string;
          dropoff_building: string;
          notes: string | null;
          meal_cost: number;
          convenience_fee: number;
          total_charge: number;           // generated column
          payment_intent_id: string | null;
          payment_status: PaymentStatus;
          payout_transfer_id: string | null;
          status: OrderStatus;
          claimed_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          picker_id?: string | null;
          dining_hall: string;
          items: string;
          dropoff_building: string;
          notes?: string | null;
          meal_cost: number;
          convenience_fee: number;
          payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          payout_transfer_id?: string | null;
          status?: OrderStatus;
          claimed_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string;
          picker_id?: string | null;
          dining_hall?: string;
          items?: string;
          dropoff_building?: string;
          notes?: string | null;
          meal_cost?: number;
          convenience_fee?: number;
          payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          payout_transfer_id?: string | null;
          status?: OrderStatus;
          claimed_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          reviewer_id: string;
          reviewee_id: string;
          reviewee_role: RevieweeRole;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          reviewer_id: string;
          reviewee_id: string;
          reviewee_role: RevieweeRole;
          rating: number;
          comment?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          reviewee_role?: RevieweeRole;
          rating?: number;
          comment?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      order_status: string[];
      reviewee_role: string[];
    };
  };
}

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
