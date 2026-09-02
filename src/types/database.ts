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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
