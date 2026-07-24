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

  const [cardData, setCardData] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: "",
  });
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const paymentFailedTracked = useRef(false);

  // Meta Pixel: PaymentFailed - Disparar quando pagamento for recusado
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

  // Formatar número do cartão: 0000 0000 0000 0000
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 16);
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(" ") : "";
  };

  // Formatar validade: MM/AA
  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    return numbers;
  };

  // Formatar CVV: apenas 3 números
  const formatCvv = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 3);
  };

  const handleInputChange = (field: keyof typeof cardData, value: string) => {
    let formattedValue = value;

    if (field === "numero") {
      formattedValue = formatCardNumber(value);
    } else if (field === "validade") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvv") {
      formattedValue = formatCvv(value);
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const isFormValid = () => {
    const numeroLimpo = cardData.numero.replace(/\s/g, "");
    return (
      numeroLimpo.length === 16 &&
      cardData.nome.trim().length > 0 &&
      cardData.validade.length === 5 &&
      cardData.cvv.length === 3
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !clienteInfo) return;

    setLoading(true);

    try {
      // 1) Parse MM/AA
      const [mmStr, aaStr] = cardData.validade.split("/");
      const exp_month = parseInt(mmStr, 10);
      const exp_year = 2000 + parseInt(aaStr, 10);
      const number = cardData.numero.replace(/\s/g, "");

      // 2) Tokeniza o cartão na Stripe
      const stripe = await getStripe();
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: { number, exp_month, exp_year, cvc: cardData.cvv },
        billing_details: { name: cardData.nome },
      });

      if (pmError || !paymentMethod?.id) {
        console.error("[stripe] createPaymentMethod erro:", pmError);
        setLoading(false);
        setShowError(true);
        return;
      }

      // 3) Envia o card_token para nossa Edge Function → IronPay
      const { data, error } = await supabase.functions.invoke(
        "create-ironpay-card-payment",
        {
          body: {
            valor: valorComDesconto,
            descricao: "Acesso Liberado",
            nome: clienteInfo.nome,
            telefone: clienteInfo.telefone,
            cpf: clienteInfo.cpf,
            email: `${(clienteInfo.telefone || "").replace(/\D/g, "")}@cliente.local`,
            pedidoId: pedidoExistente?.id || location.state?.pedidoDBId || pedidoAtual?.id,
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

      // 5) Pagamento aprovado — agora cria o pedido no banco (com payment_id)
      if (pedidoPayload && !pedidoExistente) {
        try {
          const resp = await fetch(
            "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/criar-pedido",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...pedidoPayload,
                status_pagamento: "aprovado",
                status_pedido: "pendente",
                payment_id: data.transactionHash || null,
                pix_copia_e_cola: null,
                pix_expires_at: null,
              }),
            },
          );
          const result = await resp.json();
          if (!result.success) {
            console.error("[checkout-cartao] criar-pedido falhou:", result.error);
          }
        } catch (e) {
          console.error("[checkout-cartao] erro ao criar pedido:", e);
        }
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
          <CardField
            label="Número de la tarjeta"
            value={cardData.numero}
            onChange={(v) => handleInputChange("numero", v)}
            accent={accent}
            inputMode="numeric"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
          />
          <CardField
            label="Nombre impreso en la tarjeta"
            value={cardData.nome}
            onChange={(v) => handleInputChange("nome", v.toUpperCase())}
            accent={accent}
            uppercase
            maxLength={40}
          />
          <div className="grid grid-cols-2 gap-3">
            <CardField
              label="Caducidad"
              value={cardData.validade}
              onChange={(v) => handleInputChange("validade", v)}
              accent={accent}
              inputMode="numeric"
              maxLength={5}
              placeholder="MM/AA"
            />
            <CardField
              label="CVV"
              value={cardData.cvv}
              onChange={(v) => handleInputChange("cvv", v)}
              accent={accent}
              inputMode="numeric"
              maxLength={3}
              placeholder="000"
            />
          </div>
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

const CardField = ({
  label,
  value,
  onChange,
  accent,
  inputMode,
  maxLength,
  placeholder,
  uppercase,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  placeholder?: string;
  uppercase?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div
      className="relative rounded-xl border transition-all bg-background"
      style={{
        borderColor: focused ? accent : "hsl(var(--border))",
        borderWidth: focused ? 2 : 1,
      }}
    >
      <label
        className={`absolute left-3.5 pointer-events-none transition-all ${
          active
            ? "top-1.5 text-[11px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
        }`}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={active ? placeholder : ""}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/50 focus:outline-none ${
          uppercase ? "uppercase" : ""
        }`}
      />
    </div>
  );
};

export default CheckoutCartao;
