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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      shipments: {
        Row: {
          schedule: string | null
          units_pallets: number | null
          batch_number: string | null
          cargo_category: Database["public"]["Enums"]["cargo_category_enum"]
          cargo_kg: number
          created_at: string
          destination_location: string | null
          duration_hours: number
          hs_code: string | null
          ice_remaining_kg: number | null
          ice_type: string | null
          id: number
          is_planned: boolean | null
          melt_rate_kg_per_hr: number | null
          notes: string | null
          origin_location: string | null
          pallets: number | null
          recommended_ice_kg: number | null
          safe_duration_hours: number | null
          scheduled_delivery_at: string | null
          scheduled_pickup_at: string | null
          shipment_name: string
          status: Database["public"]["Enums"]["trip_status_enum"]
          supplier_country: string | null
          supplier_name: string | null
          target_temp_max_c: number | null
          target_temp_min_c: number | null
          trip_id: number | null
          units: number | null
        }
        Insert: {
          batch_number?: string | null
          cargo_category: Database["public"]["Enums"]["cargo_category_enum"]
          cargo_kg: number
          created_at?: string
          destination_location?: string | null
          duration_hours: number
          hs_code?: string | null
          ice_remaining_kg?: number | null
          ice_type?: string | null
          id?: number
          is_planned?: boolean | null
          melt_rate_kg_per_hr?: number | null
          notes?: string | null
          origin_location?: string | null
          pallets?: number | null
          recommended_ice_kg?: number | null
          safe_duration_hours?: number | null
          schedule?: string | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          shipment_name: string
          status?: Database["public"]["Enums"]["trip_status_enum"]
          supplier_country?: string | null
          supplier_name?: string | null
          target_temp_max_c?: number | null
          target_temp_min_c?: number | null
          trip_id?: number | null
          units?: number | null
          units_pallets?: number | null
        }
        Update: {
          batch_number?: string | null
          cargo_category?: Database["public"]["Enums"]["cargo_category_enum"]
          cargo_kg?: number
          created_at?: string
          destination_location?: string | null
          duration_hours?: number
          hs_code?: string | null
          ice_remaining_kg?: number | null
          ice_type?: string | null
          id?: number
          is_planned?: boolean | null
          melt_rate_kg_per_hr?: number | null
          notes?: string | null
          origin_location?: string | null
          pallets?: number | null
          recommended_ice_kg?: number | null
          safe_duration_hours?: number | null
          schedule?: string | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          shipment_name?: string
          status?: Database["public"]["Enums"]["trip_status_enum"]
          supplier_country?: string | null
          supplier_name?: string | null
          target_temp_max_c?: number | null
          target_temp_min_c?: number | null
          trip_id?: number | null
          units?: number | null
          units_pallets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trip"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          completed_at: string | null
          created_at: string
          id: number
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status_enum"]
          trip_name: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status_enum"]
          trip_name?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status_enum"]
          trip_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cargo_category_enum:
        | "meat"
        | "fish_aquaculture"
        | "dairy"
        | "fruits_vegetables"
        | "other_food"
        | "pharma"
        | "electronics"
        | "cosmetics"
        | "agricultural_products"
      trip_status_enum: "planned" | "active" | "completed" | "cancelled"
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
      cargo_category_enum: [
        "meat",
        "fish_aquaculture",
        "dairy",
        "fruits_vegetables",
        "other_food",
        "pharma",
        "electronics",
        "cosmetics",
        "agricultural_products",
      ],
      trip_status_enum: ["planned", "active", "completed", "cancelled"],
    },
  },
} as const