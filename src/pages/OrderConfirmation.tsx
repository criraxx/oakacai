import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { CheckCircle, MapPin, Clock, Phone, Percent } from "lucide-react";
import { Pedido } from "@/contexts/CartContext";
import { trackPurchase } from "@/lib/metaPixel";
import { gaTrackPurchase } from "@/lib/googleAnalytics";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pedido = location.state?.pedido as Pedido | undefined;
  const purchaseTracked = useRef(false);

  // Meta Pixel: Purchase - Disparar quando chegar na página de confirmação
  // Este é o momento mais próximo da compra para pagamentos Cartão/Dinheiro
  useEffect(() => {
    if (!purchaseTracked.current && pedido) {
      const formaPagamentoMap: Record<string, string> = {
        pix: 'PIX',
        cartao: 'Cartão',
        dinheiro: 'Dinheiro',
      };
      
      // Meta Pixel: Purchase
      trackPurchase({
        content_ids: pedido.itens.map(item => item.produtoId),
        content_name: pedido.itens.map(item => item.produtoNome).join(', '),
        content_type: 'product',
        value: pedido.total,
        num_items: pedido.itens.length,
        order_id: pedido.id,
        payment_method: formaPagamentoMap[pedido.dadosEntrega.formaPagamento] || pedido.dadosEntrega.formaPagamento,
      });

      // Google Analytics: purchase
      gaTrackPurchase({
        transaction_id: pedido.id,
        items: pedido.itens.map(item => ({
          item_id: item.produtoId,
          item_name: item.produtoNome,
          price: item.produtoPreco + item.totalAdicionais,
          quantity: 1,
        })),
        value: pedido.total,
        payment_type: formaPagamentoMap[pedido.dadosEntrega.formaPagamento] || pedido.dadosEntrega.formaPagamento,
      });
      
      purchaseTracked.current = true;
      console.log('[MetaPixel] Purchase disparado na página de confirmação');
      console.log('[GA4] Purchase disparado na página de confirmação');
    }
  }, [pedido]);

  if (!pedido) {
    return (
      <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col items-center justify-center px-6">
        <p className="text-foreground text-center mb-4">Nenhum pedido encontrado</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const formaPagamentoLabel = {
    pix: "PIX",
    cartao: "Cartão na entrega",
    dinheiro: "Dinheiro",
  };

  const isPix = pedido.dadosEntrega.formaPagamento === "pix";

  return (
    <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col">
      {/* Header com sucesso */}
      <div className="bg-secondary py-8 px-6 text-center">
        <div className="w-16 h-16 bg-secondary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-secondary-foreground" />
        </div>
        <h1 className="text-secondary-foreground font-bold text-xl mb-1">
          Pedido Confirmado!
        </h1>
        <p className="text-secondary-foreground/80 text-sm">
          Seu pedido foi recebido com sucesso
        </p>
        <p className="text-secondary-foreground font-semibold text-sm mt-2">
          #{pedido.id}
        </p>
      </div>

      {/* Conteúdo */}
      <main className="flex-1 pb-24">
        {/* Tempo estimado */}
        <div className="bg-background p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Clock size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">Tempo estimado</p>
              <p className="text-muted-foreground text-xs">30 - 45 minutos</p>
            </div>
          </div>
        </div>

        {/* Endereço de entrega */}
        <div className="bg-background p-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">Entregar em</p>
              <p className="text-muted-foreground text-xs">
                {pedido.dadosEntrega.endereco}, {pedido.dadosEntrega.numero}
                {pedido.dadosEntrega.complemento && ` - ${pedido.dadosEntrega.complemento}`}
              </p>
              <p className="text-muted-foreground text-xs">
                {pedido.dadosEntrega.bairro}
                {pedido.dadosEntrega.cidade && ` - ${pedido.dadosEntrega.cidade}`}
              </p>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-background p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Phone size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">{pedido.dadosEntrega.nome}</p>
              <p className="text-muted-foreground text-xs">{pedido.dadosEntrega.telefone}</p>
            </div>
          </div>
        </div>

        {/* Itens do pedido */}
        <div className="bg-background p-4 mt-2">
          <h2 className="text-foreground font-semibold text-sm mb-3">Itens do pedido</h2>
          
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex gap-3 py-2 border-b border-border last:border-0">
              <img
                src={item.produtoImagem}
                alt={item.produtoNome}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{item.produtoNome}</p>
                <p className="text-muted-foreground text-xs">
                  R$ {(item.produtoPreco + item.totalAdicionais).toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo de pagamento */}
        <div className="bg-background p-4 mt-2">
          <h2 className="text-foreground font-semibold text-sm mb-3">Pagamento</h2>
          
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              R$ {pedido.subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          
          {/* Desconto PIX */}
          {isPix && pedido.descontoPix && pedido.descontoPix > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-500 flex items-center gap-1">
                <Percent size={14} />
                Desconto PIX (6%)
              </span>
              <span className="text-green-500 font-medium">
                -R$ {pedido.descontoPix.toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
            <span className="text-foreground">Total</span>
            <span className="text-secondary">
              R$ {pedido.total.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Forma de pagamento: <span className="text-foreground font-medium">{formaPagamentoLabel[pedido.dadosEntrega.formaPagamento]}</span>
            </p>
            {pedido.dadosEntrega.formaPagamento === "dinheiro" && pedido.dadosEntrega.troco && (
              <p className="text-muted-foreground text-xs mt-1">
                Troco para: R$ {pedido.dadosEntrega.troco.toFixed(2).replace(".", ",")}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border p-4">
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Voltar ao início
        </button>
      </footer>
    </div>
  );
};

export default OrderConfirmation;
