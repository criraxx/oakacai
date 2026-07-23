import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Receipt,
  Store,
  Bike,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
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
  cliente_cpf?: string | null;
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
  payment_id?: string | null;
  itens?: PedidoItem[];
}

const statusConfig: Record<
  string,
  { label: string; short: string; icon: React.ElementType; step: number }
> = {
  pendente: { label: "Pendente", short: "Pendente", icon: Clock, step: 1 },
  confirmado: { label: "Confirmado", short: "Confirmado", icon: CheckCircle, step: 2 },
  preparando: { label: "Preparando", short: "Preparando", icon: Package, step: 3 },
  saiu: { label: "Saiu para entrega", short: "Saiu", icon: Truck, step: 4 },
  entregue: { label: "Entregue", short: "Entregue", icon: MapPin, step: 5 },
};

interface PedidoCardProps {
  pedido: PedidoDB;
}

const PedidoCard = ({ pedido }: PedidoCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";

  const [expanded, setExpanded] = useState(false);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showRecibo, setShowRecibo] = useState(false);
  const [complementosMap, setComplementosMap] = useState<Record<string, string>>({});

  // Tick para reavaliar status automático baseado em tempo
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Progressão automática do status quando pagamento confirmado
  const statusOrder = ["pendente", "confirmado", "preparando", "saiu", "entregue"];
  const computeAutoStatus = () => {
    if (pedido.status_pagamento !== "confirmado") return pedido.status_pedido;
    const elapsedMin = (Date.now() - new Date(pedido.created_at).getTime()) / 60000;
    let auto = "confirmado";
    if (elapsedMin >= 20) auto = "entregue";
    else if (elapsedMin >= 10) auto = "saiu";
    else if (elapsedMin >= 5) auto = "preparando";
    const storedIdx = statusOrder.indexOf(pedido.status_pedido);
    const autoIdx = statusOrder.indexOf(auto);
    return autoIdx > storedIdx ? auto : pedido.status_pedido;
  };
  const effectiveStatus = computeAutoStatus();

  const status = statusConfig[effectiveStatus] || statusConfig.pendente;
  const StatusIcon = status.icon;

  const statusLabel = (() => {
    if (effectiveStatus === "entregue") return statusConfig.entregue.label;
    if (effectiveStatus === "pendente") return statusConfig.pendente.label;
    if (effectiveStatus === "preparando") return statusConfig.preparando.label;
    if (effectiveStatus === "saiu") return statusConfig.saiu.label;
    return "Em processamento";
  })();

  const isPaid = pedido.status_pagamento === "confirmado";
  const statusColor = isPaid
    ? effectiveStatus === "entregue"
      ? "#22c55e"
      : "#3b82f6"
    : "#eab308";

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
        const [itensRes, compRes] = await Promise.all([
          supabase.from("pedido_itens").select("*").eq("pedido_id", pedido.id),
          supabase.from("complementos").select("id, nome"),
        ]);
        if (!itensRes.error && itensRes.data) setItens(itensRes.data);
        if (compRes.data) {
          const map: Record<string, string> = {};
          compRes.data.forEach((c: any) => {
            map[c.id] = c.nome;
          });
          setComplementosMap(map);
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
      const valorComDesconto =
        pedido.forma_pagamento === "pix"
          ? pedido.total
          : pedido.subtotal - pedido.subtotal * 0.06;

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
    navigate("/checkout-cartao");
  };

  const isDelivery = pedido.tipo_entrega === "delivery";
  const isPagamentoPendente = pedido.status_pagamento !== "confirmado";

  const timelineSteps = [
    { key: "confirmado", label: "Confirmado" },
    { key: "preparando", label: "Preparando" },
    { key: "saiu", label: "Saiu" },
    { key: "entregue", label: "Entregue" },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/60 overflow-hidden relative">
      {/* Faixa sutil de cor da marca no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: accent }}
      />

      {/* Header do pedido */}
      <div className="flex justify-between items-start mb-4 pt-1">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-card-foreground text-base tracking-tight">
            {pedido.numero_pedido}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(pedido.created_at)}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0"
          style={{
            background: `${statusColor}15`,
            color: statusColor,
          }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Timeline de entrega */}
      {isDelivery && (
        <div className="mb-5 bg-muted/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between relative">
            {timelineSteps.map((step, index) => {
              const config = statusConfig[step.key];
              const isActive = status.step >= config.step;
              const isCurrent = status.step === config.step;
              const Icon = config.icon;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? accent : "hsl(var(--muted))",
                      boxShadow: isCurrent ? `0 0 0 3px ${accent}30` : "none",
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{
                        color: isActive ? "#000" : "hsl(var(--muted-foreground))",
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] mt-1.5 font-medium"
                    style={{
                      color: isActive ? "hsl(var(--card-foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {step.label}
                  </span>
                  {index < timelineSteps.length - 1 && (
                    <div
                      className="absolute top-4 left-1/2 w-full h-0.5 -z-10"
                      style={{
                        background:
                          status.step > config.step
                            ? accent
                            : "hsl(var(--border))",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalhes do pedido */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-2">
            {isDelivery ? (
              <>
                <Bike className="w-3.5 h-3.5" /> Entrega
              </>
            ) : (
              <>
                <Store className="w-3.5 h-3.5" /> Retirada
              </>
            )}
          </span>
          <span className="text-card-foreground font-medium">
            {isDelivery ? "Delivery" : "Retirada"}
          </span>
        </div>

        {isDelivery && pedido.endereco_completo && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Endereço:</span>
            <span className="text-card-foreground text-right text-xs max-w-[200px] leading-relaxed">
              {pedido.endereco_completo}
              {pedido.bairro && `, ${pedido.bairro}`}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" /> Pagamento
          </span>
          <span className="text-card-foreground font-medium uppercase tracking-wide">
            {pedido.forma_pagamento}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status Pgto:</span>
          <span
            className="font-semibold text-xs px-2 py-1 rounded-full"
            style={{
              background: isPaid ? "#22c55e15" : "#eab30815",
              color: isPaid ? "#22c55e" : "#eab308",
            }}
          >
            {isPaid ? "Pago" : "Pendente"}
          </span>
        </div>

        {pedido.desconto_pix && pedido.desconto_pix > 0 && (
          <div className="flex justify-between text-green-500 text-sm">
            <span>Desconto PIX</span>
            <span className="font-medium">-{formatCurrency(pedido.desconto_pix)}</span>
          </div>
        )}

        <div
          className="flex justify-between items-center pt-3 mt-1 border-t border-border/60"
          style={{ borderColor: `${accent}20` }}
        >
          <span className="font-bold text-card-foreground text-sm">Total</span>
          <span
            className="font-bold text-xl tracking-tight"
            style={{ color: accent }}
          >
            {formatCurrency(pedido.total)}
          </span>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="mt-4 space-y-2.5">
        {isPagamentoPendente ? (
          <Button
            onClick={handlePagarAgora}
            disabled={loadingPayment}
            className="w-full h-12 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
            style={{ background: accent, color: "#000" }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loadingPayment ? "Processando..." : "Pagar agora"}
          </Button>
        ) : (
          <Button
            onClick={() => setShowRecibo(true)}
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold text-[15px] border-2 transition-all active:scale-[0.98] hover:bg-muted"
            style={{ borderColor: `${accent}40`, color: "hsl(var(--card-foreground))" }}
          >
            <Receipt className="w-4 h-4 mr-2" style={{ color: accent }} />
            Ver recibo
          </Button>
        )}

        <button
          onClick={handleExpand}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-colors hover:bg-muted"
          style={{ color: "hsl(var(--muted-foreground))" }}
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
      </div>

      {/* Lista de Itens */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
          {loadingItens ? (
            <p className="text-muted-foreground text-xs text-center py-2">Carregando itens...</p>
          ) : itens.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-2">Nenhum item encontrado</p>
          ) : (
            itens.map((item) => {
              const adicionaisList = Object.entries(item.adicionais || {}).filter(
                ([, v]) => v && (v as number) > 0
              );
              return (
                <div
                  key={item.id}
                  className="bg-muted/40 rounded-xl p-3.5 border border-border/30"
                >
                  <div className="flex justify-between gap-3 items-start">
                    <span className="text-card-foreground text-sm font-medium flex-1 leading-snug">
                      {item.quantidade ?? 1}x {item.produto_nome}
                    </span>
                    <span
                      className="text-sm font-bold whitespace-nowrap"
                      style={{ color: accent }}
                    >
                      {formatCurrency(item.total_item)}
                    </span>
                  </div>
                  {adicionaisList.length > 0 && (
                    <div className="mt-2.5 pl-3 border-l-2 border-border">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                        Adicionais
                      </p>
                      <ul className="space-y-1">
                        {adicionaisList.map(([id, qtd]) => (
                          <li key={id} className="text-xs text-card-foreground/80">
                            + {qtd as number}x {complementosMap[id] || id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.observacoes && (
                    <div className="mt-2.5 pl-3 border-l-2 rounded-r-lg" style={{ borderColor: `${accent}60` }}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                        Observações
                      </p>
                      <p className="text-xs text-card-foreground/80 italic whitespace-pre-wrap leading-relaxed">
                        {item.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
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
        corBorda={accent}
      />
    </div>
  );
};

export default PedidoCard;
