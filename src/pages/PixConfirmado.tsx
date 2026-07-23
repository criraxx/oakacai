import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, MessageCircle } from "lucide-react";
import { useCart, Pedido } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase, trackPurchaseWithPix } from "@/lib/metaPixel";
import { gaTrackPurchase } from "@/lib/googleAnalytics";

const PixConfirmado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { limparCarrinho } = useCart();
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string>("64992842853");

  const pedidoId: string | undefined = location.state?.pedidoId;
  const pedidoDBId: string | undefined = location.state?.pedidoDBId;
  const pedido: Pedido | undefined = location.state?.pedido;
  const totalComDesconto: number | undefined = location.state?.totalComDesconto;
  const fromPixPayment: boolean = location.state?.fromPixPayment === true;

  const purchaseTracked = useRef(false);

  // Carregar número de WhatsApp ativo via edge function segura
  useEffect(() => {
    const carregarNumeroWhatsApp = async () => {
      try {
        const response = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config"
        );
        const data = await response.json();

        if (data?.whatsapp_numero) {
          setNumeroWhatsAppAtivo(data.whatsapp_numero);
        }
      } catch (error) {
        console.error("Erro ao buscar número WhatsApp:", error);
      }
    };

    carregarNumeroWhatsApp();
  }, []);

  // Redirecionar se não veio do pagamento PIX
  useEffect(() => {
    if (!fromPixPayment || !pedidoId) {
      navigate("/");
    }
  }, [fromPixPayment, pedidoId, navigate]);

  // Meta Pixel: Purchase + PurchaseWithPix - Disparar APENAS após confirmação real do pagamento
  useEffect(() => {
    if (!purchaseTracked.current && pedido && totalComDesconto && fromPixPayment) {
      console.log("[MetaPixel] Disparando Purchase após confirmação real do PIX");

      // Evento padrão Purchase (Meta Pixel)
      trackPurchase({
        content_ids: pedido.itens.map((item) => item.produtoId),
        content_name: pedido.itens.map((item) => item.produtoNome).join(", "),
        content_type: "product",
        value: totalComDesconto,
        num_items: pedido.itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
        order_id: pedido.id,
        payment_method: "PIX",
      });

      // Evento customizado PurchaseWithPix para rastrear PIX separadamente
      trackPurchaseWithPix({
        content_ids: pedido.itens.map((item) => item.produtoId),
        content_name: pedido.itens.map((item) => item.produtoNome).join(", "),
        value: totalComDesconto,
        num_items: pedido.itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
        order_id: pedido.id,
      });

      // Google Analytics: purchase
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
      console.log("[GA4] Purchase disparado após confirmação do PIX");

      purchaseTracked.current = true;
    }
  }, [pedido, totalComDesconto, fromPixPayment]);

  // Atualizar status do pagamento no banco e limpar carrinho
  useEffect(() => {
    const atualizarStatus = async () => {
      if (fromPixPayment && pedidoDBId) {
        try {
          const { error } = await supabase
            .from("pedidos")
            .update({ status_pagamento: "confirmado" })
            .eq("id", pedidoDBId);

          if (error) {
            console.error("Erro ao atualizar status do pagamento:", error);
          }
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

  const handleAcompanharPedido = () => {
    window.open(`https://wa.me/55${numeroWhatsAppAtivo}?text=Quero%20acompanhar%20meu%20pedido`, "_blank");
  };

  if (!fromPixPayment || !pedidoId) return null;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col items-center justify-center px-6">
      {/* Ícone de confirmação */}
      <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
        <CheckCircle className="w-14 h-14 text-green-500" />
      </div>

      {/* Texto principal */}
      <h1 className="text-foreground font-bold text-2xl text-center mb-3">Pagamento via PIX confirmado!</h1>

      {/* Subtexto */}
      <p className="text-muted-foreground text-center text-base mb-10">
        Seu pedido foi enviado para a loja. Agora você pode acompanhar.
      </p>

      {/* Botão principal */}
      <button
        onClick={handleAcompanharPedido}
        className="w-full py-2.5 bg-black hover:bg-black/80 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        ACOMPANHAR MEU PEDIDO
      </button>

      {/* Link secundário */}
      <button
        onClick={() => navigate("/")}
        className="mt-6 text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        Voltar ao cardápio
      </button>
    </div>
  );
};

export default PixConfirmado;
