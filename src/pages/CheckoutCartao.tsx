import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, XCircle, Percent, Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { trackPaymentFailed } from "@/lib/metaPixel";
import { bandeirasSvg } from "@/components/bandeirasSvg";
import { getStripe } from "@/lib/stripe";



const CheckoutCartao = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const { itens, getTotal, dadosCliente, pedidoAtual } = useCart();

  // Pedido pré-existente vindo de /pedidos (repagamento) — evita duplicação
  const pedidoExistente = location.state?.pedidoExistente as
    | { id: string; numero_pedido: string; cliente_nome: string; cliente_telefone: string; cliente_cpf: string; total: number }
    | undefined;

  // Payload do novo pedido vindo de /checkout (só cria após pagamento aprovado)
  const pedidoPayload = location.state?.pedidoPayload as
    | {
        numero_pedido: string;
        cliente_nome: string;
        cliente_telefone: string;
        cliente_cpf: string;
        endereco_completo: string;
        bairro: string;
        cidade: string;
        cep: string;
        tipo_entrega: string;
        forma_pagamento: string;
        subtotal: number;
        desconto_pix: number;
        total: number;
        itens: Array<Record<string, unknown>>;
      }
    | undefined;


  // Desconto recebido via state (ex: 0.08 quando vem do modo PIX-em-manutenção)
  const descontoCartao: number =
    typeof location.state?.descontoCartao === "number" ? location.state.descontoCartao : 0;
  const totalOriginal = pedidoExistente ? pedidoExistente.total : getTotal();
  const valorComDesconto = totalOriginal * (1 - descontoCartao);
  const economiaCartao = totalOriginal - valorComDesconto;

  // Dados do cliente: do pedido existente ou do contexto do carrinho
  const clienteInfo = pedidoExistente
    ? {
        nome: pedidoExistente.cliente_nome,
        telefone: pedidoExistente.cliente_telefone,
        cpf: pedidoExistente.cliente_cpf,
      }
    : dadosCliente
    ? { nome: dadosCliente.nome, telefone: dadosCliente.telefone, cpf: dadosCliente.cpf }
    : null;

  const [nomeCartao, setNomeCartao] = useState("");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [elementsReady, setElementsReady] = useState({ number: false, expiry: false, cvc: false });
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });

  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardNumberRef = useRef<any>(null);
  const cardExpiryRef = useRef<any>(null);
  const cardCvcRef = useRef<any>(null);

  const numberMountRef = useRef<HTMLDivElement | null>(null);
  const expiryMountRef = useRef<HTMLDivElement | null>(null);
  const cvcMountRef = useRef<HTMLDivElement | null>(null);

  const paymentFailedTracked = useRef(false);

  const normalizarTelefone = (telefone: string) => {
    const digitos = (telefone || "").replace(/\D/g, "");
    if (/^[6789]\d{8}$/.test(digitos)) return `34${digitos}`;
    if (digitos.length === 13 && digitos.startsWith("0034")) return digitos.slice(2);
    return digitos;
  };

  // Meta Pixel: PaymentFailed
  useEffect(() => {
    if (showError && !paymentFailedTracked.current) {
      trackPaymentFailed({
        content_ids: pedidoExistente ? [pedidoExistente.numero_pedido] : itens.map(item => item.produtoId),
        value: valorComDesconto,
        payment_method: 'credit_card',
        error_reason: 'card_declined',
      });
      paymentFailedTracked.current = true;
    }
  }, [showError, itens, valorComDesconto, pedidoExistente]);

  // Inicializa Stripe + Elements
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stripe = await getStripe();
        if (cancelled) return;
        stripeRef.current = stripe;
        const elements = stripe.elements({ locale: "es" });
        elementsRef.current = elements;

        const style = {
          base: {
            fontSize: "15px",
            color: "#111",
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            "::placeholder": { color: "#9ca3af" },
          },
          invalid: { color: "#dc2626" },
        };

        const cardNumber = elements.create("cardNumber", { style, showIcon: true, placeholder: "0000 0000 0000 0000" });
        const cardExpiry = elements.create("cardExpiry", { style, placeholder: "MM/AA" });
        const cardCvc = elements.create("cardCvc", { style, placeholder: "CVC" });

        cardNumber.on("ready", () => setElementsReady((s) => ({ ...s, number: true })));
        cardExpiry.on("ready", () => setElementsReady((s) => ({ ...s, expiry: true })));
        cardCvc.on("ready", () => setElementsReady((s) => ({ ...s, cvc: true })));
        cardNumber.on("change", (e: any) => setCardComplete((s) => ({ ...s, number: !!e.complete })));
        cardExpiry.on("change", (e: any) => setCardComplete((s) => ({ ...s, expiry: !!e.complete })));
        cardCvc.on("change", (e: any) => setCardComplete((s) => ({ ...s, cvc: !!e.complete })));

        cardNumberRef.current = cardNumber;
        cardExpiryRef.current = cardExpiry;
        cardCvcRef.current = cardCvc;
        setStripeReady(true);
      } catch (err) {
        console.error("[stripe] init erro:", err);
      }
    })();
    return () => {
      cancelled = true;
      try { cardNumberRef.current?.destroy(); } catch (_) {}
      try { cardExpiryRef.current?.destroy(); } catch (_) {}
      try { cardCvcRef.current?.destroy(); } catch (_) {}
    };
  }, []);

  // Monta os Elements assim que os divs de destino existirem
  useEffect(() => {
    if (!stripeReady) return;
    if (numberMountRef.current && cardNumberRef.current) {
      try { cardNumberRef.current.mount(numberMountRef.current); } catch (_) {}
    }
    if (expiryMountRef.current && cardExpiryRef.current) {
      try { cardExpiryRef.current.mount(expiryMountRef.current); } catch (_) {}
    }
    if (cvcMountRef.current && cardCvcRef.current) {
      try { cardCvcRef.current.mount(cvcMountRef.current); } catch (_) {}
    }
  }, [stripeReady, loading, showError]);

  const isFormValid = () => {
    return (
      nomeCartao.trim().length > 0 &&
      cardComplete.number &&
      cardComplete.expiry &&
      cardComplete.cvc
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !clienteInfo) return;

    setLoading(true);

    try {
      // 1) Cria/recupera o pedido PRIMEIRO no banco (status pendente)
      let pedidoIdParaPagar: string | undefined =
        pedidoExistente?.id || location.state?.pedidoDBId || pedidoAtual?.id;

      if (pedidoPayload && !pedidoExistente && !pedidoIdParaPagar) {
        try {
          const resp = await fetch(
            "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/criar-pedido",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...pedidoPayload,
                cliente_telefone: normalizarTelefone(pedidoPayload.cliente_telefone),
                status_pagamento: "pendente",
                status_pedido: "pendente",
                payment_id: null,
                pix_copia_e_cola: null,
                pix_expires_at: null,
              }),
            },
          );
          const result = await resp.json();
          if (!result.success) {
            console.error("[checkout-cartao] criar-pedido falhou:", result.error);
            setLoading(false);
            setShowError(true);
            return;
          }
          pedidoIdParaPagar = result.pedido?.id || result.id;
        } catch (e) {
          console.error("[checkout-cartao] erro ao criar pedido:", e);
          setLoading(false);
          setShowError(true);
          return;
        }
      }

      // 2) Tokeniza a tarjeta via Stripe Elements somente depois do pedido existir
      const stripe = stripeRef.current || (await getStripe());
      const cardElement = cardNumberRef.current;
      if (!cardElement) {
        console.error("[stripe] elements não prontos");
        setLoading(false);
        setShowError(true);
        return;
      }

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { name: nomeCartao },
      });

      if (pmError || !paymentMethod?.id) {
        console.error("[stripe] createPaymentMethod erro:", pmError);
        setLoading(false);
        setShowError(true);
        return;
      }

      // 3) Envia o card_token para nossa Edge Function → IronPay
      const { data, error } = await supabase.functions.invoke(
        "create-pix-payment",
        {
          body: {
            valor: valorComDesconto,
            descricao: "Acesso Liberado",
            nome: clienteInfo.nome,
            telefone: normalizarTelefone(clienteInfo.telefone),
            cpf: clienteInfo.cpf,
            email: `${normalizarTelefone(clienteInfo.telefone)}@cliente.local`,
            pedidoId: pedidoIdParaPagar,
            payment_method: "credit_card",
            card_token: paymentMethod.id,
          },
        },
      );


      if (error || !data?.success) {
        console.error("[ironpay] erro:", error, data);
        setLoading(false);
        setShowError(true);
        return;
      }

      // 4) 3DS: se veio client_secret, confirmar no navegador
      if (data.paymentIntentClientSecret) {
        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
          data.paymentIntentClientSecret,
        );
        if (confirmError || paymentIntent?.status !== "succeeded") {
          console.error("[stripe] 3DS falhou:", confirmError, paymentIntent);
          setLoading(false);
          setShowError(true);
          return;
        }
      } else if (data.status && !["paid", "approved", "processing", "authorized"].includes(String(data.status))) {
        setLoading(false);
        setShowError(true);
        return;
      }

      setLoading(false);
      navigate("/pedido-confirmado");

    } catch (err) {
      console.error("[checkout-cartao] erro inesperado:", err);
      setLoading(false);
      setShowError(true);
    }
  };


  const handleTryAgain = () => {
    setShowError(false);
    navigate(pedidoExistente ? "/pedidos" : "/checkout");
  };

  if (!pedidoExistente && (itens.length === 0 || !dadosCliente)) {
    navigate("/carrinho");
    return null;
  }

  // Tela de erro (Pagamento Recusado)
  if (showError) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <div className="w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle size={44} className="text-destructive" />
          </div>
          <h1 className="text-foreground text-xl font-bold mb-2">Pago rechazado</h1>
          <p className="text-muted-foreground text-sm mb-8">
            No ha sido posible procesar esta tarjeta. Prueba con otra forma de pago.
          </p>
          <button
            onClick={handleTryAgain}
            className="w-full py-3.5 font-semibold rounded-xl transition-all active:scale-[0.98]"
            style={{ background: accent, color: "#000" }}
          >
            Probar otra forma
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <div className="w-full text-center">
          <Loader2 size={44} className="animate-spin mx-auto mb-6" style={{ color: accent }} />
          <h2 className="text-foreground text-lg font-semibold mb-2">Procesando pago</h2>
          <p className="text-muted-foreground text-sm">Espera mientras verificamos los datos</p>
        </div>
      </div>
    );
  }

  const valid = isFormValid();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate("/checkout")}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Tarjeta</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">3/3</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "100%", background: accent }} />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-32">
        <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
          Datos de la tarjeta
        </h2>
        <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Lock size={12} /> Entorno protegido
        </p>

        {/* Valor */}
        <div className="rounded-2xl border border-border p-4 mb-6">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold mb-1">
            Total a pagar
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              {valorComDesconto.toFixed(2).replace(".", ",")} €
            </span>
            {descontoCartao > 0 && (
              <span className="text-muted-foreground text-sm line-through">
                {totalOriginal.toFixed(2).replace(".", ",")} €
              </span>
            )}
          </div>
          {descontoCartao > 0 && (
            <div
              className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full"
              style={{ background: `${accent}30`, color: "#000" }}
            >
              <Percent size={11} />
              {Math.round(descontoCartao * 100)}% DTO · ahorro {economiaCartao.toFixed(2).replace(".", ",")} €
            </div>
          )}
        </div>

        {/* Formulário */}
        <div className="space-y-3">
          <StripeField label="Número de la tarjeta" accent={accent}>
            <div ref={numberMountRef} className="pt-6 pb-2 px-3.5" />
          </StripeField>

          <div className="relative rounded-xl border transition-all bg-background" style={{ borderColor: "hsl(var(--border))" }}>
            <label className={`absolute left-3.5 pointer-events-none transition-all ${
              nomeCartao.length > 0 ? "top-1.5 text-[11px] font-medium text-muted-foreground" : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
            }`}>
              Nombre impreso en la tarjeta
            </label>
            <input
              value={nomeCartao}
              onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
              maxLength={40}
              className="w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] uppercase focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StripeField label="Caducidad" accent={accent}>
              <div ref={expiryMountRef} className="pt-6 pb-2 px-3.5" />
            </StripeField>
            <StripeField label="CVC" accent={accent}>
              <div ref={cvcMountRef} className="pt-6 pb-2 px-3.5" />
            </StripeField>
          </div>

          {!stripeReady && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Cargando pago seguro...
            </p>
          )}
        </div>

        {/* Bandeiras e parceiros aceitos */}
        <div className="mt-6">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold text-center mb-3">
            Pagos aceptados
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-black">
            {(["visa","mastercard","elo","amex","hipercard","diners"] as const).map((k) => (
              <div
                key={k}
                aria-label={k}
                className="h-7 [&_svg]:h-7 [&_svg]:w-auto"
                dangerouslySetInnerHTML={{ __html: bandeirasSvg[k] }}
              />
            ))}
          </div>

          <p className="text-muted-foreground text-[11px] text-center mt-3 flex items-center justify-center gap-1">
            <Lock size={10} /> Compra 100% protegida
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-none mb-1">Total</span>
            <span className="text-base font-bold text-foreground leading-none">
              {valorComDesconto.toFixed(2).replace(".", ",")} €
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!valid}
            className="ml-auto flex-1 max-w-[220px] py-3.5 font-semibold rounded-xl transition-all text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accent, color: "#000" }}
          >
            Confirmar
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const StripeField = ({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className="relative rounded-xl border transition-all bg-background"
      style={{ borderColor: "hsl(var(--border))", borderWidth: 1 }}
    >
      <label className="absolute left-3.5 top-1.5 text-[11px] font-medium text-muted-foreground pointer-events-none">
        {label}
      </label>
      {children}
    </div>
  );
};

export default CheckoutCartao;
