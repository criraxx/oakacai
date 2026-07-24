import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
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

  const formatBRL = (v: number) =>
    `${v.toFixed(2).replace(".", ",")} €`;

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
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground font-bold text-lg tracking-tight">
              Finalizar pago
            </h1>
            <p className="text-xs text-muted-foreground">Pedido {pedido.numero_pedido}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24 space-y-5">
        {/* Resumo do cliente */}
        <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Datos del cliente
          </p>
          <p className="text-card-foreground font-semibold text-sm">{pedido.cliente_nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pedido.cliente_telefone}</p>
          {pedido.cliente_cpf && (
            <p className="text-xs text-muted-foreground mt-0.5">DNI: {pedido.cliente_cpf}</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 px-1">
            Elige la forma de pago
          </p>

          <button
            onClick={handleCartao}
            disabled={loading}
            className="w-full bg-card rounded-2xl p-4 border-2 border-border/60 flex items-center gap-4 transition-all active:scale-[0.98] hover:shadow-md disabled:opacity-60 text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : (
                <CreditCard className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-card-foreground">Tarjeta de crédito</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visa, Master, Maestro y más
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
