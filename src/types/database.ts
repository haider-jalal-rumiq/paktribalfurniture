export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderItem = { id: string; name: string; quantity: number; status: string; notes: string };
export type InvoiceItem = { id: string; item: string; quantity: number; amount: number; source: string };
export type BalanceEntry = { id: string; received_on: string; amount: number; note: string; created_at: string };
export type LabourEntry = {
  id: string; name: string; period: string; paid_on: string;
  pay_basis: "monthly" | "daily" | "per_item"; salary: number;
  per_day_salary: number; days_worked: number; item_count: number; item_rate: number;
  ot_hours: number; ot_rate: number; deduction: number;
  total_amount: number; advance: number; salary_paid: number; leaves: number;
  notes: string | null; created_at: string; updated_at: string;
};
export type Invoice = {
  id: string; invoice_no: number; client_id: string; client_name: string;
  client_address: string | null; client_phone: string | null; issued_on: string;
  items: InvoiceItem[]; total_amount: number; notes: string | null;
  status: "issued" | "void"; created_at: string; updated_at: string;
};
export type ShopSale = {
  id: string; sale_no: number; sold_on: string; name: string;
  quantity: number; sale_price: number;
  /** Null while the row is a draft awaiting its purchase price. */
  cost: number | null;
  /** How a manual row was priced. Null on invoice-drafted rows. */
  margin_pct: number | null; discount_pct: number | null;
  invoice_id: string | null; returned_on: string | null; note: string | null;
  created_at: string; updated_at: string;
};
export type ShopExpense = {
  id: string; spent_on: string; category: string; amount: number;
  note: string | null; created_at: string;
};
export type ShopInvoice = {
  id: string; invoice_no: number; customer_name: string; customer_phone: string | null;
  customer_address: string | null; issued_on: string; items: InvoiceItem[];
  discount_pct: number;
  /** Generated in SQL: line subtotal less the discount percentage. */
  total_amount: number; notes: string | null; status: "issued" | "void";
  created_at: string; updated_at: string;
};
type TableShape<Row, Required extends keyof Row> = {
  Row: Row; Insert: Partial<Row> & Pick<Row, Required>; Update: Partial<Row>; Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      balance_entries: TableShape<BalanceEntry, "amount" | "note">;
      shop_sales: TableShape<ShopSale, "name" | "sale_price">;
      shop_expenses: TableShape<ShopExpense, "category" | "amount">;
      shop_invoices: {
        Row: ShopInvoice;
        Insert: Omit<Partial<ShopInvoice>, "total_amount"> & Pick<ShopInvoice, "customer_name" | "items">;
        Update: Omit<Partial<ShopInvoice>, "total_amount" | "invoice_no">;
        Relationships: [];
      };
      labour_entries: TableShape<LabourEntry, "name" | "period" | "salary" | "total_amount">;
      invoices: {
        Row: Invoice;
        Insert: Omit<Partial<Invoice>, "total_amount"> & Pick<Invoice, "client_id" | "client_name" | "items">;
        Update: Omit<Partial<Invoice>, "total_amount" | "invoice_no">;
        Relationships: [{
          foreignKeyName: "invoices_client_id_fkey"; columns: ["client_id"]; isOneToOne: false;
          referencedRelation: "clients"; referencedColumns: ["id"];
        }];
      };
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
          items: OrderItem[];
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
          urgent: boolean;
          image_paths: string[];
          notes: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          items?: OrderItem[];
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
          urgent?: boolean;
          image_paths?: string[];
          notes?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          items?: OrderItem[];
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
          urgent?: boolean;
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
    Functions: {
      cms_financial_totals: { Args: Record<string, never>; Returns: Json };
    };
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
