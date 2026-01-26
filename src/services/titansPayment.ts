import { supabase } from "@/integrations/supabase/client";

export interface TitansPaymentRequest {
  valor: number;
  descricao: string;
  nome: string;
  telefone: string;
  cpf: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    valor: number;
  }>;
}

export interface TitansPaymentResponse {
  success: boolean;
  paymentId?: string | number;
  pixCopiaECola?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  error?: string;
}

export async function createTitansPixPayment(data: TitansPaymentRequest): Promise<TitansPaymentResponse> {
  try {
    const { data: response, error } = await supabase.functions.invoke('create-primecash-payment', {
      body: data,
    });

    if (error) {
      console.error('Error calling create-primecash-payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar pagamento PIX',
      };
    }

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Erro ao criar pagamento PIX',
      };
    }

    // Converter paymentId para string para garantir consistência
    console.log('[TitansPayment] Response paymentId:', response.paymentId, 'Tipo:', typeof response.paymentId);
    
    return {
      success: true,
      paymentId: response.paymentId ? String(response.paymentId) : undefined,
      pixCopiaECola: response.pixCopiaECola,
      checkoutUrl: response.checkoutUrl,
      expiresAt: response.expiresAt,
    };
  } catch (error) {
    console.error('Error creating PrimeCash payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX',
    };
  }
}
