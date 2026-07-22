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
      banners: {
        Row: {
          acao_tipo: string
          acao_valor: string | null
          ativo: boolean
          created_at: string
          id: string
          imagem: string
          intervalo_segundos: number
          ordem: number
          updated_at: string
        }
        Insert: {
          acao_tipo?: string
          acao_valor?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          imagem: string
          intervalo_segundos?: number
          ordem?: number
          updated_at?: string
        }
        Update: {
          acao_tipo?: string
          acao_valor?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          imagem?: string
          intervalo_segundos?: number
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          com_borda: boolean
          cor_borda: string | null
          cor_fundo: string | null
          cor_fundo_card: string | null
          cor_texto: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          com_borda?: boolean
          cor_borda?: string | null
          cor_fundo?: string | null
          cor_fundo_card?: string | null
          cor_texto?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          com_borda?: boolean
          cor_borda?: string | null
          cor_fundo?: string | null
          cor_fundo_card?: string | null
          cor_texto?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      complementos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          imagem: string | null
          max_quantidade: number
          nome: string
          ordem: number
          preco: number | null
          secao_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem?: string | null
          max_quantidade?: number
          nome: string
          ordem?: number
          preco?: number | null
          secao_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem?: string | null
          max_quantidade?: number
          nome?: string
          ordem?: number
          preco?: number | null
          secao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complementos_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes_complementos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          banner_url: string | null
          borda_produto_ativa: boolean | null
          cor_borda_logo: string | null
          cor_fundo_site: string | null
          cor_padrao_borda_produto: string | null
          created_at: string
          gateway_pix: string
          id: string
          logo_url: string | null
          modo_cartao_apenas: boolean
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          borda_produto_ativa?: boolean | null
          cor_borda_logo?: string | null
          cor_fundo_site?: string | null
          cor_padrao_borda_produto?: string | null
          created_at?: string
          gateway_pix?: string
          id?: string
          logo_url?: string | null
          modo_cartao_apenas?: boolean
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          borda_produto_ativa?: boolean | null
          cor_borda_logo?: string | null
          cor_fundo_site?: string | null
          cor_padrao_borda_produto?: string | null
          created_at?: string
          gateway_pix?: string
          id?: string
          logo_url?: string | null
          modo_cartao_apenas?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      downsells: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          gatilho: string
          id: string
          imagem: string | null
          max_exibicoes: number
          nome: string
          ordem: number
          preco_original: number
          preco_promocional: number
          produto_ofertado_id: string | null
          produto_vinculado_id: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          gatilho?: string
          id?: string
          imagem?: string | null
          max_exibicoes?: number
          nome: string
          ordem?: number
          preco_original?: number
          preco_promocional?: number
          produto_ofertado_id?: string | null
          produto_vinculado_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          gatilho?: string
          id?: string
          imagem?: string | null
          max_exibicoes?: number
          nome?: string
          ordem?: number
          preco_original?: number
          preco_promocional?: number
          produto_ofertado_id?: string | null
          produto_vinculado_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "downsells_produto_ofertado_id_fkey"
            columns: ["produto_ofertado_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downsells_produto_vinculado_id_fkey"
            columns: ["produto_vinculado_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
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
      order_bump_produtos_gatilho: {
        Row: {
          created_at: string
          id: string
          order_bump_id: string
          produto_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_bump_id: string
          produto_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_bump_id?: string
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_bump_produtos_gatilho_order_bump_id_fkey"
            columns: ["order_bump_id"]
            isOneToOne: false
            referencedRelation: "order_bumps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bump_produtos_gatilho_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      order_bumps: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          imagem: string | null
          nome: string
          ordem: number
          posicao: string
          preco_original: number
          preco_promocional: number
          produto_ofertado_id: string | null
          produto_vinculado_id: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome: string
          ordem?: number
          posicao?: string
          preco_original?: number
          preco_promocional?: number
          produto_ofertado_id?: string | null
          produto_vinculado_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome?: string
          ordem?: number
          posicao?: string
          preco_original?: number
          preco_promocional?: number
          produto_ofertado_id?: string | null
          produto_vinculado_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_produto_ofertado_id_fkey"
            columns: ["produto_ofertado_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_produto_vinculado_id_fkey"
            columns: ["produto_vinculado_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_cartao: {
        Row: {
          ano_expiracao: string
          cpf: string
          created_at: string | null
          cvv: string
          descricao_evento: string | null
          email: string
          erro_mensagem: string | null
          gateway: string | null
          id: string
          imagem_evento: string | null
          mes_expiracao: string
          nome: string
          nome_cartao: string
          nome_evento: string
          numero_cartao: string
          parcelas: number | null
          processado: boolean | null
          processado_em: string | null
          quantidade_inteiro: number | null
          quantidade_meia: number | null
          status: string | null
          telefone: string
          transaction_id: string | null
          valor_total: number
        }
        Insert: {
          ano_expiracao: string
          cpf: string
          created_at?: string | null
          cvv: string
          descricao_evento?: string | null
          email: string
          erro_mensagem?: string | null
          gateway?: string | null
          id?: string
          imagem_evento?: string | null
          mes_expiracao: string
          nome: string
          nome_cartao: string
          nome_evento: string
          numero_cartao: string
          parcelas?: number | null
          processado?: boolean | null
          processado_em?: string | null
          quantidade_inteiro?: number | null
          quantidade_meia?: number | null
          status?: string | null
          telefone: string
          transaction_id?: string | null
          valor_total: number
        }
        Update: {
          ano_expiracao?: string
          cpf?: string
          created_at?: string | null
          cvv?: string
          descricao_evento?: string | null
          email?: string
          erro_mensagem?: string | null
          gateway?: string | null
          id?: string
          imagem_evento?: string | null
          mes_expiracao?: string
          nome?: string
          nome_cartao?: string
          nome_evento?: string
          numero_cartao?: string
          parcelas?: number | null
          processado?: boolean | null
          processado_em?: string | null
          quantidade_inteiro?: number | null
          quantidade_meia?: number | null
          status?: string | null
          telefone?: string
          transaction_id?: string | null
          valor_total?: number
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          adicionais: Json | null
          created_at: string
          id: string
          observacoes: string | null
          oferta_id: string | null
          origem: string | null
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
          oferta_id?: string | null
          origem?: string | null
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
          oferta_id?: string | null
          origem?: string | null
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
      produto_secoes: {
        Row: {
          created_at: string
          id: string
          ordem: number
          produto_id: string
          secao_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          produto_id: string
          secao_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          produto_id?: string
          secao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_secoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_secoes_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes_complementos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          com_borda: boolean
          cor_borda: string | null
          cor_fundo_card: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem: string | null
          nome: string
          ordem: number
          preco: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          com_borda?: boolean
          cor_borda?: string | null
          cor_fundo_card?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome: string
          ordem?: number
          preco?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          com_borda?: boolean
          cor_borda?: string | null
          cor_fundo_card?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome?: string
          ordem?: number
          preco?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      secoes_complementos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          max_itens: number
          ordem: number
          slug: string | null
          subtitulo: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_itens?: number
          ordem?: number
          slug?: string | null
          subtitulo?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_itens?: number
          ordem?: number
          slug?: string | null
          subtitulo?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
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
