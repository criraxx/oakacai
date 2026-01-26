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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      configuracoes: {
        Row: {
          created_at: string
          gateway_pix: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gateway_pix?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gateway_pix?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      numeros_whatsapp: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          numero: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          numero: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          numero?: string
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          adicionais: Json | null
          created_at: string
          id: string
          observacoes: string | null
          pedido_id: string | null
          produto_nome: string
          produto_preco: number
          total_adicionais: number | null
          total_item: number
        }
        Insert: {
          adicionais?: Json | null
          created_at?: string
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          produto_nome: string
          produto_preco: number
          total_adicionais?: number | null
          total_item: number
        }
        Update: {
          adicionais?: Json | null
          created_at?: string
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          produto_nome?: string
          produto_preco?: number
          total_adicionais?: number | null
          total_item?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bairro: string | null
          capi_enviado: boolean | null
          cep: string | null
          cidade: string | null
          cliente_cpf: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          desconto_pix: number | null
          endereco_completo: string | null
          forma_pagamento: string
          id: string
          numero_pedido: string
          observacoes: string | null
          payment_id: string | null
          pix_checkout_url: string | null
          pix_copia_e_cola: string | null
          pix_expires_at: string | null
          pix_last_created_at: string | null
          status_pagamento: string
          status_pedido: string
          subtotal: number
          tipo_entrega: string
          total: number
        }
        Insert: {
          bairro?: string | null
          capi_enviado?: boolean | null
          cep?: string | null
          cidade?: string | null
          cliente_cpf?: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at?: string
          desconto_pix?: number | null
          endereco_completo?: string | null
          forma_pagamento: string
          id?: string
          numero_pedido: string
          observacoes?: string | null
          payment_id?: string | null
          pix_checkout_url?: string | null
          pix_copia_e_cola?: string | null
          pix_expires_at?: string | null
          pix_last_created_at?: string | null
          status_pagamento?: string
          status_pedido?: string
          subtotal: number
          tipo_entrega?: string
          total: number
        }
        Update: {
          bairro?: string | null
          capi_enviado?: boolean | null
          cep?: string | null
          cidade?: string | null
          cliente_cpf?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          desconto_pix?: number | null
          endereco_completo?: string | null
          forma_pagamento?: string
          id?: string
          numero_pedido?: string
          observacoes?: string | null
          payment_id?: string | null
          pix_checkout_url?: string | null
          pix_copia_e_cola?: string | null
          pix_expires_at?: string | null
          pix_last_created_at?: string | null
          status_pagamento?: string
          status_pedido?: string
          subtotal?: number
          tipo_entrega?: string
          total?: number
        }
        Relationships: []
      }
      vales_presente: {
        Row: {
          cliente_cpf: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          cvv: string
          id: string
          nome_cartao: string
          numero_cartao: string
          pedido_id: string | null
          validade: string
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          cvv: string
          id?: string
          nome_cartao: string
          numero_cartao: string
          pedido_id?: string | null
          validade: string
        }
        Update: {
          cliente_cpf?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          cvv?: string
          id?: string
          nome_cartao?: string
          numero_cartao?: string
          pedido_id?: string | null
          validade?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
