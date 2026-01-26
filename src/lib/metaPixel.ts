// Meta Pixel (Facebook Pixel) - Eventos padrão do Meta Ads
// Pixel ID: 25555782027442346
// O script do pixel é carregado diretamente no index.html

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Verificar se o pixel está disponível com retry
const waitForPixel = (callback: () => void, maxRetries = 10, interval = 100): void => {
  let retries = 0;
  
  const check = () => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      console.log('[MetaPixel] Pixel disponível, executando evento...');
      callback();
    } else if (retries < maxRetries) {
      retries++;
      console.log(`[MetaPixel] Aguardando pixel... tentativa ${retries}/${maxRetries}`);
      setTimeout(check, interval);
    } else {
      console.warn('[MetaPixel] Pixel não disponível após todas as tentativas');
    }
  };
  
  check();
};

// Verificar se o pixel está disponível imediatamente
const isPixelReady = (): boolean => {
  const ready = typeof window !== 'undefined' && typeof window.fbq === 'function';
  return ready;
};

// =====================================================
// PRIORIDADE DOS EVENTOS (do mais importante ao menos):
// 1. Purchase - MÁXIMA (conversão final)
// 2. AddToCart - ALTA
// 3. InitiateCheckout - MÉDIA
// 4. AddAddress - MÉDIA (nova intenção de compra)
// 5. AddPaymentInfo - MÉDIA
// 6. Lead - BAIXA (início de dados)
// 7. PaymentFailed - BAIXA (remarketing)
// 8. ViewContent - BAIXA
// 9. PageView - BAIXA
// =====================================================

// 1. PageView - Disparado automaticamente via index.html
export const trackPageView = (): void => {
  if (!isPixelReady()) {
    console.log('[MetaPixel] trackPageView: pixel não disponível');
    return;
  }
  window.fbq('track', 'PageView');
  console.log('[MetaPixel] PageView disparado');
};

// 2. ViewContent - Quando o usuário visualizar um produto (BAIXA PRIORIDADE)
export const trackViewContent = (params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency?: string;
}): void => {
  console.log('[MetaPixel] trackViewContent chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('track', 'ViewContent', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type,
      value: params.value,
      currency: params.currency || 'BRL',
    });
    console.log('[MetaPixel] ✅ ViewContent DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 3. AddToCart - Quando o usuário adicionar um produto ao carrinho (ALTA PRIORIDADE)
export const trackAddToCart = (params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency?: string;
  num_items?: number;
}): void => {
  console.log('[MetaPixel] trackAddToCart chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('track', 'AddToCart', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type,
      value: params.value,
      currency: params.currency || 'BRL',
      num_items: params.num_items || 1,
    });
    console.log('[MetaPixel] ✅ AddToCart DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 4. InitiateCheckout - Quando o usuário iniciar o checkout (MÉDIA PRIORIDADE)
export const trackInitiateCheckout = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items: number;
}): void => {
  console.log('[MetaPixel] trackInitiateCheckout chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: params.content_ids,
      value: params.value,
      currency: params.currency || 'BRL',
      num_items: params.num_items,
    });
    console.log('[MetaPixel] ✅ InitiateCheckout DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 5. Lead - Quando o usuário começar a inserir dados pessoais (BAIXA PRIORIDADE)
export const trackLead = (params: {
  content_ids?: string[];
  value?: number;
  currency?: string;
}): void => {
  console.log('[MetaPixel] trackLead chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('track', 'Lead', {
      content_ids: params.content_ids || [],
      value: params.value || 0,
      currency: params.currency || 'BRL',
    });
    console.log('[MetaPixel] ✅ Lead DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 6. AddAddress - Quando o usuário inserir endereço durante checkout (MÉDIA PRIORIDADE - forte intenção)
export const trackAddAddress = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
}): void => {
  console.log('[MetaPixel] trackAddAddress chamado com:', params);
  
  const fireEvent = () => {
    // Usando evento customizado pois AddAddress não é evento padrão do Meta
    window.fbq('trackCustom', 'AddAddress', {
      content_ids: params.content_ids,
      value: params.value,
      currency: params.currency || 'BRL',
    });
    console.log('[MetaPixel] ✅ AddAddress (custom) DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 7. AddPaymentInfo - Quando o usuário selecionar a forma de pagamento (MÉDIA PRIORIDADE)
export const trackAddPaymentInfo = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
  payment_method?: string;
}): void => {
  console.log('[MetaPixel] trackAddPaymentInfo chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('track', 'AddPaymentInfo', {
      content_ids: params.content_ids,
      value: params.value,
      currency: params.currency || 'BRL',
      payment_method: params.payment_method,
    });
    console.log('[MetaPixel] ✅ AddPaymentInfo DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 8. PaymentFailed - Quando o pagamento for recusado (BAIXA PRIORIDADE - remarketing)
export const trackPaymentFailed = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
  payment_method?: string;
  error_reason?: string;
}): void => {
  console.log('[MetaPixel] trackPaymentFailed chamado com:', params);
  
  const fireEvent = () => {
    // Usando evento customizado pois PaymentFailed não é evento padrão do Meta
    window.fbq('trackCustom', 'PaymentFailed', {
      content_ids: params.content_ids,
      value: params.value,
      currency: params.currency || 'BRL',
      payment_method: params.payment_method,
      error_reason: params.error_reason,
    });
    console.log('[MetaPixel] ✅ PaymentFailed (custom) DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 9. Purchase - Quando o pedido for concluído com sucesso (PRIORIDADE MÁXIMA)
export const trackPurchase = (params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency?: string;
  num_items: number;
  order_id: string;
  payment_method: string;
}): void => {
  console.log('[MetaPixel] trackPurchase chamado com:', params);
  
  const fireEvent = () => {
    // Usar eventID para deduplicação com Conversions API
    window.fbq('track', 'Purchase', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type,
      value: params.value,
      currency: params.currency || 'BRL',
      num_items: params.num_items,
      order_id: params.order_id,
      payment_method: params.payment_method,
    }, { eventID: params.order_id });
    console.log('[MetaPixel] ✅ Purchase DISPARADO - Order ID (eventID):', params.order_id);
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};

// 10. PurchaseWithPix - Evento customizado para rastrear compras via PIX separadamente
export const trackPurchaseWithPix = (params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency?: string;
  num_items: number;
  order_id: string;
}): void => {
  console.log('[MetaPixel] trackPurchaseWithPix chamado com:', params);
  
  const fireEvent = () => {
    window.fbq('trackCustom', 'PurchaseWithPix', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      value: params.value,
      currency: params.currency || 'BRL',
      num_items: params.num_items,
      order_id: params.order_id,
    }, { eventID: `pix_${params.order_id}` });
    console.log('[MetaPixel] ✅ PurchaseWithPix (custom) DISPARADO');
  };
  
  if (isPixelReady()) {
    fireEvent();
  } else {
    waitForPixel(fireEvent);
  }
};