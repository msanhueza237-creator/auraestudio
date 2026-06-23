export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          business_name: string | null
          phone: string | null
          hourly_cost: number
          currency: string
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          hourly_cost?: number
          currency?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          hourly_cost?: number
          currency?: string
          locale?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          email: string | null
          birth_date: string | null
          notes: string | null
          preferences: string | null
          alerts: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone?: string | null
          email?: string | null
          birth_date?: string | null
          notes?: string | null
          preferences?: string | null
          alerts?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          birth_date?: string | null
          notes?: string | null
          preferences?: string | null
          alerts?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          description: string | null
          base_price: number
          estimated_minutes: number
          estimated_labor_cost: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string | null
          description?: string | null
          base_price?: number
          estimated_minutes?: number
          estimated_labor_cost?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string | null
          description?: string | null
          base_price?: number
          estimated_minutes?: number
          estimated_labor_cost?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string | null
          category: string | null
          sku: string | null
          unit: string
          unit_cost: number
          current_stock: number
          minimum_stock: number
          supplier: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand?: string | null
          category?: string | null
          sku?: string | null
          unit?: string
          unit_cost?: number
          current_stock?: number
          minimum_stock?: number
          supplier?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand?: string | null
          category?: string | null
          sku?: string | null
          unit?: string
          unit_cost?: number
          current_stock?: number
          minimum_stock?: number
          supplier?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          starts_at: string
          ends_at: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          title: string | null
          notes: string | null
          total_price: number
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          starts_at: string
          ends_at: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          title?: string | null
          notes?: string | null
          total_price?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          starts_at?: string
          ends_at?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          title?: string | null
          notes?: string | null
          total_price?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      appointment_services: {
        Row: {
          id: string
          user_id: string
          appointment_id: string
          service_id: string | null
          service_name: string
          price_charged: number
          minutes_spent: number
          labor_cost: number
          product_cost: number
          total_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          appointment_id: string
          service_id?: string | null
          service_name: string
          price_charged?: number
          minutes_spent?: number
          labor_cost?: number
          product_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          appointment_id?: string
          service_id?: string | null
          service_name?: string
          price_charged?: number
          minutes_spent?: number
          labor_cost?: number
          product_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_product_usage: {
        Row: {
          id: string
          user_id: string
          appointment_service_id: string
          product_id: string | null
          product_name: string
          quantity_used: number
          unit: string
          unit_cost_at_usage: number
          total_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          appointment_service_id: string
          product_id?: string | null
          product_name: string
          quantity_used: number
          unit: string
          unit_cost_at_usage?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          appointment_service_id?: string
          product_id?: string | null
          product_name?: string
          quantity_used?: number
          unit?: string
          unit_cost_at_usage?: number
          created_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          user_id: string
          product_id: string
          movement_type: 'purchase' | 'usage' | 'adjustment' | 'return' | 'waste'
          quantity: number
          unit_cost: number | null
          reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          movement_type: 'purchase' | 'usage' | 'adjustment' | 'return' | 'waste'
          quantity: number
          unit_cost?: number | null
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          movement_type?: 'purchase' | 'usage' | 'adjustment' | 'return' | 'waste'
          quantity?: number
          unit_cost?: number | null
          reference?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          appointment_id: string | null
          appointment_service_id: string | null
          description: string | null
          minutes_spent: number
          hourly_cost: number
          total_cost: number
          entry_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          appointment_id?: string | null
          appointment_service_id?: string | null
          description?: string | null
          minutes_spent: number
          hourly_cost?: number
          entry_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          appointment_id?: string | null
          appointment_service_id?: string | null
          description?: string | null
          minutes_spent?: number
          hourly_cost?: number
          entry_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      dashboard_service_summary: {
        Row: {
          user_id: string | null
          month: string | null
          appointments_count: number | null
          revenue: number | null
          cost: number | null
          margin: number | null
          minutes_spent: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
      stock_movement_type: 'purchase' | 'usage' | 'adjustment' | 'return' | 'waste'
    }
  }
}
