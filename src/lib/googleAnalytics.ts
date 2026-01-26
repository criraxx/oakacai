// Google Analytics 4 - Eventos de e-commerce
// Measurement ID: G-Q94YP9MMYG
// O script do gtag é carregado diretamente no index.html

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Verificar se o gtag está disponível
const isGtagReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// =====================================================
// EVENTOS DO GOOGLE ANALYTICS 4 (E-COMMERCE):
// 1. add_to_cart - Quando adiciona ao carrinho
// 2. begin_checkout - Quando inicia checkout
// 3. add_shipping_info - Quando preenche endereço
// 4. add_payment_info - Quando escolhe forma de pagamento
// 5. purchase - Quando compra é confirmada
// =====================================================

// 1. add_to_cart - Quando o usuário adiciona um produto ao carrinho
export const gaTrackAddToCart = (params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  currency?: string;
}): void => {
  if (!isGtagReady()) {
    console.log('[GA4] gtag não disponível');
    return;
  }

  window.gtag('event', 'add_to_cart', {
    currency: params.currency || 'BRL',
    value: params.price * (params.quantity || 1),
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      price: params.price,
      quantity: params.quantity || 1,
    }],
  });
  console.log('[GA4] ✅ add_to_cart disparado:', params.item_name);
};

// 2. begin_checkout - Quando o usuário inicia o checkout
export const gaTrackBeginCheckout = (params: {
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
  }>;
  value: number;
  currency?: string;
}): void => {
  if (!isGtagReady()) {
    console.log('[GA4] gtag não disponível');
    return;
  }

  window.gtag('event', 'begin_checkout', {
    currency: params.currency || 'BRL',
    value: params.value,
    items: params.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  console.log('[GA4] ✅ begin_checkout disparado - Total:', params.value);
};

// 3. add_shipping_info - Quando o usuário preenche o endereço
export const gaTrackAddShippingInfo = (params: {
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
  }>;
  value: number;
  currency?: string;
  shipping_tier?: string;
}): void => {
  if (!isGtagReady()) {
    console.log('[GA4] gtag não disponível');
    return;
  }

  window.gtag('event', 'add_shipping_info', {
    currency: params.currency || 'BRL',
    value: params.value,
    shipping_tier: params.shipping_tier || 'delivery',
    items: params.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  console.log('[GA4] ✅ add_shipping_info disparado');
};

// 4. add_payment_info - Quando o usuário escolhe a forma de pagamento
export const gaTrackAddPaymentInfo = (params: {
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
  }>;
  value: number;
  currency?: string;
  payment_type?: string;
}): void => {
  if (!isGtagReady()) {
    console.log('[GA4] gtag não disponível');
    return;
  }

  window.gtag('event', 'add_payment_info', {
    currency: params.currency || 'BRL',
    value: params.value,
    payment_type: params.payment_type || 'unknown',
    items: params.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  console.log('[GA4] ✅ add_payment_info disparado - Método:', params.payment_type);
};

// 5. purchase - Quando a compra é confirmada (EVENTO MAIS IMPORTANTE)
export const gaTrackPurchase = (params: {
  transaction_id: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
  }>;
  value: number;
  currency?: string;
  payment_type?: string;
  shipping?: number;
  tax?: number;
}): void => {
  if (!isGtagReady()) {
    console.log('[GA4] gtag não disponível');
    return;
  }

  window.gtag('event', 'purchase', {
    transaction_id: params.transaction_id,
    currency: params.currency || 'BRL',
    value: params.value,
    shipping: params.shipping || 0,
    tax: params.tax || 0,
    items: params.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  console.log('[GA4] ✅ purchase disparado - Order ID:', params.transaction_id, '- Total:', params.value);
};
