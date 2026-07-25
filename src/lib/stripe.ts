// Carrega o script da Stripe.js e inicializa uma instância única.
// Chave pública fornecida pela IronPay para tokenização global via Stripe.
const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51RihAcAcROcaM8Lgki6KnMOrflJO7Bm8CBFriAiRs4EiVtqQMa8AcGcd3xH9WvA89hB4JjoDk3yrqNYRyHtxubKx00hMYHwDVS";

// Se o seller informar um acct_..., podemos setar aqui para escopar as chamadas.
const STRIPE_ACCOUNT: string | undefined = "acct_1Two7wPSmBSYklDa";

let stripePromise: Promise<any> | null = null;

const loadScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if ((window as any).Stripe) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.stripe.com/v3/"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("stripe_load_error")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("stripe_load_error"));
    document.head.appendChild(s);
  });

export const getStripe = async (): Promise<any> => {
  if (stripePromise) return stripePromise;
  stripePromise = (async () => {
    await loadScript();
    const StripeCtor = (window as any).Stripe;
    if (!StripeCtor) throw new Error("Stripe.js no cargó");
    return STRIPE_ACCOUNT
      ? StripeCtor(STRIPE_PUBLISHABLE_KEY, { stripeAccount: STRIPE_ACCOUNT })
      : StripeCtor(STRIPE_PUBLISHABLE_KEY);
  })();
  return stripePromise;
};

// Checkout hospedado da Stripe (Payment Link) usado na SEGUNDA tentativa,
// depois que a primeira cobrança pelo nosso checkout é recusada.
// Cole aqui o link de pagamento gerado no painel da Stripe (https://buy.stripe.com/...).
export const STRIPE_CHECKOUT_URL = "";

// Monta a URL do checkout da Stripe com os dados do pedido (quando suportado pelo link).
export const buildStripeCheckoutUrl = (params: {
  valor: number;
  numeroPedido?: string;
  nome?: string;
}) => {
  if (!STRIPE_CHECKOUT_URL) return "";
  const url = new URL(STRIPE_CHECKOUT_URL);
  if (params.numeroPedido) url.searchParams.set("client_reference_id", params.numeroPedido);
  return url.toString();
};
