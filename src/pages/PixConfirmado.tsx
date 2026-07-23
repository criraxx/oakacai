import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, MessageCircle, Download, ClipboardList, Receipt } from "lucide-react";
import Barcode from "react-barcode";
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
    const msg = `Ola! Quero acompanhar meu pedido ${pedidoId}`;
    window.open(`https://wa.me/55${numeroWhatsAppAtivo}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleBaixarRecibo = () => {
    window.print();
  };

  if (!fromPixPayment || !pedidoId) return null;

  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const codigoBarras = (pedidoId || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20) || "PEDIDO";

  return (
    <div className="min-h-screen bg-muted/30 max-w-md mx-auto px-4 py-6 print:bg-white print:max-w-full">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-print, #recibo-print * { visibility: visible; }
          #recibo-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header de confirmação */}
      <div className="flex flex-col items-center text-center mb-6 no-print">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500">
          <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-foreground font-bold text-2xl mb-1">Pagamento confirmado!</h1>
        <p className="text-muted-foreground text-sm">Seu pedido foi enviado para a loja</p>
      </div>

      {/* Recibo */}
      <div
        id="recibo-print"
        className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden mb-4"
        style={{ borderTopWidth: 4, borderTopColor: corBorda }}
      >
        {/* Cabeçalho do recibo */}
        <div className="px-5 pt-5 pb-4 border-b border-dashed border-border">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-foreground" />
            <span className="font-bold text-foreground text-sm uppercase tracking-wider">Recibo de compra</span>
          </div>
          <p className="text-xs text-muted-foreground">Oak Açaí • Florianópolis</p>
          <p className="text-xs text-muted-foreground">{dataFormatada}</p>
        </div>

        {/* ID do pedido */}
        <div className="px-5 py-4 border-b border-dashed border-border">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">ID da compra</p>
          <p className="font-mono font-bold text-foreground text-sm break-all">{pedidoId}</p>
        </div>

        {/* Itens */}
        {pedido && (
          <div className="px-5 py-4 border-b border-dashed border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Itens</p>
            <div className="space-y-2">
              {pedido.itens.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-foreground flex-1 pr-2">
                    {item.quantidade ?? 1}x {item.produtoNome}
                  </span>
                  <span className="text-foreground font-medium tabular-nums">
                    R$ {((item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1)).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="px-5 py-4 border-b border-dashed border-border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pago</p>
              <p className="text-[11px] text-muted-foreground">via PIX</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              R$ {(totalComDesconto ?? 0).toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* Código de barras */}
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

        {/* Rodapé */}
        <div className="px-5 py-3 bg-muted/40 text-center">
          <p className="text-[11px] text-muted-foreground">Obrigado pela preferência 💚</p>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3 no-print">
        <button
          onClick={handleBaixarRecibo}
          className="w-full py-3 bg-foreground text-background font-semibold text-sm rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          BAIXAR RECIBO
        </button>

        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Acompanhe seu pedido
          </p>
          <div className={`grid gap-2 ${numeroWhatsAppAtivo ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              onClick={() => navigate("/pedidos")}
              className="py-3 px-3 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex flex-col items-center gap-1"
            >
              <ClipboardList className="w-5 h-5" />
              Meus pedidos
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
          Voltar ao cardápio
        </button>
      </div>
    </div>
  );
};

export default PixConfirmado;
