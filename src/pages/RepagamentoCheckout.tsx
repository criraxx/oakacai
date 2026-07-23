import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, QrCode, CreditCard, Loader2, Percent } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PedidoExistente {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string;
  total: number;
  subtotal?: number;
}

const RepagamentoCheckout = ({ pedido }: { pedido: PedidoExistente }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const [loading, setLoading] = useState(false);

  const subtotal = pedido.subtotal ?? pedido.total;
  const totalPix = subtotal - subtotal * 0.06;
  const economiaPix = subtotal * 0.06;

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handlePix = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          valor: totalPix,
          descricao: `Pedido ${pedido.numero_pedido}`,
          nome: pedido.cliente_nome,
          telefone: pedido.cliente_telefone,
          cpf: pedido.cliente_cpf || "",
          email: `${(pedido.cliente_telefone || "").replace(/\D/g, "")}@cliente.local`,
          pedidoId: pedido.id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erro ao gerar PIX");
      }

      navigate("/pagamento-pix", {
        state: {
          pixData: {
            id: data.paymentId,
            copiaCola: data.pixCopiaECola,
            expiresAt: data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
          pedidoId: pedido.numero_pedido,
          pedidoDBId: pedido.id,
          totalComDesconto: totalPix,
          economia: economiaPix,
          pedido: {
            cliente_nome: pedido.cliente_nome,
            cliente_telefone: pedido.cliente_telefone,
          },
        },
      });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar PIX",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCartao = () => {
    navigate("/checkout-cartao", {
      state: {
        pedidoExistente: {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: pedido.cliente_nome,
          cliente_telefone: pedido.cliente_telefone,
          cliente_cpf: pedido.cliente_cpf || "",
          total: pedido.total,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/60">
        <div className="h-1.5 w-full" style={{ background: accent }} />
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground font-bold text-lg tracking-tight">
              Finalizar pagamento
            </h1>
            <p className="text-xs text-muted-foreground">Pedido {pedido.numero_pedido}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24 space-y-5">
        {/* Resumo do cliente */}
        <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Dados do cliente
          </p>
          <p className="text-card-foreground font-semibold text-sm">{pedido.cliente_nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pedido.cliente_telefone}</p>
          {pedido.cliente_cpf && (
            <p className="text-xs text-muted-foreground mt-0.5">CPF: {pedido.cliente_cpf}</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 px-1">
            Escolha a forma de pagamento
          </p>

          {/* PIX */}
          <button
            onClick={handlePix}
            disabled={loading}
            className="w-full bg-card rounded-2xl p-4 border-2 flex items-center gap-4 mb-3 transition-all active:scale-[0.98] hover:shadow-md disabled:opacity-60 text-left"
            style={{ borderColor: `${accent}60` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accent}25` }}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
              ) : (
                <QrCode className="w-6 h-6" style={{ color: accent }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-card-foreground">PIX</p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: "#22c55e20", color: "#16a34a" }}
                >
                  <Percent className="w-2.5 h-2.5" /> 6% OFF
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Aprovação em segundos</p>
              <p className="text-sm font-bold mt-1" style={{ color: accent }}>
                {formatBRL(totalPix)}
              </p>
            </div>
          </button>

          {/* Cartão */}
          <button
            onClick={handleCartao}
            disabled={loading}
            className="w-full bg-card rounded-2xl p-4 border-2 border-border/60 flex items-center gap-4 transition-all active:scale-[0.98] hover:shadow-md disabled:opacity-60 text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-card-foreground">Cartão de crédito</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visa, Master, Elo e mais
              </p>
              <p className="text-sm font-bold text-card-foreground mt-1">
                {formatBRL(pedido.total)}
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

const RepagamentoWrapper = () => {
  const location = useLocation();
  const pedido = location.state?.pedidoExistente as PedidoExistente | undefined;
  return pedido ? <RepagamentoCheckout pedido={pedido} /> : null;
};

export default RepagamentoWrapper;
export { RepagamentoCheckout };
