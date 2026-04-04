// Auto-generate this file with: npm run db:generate-types
// Manual scaffold provided here — regenerate after running migrations.

export type OrderStatus = "open" | "claimed" | "picked_up" | "delivered" | "cancelled";
export type RevieweeRole = "requester" | "picker";

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
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at" | "review_count_requester" | "review_count_picker" | "stripe_onboarding_complete"> & {
          review_count_requester?: number;
          review_count_picker?: number;
          stripe_onboarding_complete?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
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
          payment_status: string;
          payout_transfer_id: string | null;
          status: OrderStatus;
          claimed_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "total_charge" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      order_status: OrderStatus;
      reviewee_role: RevieweeRole;
    };
  };
}

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
