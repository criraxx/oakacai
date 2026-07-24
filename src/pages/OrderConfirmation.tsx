import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  CheckCircle,
  MapPin,
  Clock,
  Phone,
  Percent,
  ArrowLeft,
  Home,
  Receipt,
} from "lucide-react";
import { Pedido } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";
import { trackPurchase } from "@/lib/metaPixel";
import { gaTrackPurchase } from "@/lib/googleAnalytics";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pedido = location.state?.pedido as Pedido | undefined;
  const purchaseTracked = useRef(false);
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";

  // Meta Pixel: Purchase
  useEffect(() => {
    if (!purchaseTracked.current && pedido) {
      const formaPagamentoMap: Record<string, string> = {
        pix: "Pago online",
        cartao: "Tarjeta",
        dinheiro: "Efectivo",
      };

      trackPurchase({
        content_ids: pedido.itens.map((item) => item.produtoId),
        content_name: pedido.itens.map((item) => item.produtoNome).join(", "),
        content_type: "product",
        value: pedido.total,
        num_items: pedido.itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
        order_id: pedido.id,
        payment_method:
          formaPagamentoMap[pedido.dadosEntrega.formaPagamento] ||
          pedido.dadosEntrega.formaPagamento,
      });

      gaTrackPurchase({
        transaction_id: pedido.id,
        items: pedido.itens.map((item) => ({
          item_id: item.produtoId,
          item_name: item.produtoNome,
          price: item.produtoPreco + item.totalAdicionais,
          quantity: item.quantidade ?? 1,
        })),
        value: pedido.total,
        payment_type:
          formaPagamentoMap[pedido.dadosEntrega.formaPagamento] ||
          pedido.dadosEntrega.formaPagamento,
      });

      purchaseTracked.current = true;
      console.log("[MetaPixel] Purchase disparado en la página de confirmación");
      console.log("[GA4] Purchase disparado en la página de confirmación");
    }
  }, [pedido]);

  if (!pedido) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center px-6">
        <p className="text-foreground text-center mb-4">No se ha encontrado ningún pedido</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3.5 font-semibold rounded-xl transition-colors active:scale-[0.98]"
          style={{ background: accent, color: "#000" }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const formaPagamentoLabel = {
    pix: "Pago online",
    cartao: "Tarjeta a la entrega",
    dinheiro: "Efectivo",
  };

  const isPix = pedido.dadosEntrega.formaPagamento === "pix";

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Resumen del pedido</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">3/3</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "100%", background: accent }} />
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 pt-6 pb-6 space-y-4">
        {/* Sucesso */}
        <div className="text-center py-2">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `${accent}20` }}
          >
            <CheckCircle size={44} style={{ color: accent }} />
          </div>
          <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
            ¡Pedido confirmado!
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Tu pedido se ha recibido correctamente
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${accent}20`, color: "#000" }}
          >
            <Receipt size={12} />
            #{pedido.id}
          </span>
        </div>

        {/* Tiempo estimado */}
        <InfoCard
          icon={<Clock size={20} style={{ color: accent }} />}
          title="Tiempo estimado"
          text="30 - 45 minutos"
          accent={accent}
        />

        {/* Dirección */}
        <InfoCard
          icon={<MapPin size={20} style={{ color: accent }} />}
          title="Entregar en"
          text={
            <>
              {pedido.dadosEntrega.endereco}, {pedido.dadosEntrega.numero}
              {pedido.dadosEntrega.complemento && ` - ${pedido.dadosEntrega.complemento}`}
              <br />
              {pedido.dadosEntrega.bairro}
              {pedido.dadosEntrega.cidade && ` - ${pedido.dadosEntrega.cidade}`}
            </>
          }
          accent={accent}
        />

        {/* Contacto */}
        <InfoCard
          icon={<Phone size={20} style={{ color: accent }} />}
          title={pedido.dadosEntrega.nome}
          text={pedido.dadosEntrega.telefone}
          accent={accent}
        />

        {/* Artículos del pedido */}
        <section className="rounded-2xl border border-border bg-background p-4">
          <h3 className="text-foreground font-semibold text-sm mb-3">Artículos del pedido</h3>
          <div className="space-y-3">
            {pedido.itens.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.produtoImagem}
                  alt={item.produtoNome}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium leading-snug">
                    {item.produtoNome}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {item.quantidade ?? 1}x{" "}
                    {(item.produtoPreco + item.totalAdicionais).toFixed(2).replace(".", ",")} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-sm font-semibold">
                    {(
                      (item.produtoPreco + item.totalAdicionais) *
                      (item.quantidade ?? 1)
                    )
                      .toFixed(2)
                      .replace(".", ",")}{" "}€
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resumen de pago */}
        <section className="rounded-2xl border border-border bg-background p-4">
          <h3 className="text-foreground font-semibold text-sm mb-3">Pago</h3>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              {pedido.subtotal.toFixed(2).replace(".", ",")} €
            </span>
          </div>

          {isPix && pedido.descontoPix && pedido.descontoPix > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-600 flex items-center gap-1">
                <Percent size={14} />
                Descuento pago online (6%)
              </span>
              <span className="text-green-600 font-medium">
                -{pedido.descontoPix.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          )}

          <div className="flex justify-between text-base font-semibold border-t border-border pt-3 mt-3">
            <span className="text-foreground">Total</span>
            <span style={{ color: accent === "#F5E6D3" ? "#000" : accent }}>
              {pedido.total.toFixed(2).replace(".", ",")} €
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Método de pago:{" "}
              <span className="text-foreground font-medium">
                {formaPagamentoLabel[pedido.dadosEntrega.formaPagamento]}
              </span>
            </p>
            {pedido.dadosEntrega.formaPagamento === "dinheiro" && pedido.dadosEntrega.troco && (
              <p className="text-muted-foreground text-xs mt-1">
                Cambio para: {pedido.dadosEntrega.troco.toFixed(2).replace(".", ",")} €
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer Fijo */}
      <footer className="sticky bottom-0 bg-background border-t border-border">
        <div className="px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 font-semibold rounded-xl transition-all text-[15px] flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: accent, color: "#000" }}
          >
            <Home size={18} />
            Volver al inicio
          </button>
        </div>
      </footer>
    </div>
  );
};

const InfoCard = ({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode;
  title: string | React.ReactNode;
  text: string | React.ReactNode;
  accent: string;
}) => (
  <div className="rounded-2xl border border-border bg-background p-4 flex items-start gap-3">
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: `${accent}18` }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-foreground font-semibold text-sm">{title}</p>
      <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{text}</p>
    </div>
  </div>
);

export default OrderConfirmation;
