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
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category_slug: string;
          short_description: string;
          description: string;
          wood_types: string[];
          dimensions: string | null;
          price_note: string | null;
          image_urls: string[];
          featured: boolean;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category_slug: string;
          short_description: string;
          description?: string;
          wood_types?: string[];
          dimensions?: string | null;
          price_note?: string | null;
          image_urls?: string[];
          featured?: boolean;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          category_slug?: string;
          short_description?: string;
          description?: string;
          wood_types?: string[];
          dimensions?: string | null;
          price_note?: string | null;
          image_urls?: string[];
          featured?: boolean;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          phone: string;
          city: string | null;
          category_slug: string | null;
          product_id: string | null;
          product_name: string | null;
          wood_type: string | null;
          message: string;
          source_path: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          city?: string | null;
          category_slug?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          wood_type?: string | null;
          message: string;
          source_path?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          type: string;
          phone: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_no: number;
          client_id: string;
          site_label: string | null;
          title: string;
          description: string;
          delivery_address: string | null;
          contact_phone: string | null;
          total_amount: number;
          order_date: string;
          expected_date: string | null;
          status: string;
          image_paths: string[];
          notes: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no?: number;
          client_id: string;
          site_label?: string | null;
          title: string;
          description?: string;
          delivery_address?: string | null;
          contact_phone?: string | null;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          status?: string;
          image_paths?: string[];
          notes?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          site_label?: string | null;
          title?: string;
          description?: string;
          delivery_address?: string | null;
          contact_phone?: string | null;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          status?: string;
          image_paths?: string[];
          notes?: string | null;
          reminder_sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      order_payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          paid_on: string;
          method: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          paid_on?: string;
          method?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          paid_on?: string;
          method?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          spent_on: string;
          category: string;
          amount: number;
          note: string | null;
          order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          spent_on?: string;
          category: string;
          amount: number;
          note?: string | null;
          order_id?: string | null;
          created_at?: string;
        };
        Update: {
          spent_on?: string;
          category?: string;
          amount?: number;
          note?: string | null;
          order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          label?: string | null;
          created_at?: string;
        };
        Update: {
          label?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderPayment = Database["public"]["Tables"]["order_payments"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];
