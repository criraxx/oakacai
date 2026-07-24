import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, MessageCircle, Download, ClipboardList, Receipt, Loader2 } from "lucide-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useCart, Pedido } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase, trackPurchaseWithPix } from "@/lib/metaPixel";
import { gaTrackPurchase } from "@/lib/googleAnalytics";

const PixConfirmado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { limparCarrinho } = useCart();
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string | null>(null);
  const [corBorda, setCorBorda] = useState<string>("#F5E6D3");

  const pedidoId: string | undefined = location.state?.pedidoId;
  const pedidoDBId: string | undefined = location.state?.pedidoDBId;
  const pedido: Pedido | undefined = location.state?.pedido;
  const totalComDesconto: number | undefined = location.state?.totalComDesconto;
  const fromPixPayment: boolean = location.state?.fromPixPayment === true;

  const purchaseTracked = useRef(false);

  // Pagamento concluído → limpa flag de recuperação de venda
  useEffect(() => {
    try { sessionStorage.removeItem("oak_pix_flow"); } catch {}
  }, []);



  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const response = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config"
        );
        const data = await response.json();
        if (data?.whatsapp_numero) setNumeroWhatsAppAtivo(data.whatsapp_numero);
        if (data?.cor_borda_logo) setCorBorda(data.cor_borda_logo);
      } catch (error) {
        console.error("Erro ao buscar config:", error);
      }
    };
    carregarConfig();
  }, []);

  useEffect(() => {
    if (!fromPixPayment || !pedidoId) {
      navigate("/");
    }
  }, [fromPixPayment, pedidoId, navigate]);

  useEffect(() => {
    if (!purchaseTracked.current && pedido && totalComDesconto && fromPixPayment) {
      trackPurchase({
        content_ids: pedido.itens.map((item) => item.produtoId),
        content_name: pedido.itens.map((item) => item.produtoNome).join(", "),
        content_type: "product",
        value: totalComDesconto,
        num_items: pedido.itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
        order_id: pedido.id,
        payment_method: "PIX",
      });
      trackPurchaseWithPix({
        content_ids: pedido.itens.map((item) => item.produtoId),
        content_name: pedido.itens.map((item) => item.produtoNome).join(", "),
        value: totalComDesconto,
        num_items: pedido.itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
        order_id: pedido.id,
      });
      gaTrackPurchase({
        transaction_id: pedido.id,
        items: pedido.itens.map((item) => ({
          item_id: item.produtoId,
          item_name: item.produtoNome,
          price: item.produtoPreco + item.totalAdicionais,
          quantity: item.quantidade ?? 1,
        })),
        value: totalComDesconto,
        payment_type: "PIX",
      });
      purchaseTracked.current = true;
    }
  }, [pedido, totalComDesconto, fromPixPayment]);

  useEffect(() => {
    const atualizarStatus = async () => {
      if (fromPixPayment && pedidoDBId) {
        try {
          await supabase
            .from("pedidos")
            .update({ status_pagamento: "confirmado" })
            .eq("id", pedidoDBId);
        } catch (error) {
          console.error("Erro ao atualizar status:", error);
        }
      }
    };

    if (fromPixPayment && pedidoId) {
      limparCarrinho();
      atualizarStatus();
    }
  }, [fromPixPayment, pedidoId, pedidoDBId, limparCarrinho]);

  const handleAcompanharWhats = () => {
    if (!numeroWhatsAppAtivo) return;
    const msg = `¡Hola! Quiero hacer seguimiento de mi pedido ${pedidoId}`;
    window.open(`https://wa.me/55${numeroWhatsAppAtivo}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const reciboRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleBaixarRecibo = async () => {
    if (!reciboRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`recibo-${pedidoId}.pdf`);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (!fromPixPayment || !pedidoId) return null;

  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const codigoBarras = (pedidoId || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20) || "PEDIDO";

  return (
    <div className="min-h-screen bg-muted/30 max-w-md mx-auto px-4 py-6">
      {/* Header de confirmación */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500">
          <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-foreground font-bold text-2xl mb-1">¡Pago confirmado!</h1>
        <p className="text-muted-foreground text-sm">Tu pedido ha sido enviado a la tienda</p>
      </div>

      {/* Recibo */}
      <div
        ref={reciboRef}
        className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden mb-4"
        style={{ borderTopWidth: 4, borderTopColor: corBorda }}
      >
        <div className="px-5 pt-5 pb-4 border-b border-dashed border-border">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-foreground" />
            <span className="font-bold text-foreground text-sm uppercase tracking-wider">Recibo de compra</span>
          </div>
          <p className="text-xs text-muted-foreground">Oak Açaí • Florianópolis</p>
          <p className="text-xs text-muted-foreground">{dataFormatada}</p>
        </div>

        <div className="px-5 py-4 border-b border-dashed border-border">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">ID de la compra</p>
          <p className="font-mono font-bold text-foreground text-sm break-all">{pedidoId}</p>
        </div>

        {pedido && (
          <div className="px-5 py-4 border-b border-dashed border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Artículos</p>
            <div className="space-y-3">
              {pedido.itens.map((item, idx) => {
                const complementosNomes = (item as any).complementosNomes as Record<string, string> | undefined;
                const complementosMap = item.complementos || {};
                const adicionaisList = Object.entries(complementosMap).filter(([, v]) => v && v > 0);
                return (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground flex-1 pr-2 font-medium">
                        {item.quantidade ?? 1}x {item.produtoNome}
                      </span>
                      <span className="text-foreground font-medium tabular-nums">
                        {((item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1)).toFixed(2).replace(".", ",")} €
                      </span>
                    </div>
                    {adicionaisList.length > 0 && (
                      <ul className="mt-1 pl-3 space-y-0.5">
                        {adicionaisList.map(([id, qtd]) => (
                          <li key={id} className="text-[11px] text-muted-foreground">
                            + {qtd}x {complementosNomes?.[id] || id}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.observacoes && (
                      <p className="mt-1 pl-3 text-[11px] italic text-muted-foreground">
                        Obs: {item.observacoes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-b border-dashed border-border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pagado</p>
              <p className="text-[11px] text-muted-foreground">mediante pago online</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {(totalComDesconto ?? 0).toFixed(2).replace(".", ",")} €
            </p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col items-center bg-white">
          <div className="w-full flex justify-center overflow-hidden">
            <Barcode
              value={codigoBarras}
              format="CODE128"
              width={1.6}
              height={60}
              displayValue={false}
              margin={0}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>
          <p className="mt-2 text-[11px] font-mono tracking-widest text-muted-foreground">{codigoBarras}</p>
        </div>

        <div className="px-5 py-3 bg-muted/40 text-center">
          <p className="text-[11px] text-muted-foreground">Gracias por tu preferencia</p>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <button
          onClick={handleBaixarRecibo}
          disabled={downloading}
          className="w-full py-3 bg-foreground text-background font-semibold text-sm rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {downloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...</>
          ) : (
            <><Download className="w-4 h-4" /> DESCARGAR RECIBO</>
          )}
        </button>

        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Haz seguimiento de tu pedido
          </p>
          <div className={`grid gap-2 ${numeroWhatsAppAtivo ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              onClick={() => navigate("/pedidos")}
              className="py-3 px-3 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex flex-col items-center gap-1"
            >
              <ClipboardList className="w-5 h-5" />
              Mis pedidos
            </button>
            {numeroWhatsAppAtivo && (
              <button
                onClick={handleAcompanharWhats}
                className="py-3 px-3 rounded-lg text-sm font-medium text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors flex flex-col items-center gap-1"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full text-muted-foreground hover:text-foreground text-sm py-2 transition-colors"
        >
          Volver al menú
        </button>
      </div>
    </div>
  );
};

export default PixConfirmado;
