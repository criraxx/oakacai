import { useEffect, useState } from "react";
import { Clock, CheckCircle, Package, Truck, MapPin, ChevronDown, ChevronUp, CreditCard, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaymentMethodModal from "./PaymentMethodModal";
import ReciboModal from "./ReciboModal";

interface PedidoItem {
  id: string;
  produto_nome: string;
  produto_preco: number;
  quantidade: number;
  total_item: number;
  adicionais: any;
  observacoes: string | null;
}

interface PedidoDB {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string | null;
  total: number;
  subtotal: number;
  desconto_pix: number | null;
  forma_pagamento: string;
  tipo_entrega: string;
  status_pagamento: string;
  status_pedido: string;
  endereco_completo: string | null;
  bairro: string | null;
  cidade: string | null;
  created_at: string;
  payment_id: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; step: number }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-yellow-500", step: 1 },
  confirmado: { label: "Confirmado", icon: CheckCircle, color: "text-green-500", step: 2 },
  preparando: { label: "Preparando", icon: Package, color: "text-blue-500", step: 3 },
  saiu: { label: "Saiu para entrega", icon: Truck, color: "text-purple-500", step: 4 },
  entregue: { label: "Entregue", icon: MapPin, color: "text-green-600", step: 5 },
};

interface PedidoCardProps {
  pedido: PedidoDB;
}

const PedidoCard = ({ pedido }: PedidoCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showRecibo, setShowRecibo] = useState(false);
  const [corBorda, setCorBorda] = useState<string>("#F5E6D3");

  useEffect(() => {
    fetch("https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config")
      .then((r) => r.json())
      .then((d) => d?.cor_borda_logo && setCorBorda(d.cor_borda_logo))
      .catch(() => {});
  }, []);

  const status = statusConfig[pedido.status_pedido] || statusConfig.pendente;
  const StatusIcon = status.icon;

  const statusLabel = (() => {
    if (pedido.status_pedido === "entregue") return statusConfig.entregue.label;
    if (pedido.status_pedido === "pendente") return statusConfig.pendente.label;
    return "Em processamento";
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleExpand = async () => {
    if (!expanded && itens.length === 0) {
      setLoadingItens(true);
      try {
        const { data, error } = await supabase
          .from("pedido_itens")
          .select("*")
          .eq("pedido_id", pedido.id);

        if (!error && data) {
          setItens(data);
        }
      } catch (err) {
        console.error("Erro ao buscar itens:", err);
      } finally {
        setLoadingItens(false);
      }
    }
    setExpanded(!expanded);
  };

  const handlePagarAgora = () => {
    setShowPaymentModal(true);
  };

  const handleSelectPix = async () => {
    setShowPaymentModal(false);
    setLoadingPayment(true);

    try {
      // Gerar novo PIX via função unificada
      const valorComDesconto = pedido.forma_pagamento === "pix" 
        ? pedido.total 
        : (pedido.subtotal - pedido.subtotal * 0.06);

      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          valor: valorComDesconto,
          descricao: `Pedido ${pedido.numero_pedido}`,
          nome: pedido.cliente_nome,
          telefone: pedido.cliente_telefone,
          cpf: pedido.cliente_cpf || "",
          email: `${pedido.cliente_telefone}@cliente.local`,
          pedidoId: pedido.id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erro ao gerar PIX");
      }

      const pixData = {
        id: data.paymentId,
        copiaCola: data.pixCopiaECola,
        expiresAt: data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      // Navegar para pagamento PIX
      navigate("/pagamento-pix", {
        state: {
          pixData,
          pedidoId: pedido.numero_pedido,
          pedidoDBId: pedido.id,
          totalComDesconto: valorComDesconto,
          economia: pedido.subtotal * 0.06,
          pedido: {
            cliente_nome: pedido.cliente_nome,
            cliente_telefone: pedido.cliente_telefone,
          },
        },
      });
    } catch (error: any) {
      console.error("Erro ao processar PIX:", error);
      toast({
        title: "Erro ao gerar PIX",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSelectCard = () => {
    setShowPaymentModal(false);
    // Navegar para tela de cartão
    navigate("/checkout-cartao");
  };

  const isDelivery = pedido.tipo_entrega === "delivery";
  const isPagamentoPendente = pedido.status_pagamento !== "confirmado";

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      {/* Header do pedido */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-card-foreground text-sm">
            {pedido.numero_pedido}
          </p>
          <p className="text-xs text-card-foreground/70">
            {formatDate(pedido.created_at)}
          </p>
        </div>
        <div className={`flex items-center gap-1 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{statusLabel}</span>
        </div>
      </div>

      {/* Status de entrega (timeline) */}
      {isDelivery && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {Object.entries(statusConfig).map(([key, config], index) => {
              const isActive = status.step >= config.step;
              const Icon = config.icon;
              return (
                <div key={key} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? "bg-accent" : "bg-card-foreground/20"
                  }`}>
                    <Icon className={`w-3 h-3 ${isActive ? "text-accent-foreground" : "text-card-foreground/50"}`} />
                  </div>
                  {index < 4 && (
                    <div className={`hidden sm:block absolute h-0.5 w-8 ${
                      status.step > config.step ? "bg-accent" : "bg-card-foreground/20"
                    }`} style={{ marginLeft: "2rem" }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-card-foreground/60">
            <span>Pendente</span>
            <span>Confirmado</span>
            <span>Preparando</span>
            <span>Saiu</span>
            <span>Entregue</span>
          </div>
        </div>
      )}

      {/* Detalhes */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-card-foreground/70">Tipo:</span>
          <span className="text-card-foreground font-medium">
            {isDelivery ? "Entrega" : "Retirada"}
          </span>
        </div>

        {isDelivery && pedido.endereco_completo && (
          <div className="flex justify-between">
            <span className="text-card-foreground/70">Endereço:</span>
            <span className="text-card-foreground text-right text-xs max-w-[200px]">
              {pedido.endereco_completo}
              {pedido.bairro && `, ${pedido.bairro}`}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-card-foreground/70">Pagamento:</span>
          <span className="text-card-foreground font-medium uppercase">
            {pedido.forma_pagamento}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-card-foreground/70">Status Pgto:</span>
          <span className={`font-medium ${
            pedido.status_pagamento === "confirmado" 
              ? "text-green-500" 
              : "text-yellow-500"
          }`}>
            {pedido.status_pagamento === "confirmado" ? "Pago" : "Pendente"}
          </span>
        </div>

        {pedido.desconto_pix && pedido.desconto_pix > 0 && (
          <div className="flex justify-between text-green-500">
            <span>Desconto PIX:</span>
            <span>-{formatCurrency(pedido.desconto_pix)}</span>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-card-foreground/20">
          <span className="font-bold text-card-foreground">Total:</span>
          <span className="font-bold text-accent text-lg">
            {formatCurrency(pedido.total)}
          </span>
        </div>
      </div>

      {/* Botão Pagar Agora */}
      {isPagamentoPendente && (
        <Button
          onClick={handlePagarAgora}
          disabled={loadingPayment}
          className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {loadingPayment ? "Processando..." : "Pagar Agora"}
        </Button>
      )}

      {/* Botão Ver Recibo (apenas pagos) */}
      {!isPagamentoPendente && (
        <Button
          onClick={() => setShowRecibo(true)}
          variant="outline"
          className="w-full mt-3 border-border text-foreground hover:bg-muted"
        >
          <Receipt className="w-4 h-4 mr-2" />
          Ver recibo
        </Button>
      )}

      {/* Botão Ver Itens */}
      <button
        onClick={handleExpand}
        className="w-full mt-3 flex items-center justify-center gap-2 text-card-foreground/70 hover:text-card-foreground text-sm py-2 border-t border-card-foreground/10"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Ocultar itens
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Ver itens do pedido
          </>
        )}
      </button>

      {/* Lista de Itens */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-card-foreground/10 space-y-2">
          {loadingItens ? (
            <p className="text-card-foreground/60 text-xs text-center">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="text-card-foreground/60 text-xs text-center">Nenhum item encontrado</p>
          ) : (
            itens.map((item) => (
              <div key={item.id} className="bg-card-foreground/5 rounded-lg p-2">
                <div className="flex justify-between">
                  <span className="text-card-foreground text-sm font-medium">
                    {item.quantidade ?? 1}x {item.produto_nome}
                  </span>
                  <span className="text-accent text-sm font-bold">
                    {formatCurrency(item.total_item)}
                  </span>
                </div>
                {item.adicionais && Object.keys(item.adicionais).length > 0 && (
                  <div className="mt-1">
                    <p className="text-card-foreground/60 text-xs">
                      Adicionais: {Object.entries(item.adicionais)
                        .filter(([_, v]) => v)
                        .map(([k]) => k)
                        .join(", ")}
                    </p>
                  </div>
                )}
                {item.observacoes && (
                  <p className="text-card-foreground/50 text-xs mt-1 italic">
                    Obs: {item.observacoes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de escolha de pagamento */}
      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPix={handleSelectPix}
        onSelectCard={handleSelectCard}
      />

      {/* Modal de recibo */}
      <ReciboModal
        open={showRecibo}
        onClose={() => setShowRecibo(false)}
        pedido={{
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          total: pedido.total,
          forma_pagamento: pedido.forma_pagamento,
          created_at: pedido.created_at,
        }}
        corBorda={corBorda}
      />
    </div>
  );
};

export default PedidoCard;
