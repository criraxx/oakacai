import { Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCatalogo, CatalogoOrderBump } from "@/hooks/useCatalogo";
import { useToast } from "@/hooks/use-toast";

interface Props {
  gatilho: "carrinho" | "checkout";
}

const OrderBumpList = ({ gatilho }: Props) => {
  const { data } = useCatalogo();
  const { itens, adicionarItem } = useCart();
  const { toast } = useToast();

  if (!data) return null;

  const idsNoCarrinho = new Set(itens.map((i) => i.produtoId));

  // Filtrar ofertas activas por disparador, con producto disparador en el carrito (o sin disparador definido = siempre muestra)
  const bumps = data.order_bumps.filter((b) => {
    if ((b.gatilho ?? "carrinho") !== gatilho) return false;
    if (!b.produto_ofertado_id) return false;
    // ¿ya ofrecido?
    if (idsNoCarrinho.has(b.produto_ofertado_id)) return false;
    const triggers = data.order_bump_gatilhos.filter((g) => g.order_bump_id === b.id);
    if (triggers.length === 0) return true; // sin disparador específico => siempre mostrar
    return triggers.some((t) => idsNoCarrinho.has(t.produto_id));
  });

  if (bumps.length === 0) return null;

  const adicionar = (bump: CatalogoOrderBump) => {
    const produto = data.produtos.find((p) => p.id === bump.produto_ofertado_id);
    if (!produto) {
      toast({ title: "Producto no disponible", variant: "destructive" });
      return;
    }
    const preco = Number(bump.preco_promocional);
    if (!Number.isFinite(preco) || preco <= 0) {
      toast({ title: "Oferta no disponible", description: "Precio inválido", variant: "destructive" });
      return;
    }
    adicionarItem({
      id: `item-${Date.now()}`,
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoPreco: preco,
      produtoImagem: produto.imagem || "",
      complementos: {},
      observacoes: `🎁 Oferta: ${bump.titulo || bump.nome}`,
      totalAdicionais: 0,
    });
    toast({ title: "¡Oferta añadida!", description: bump.titulo || bump.nome });
  };

  return (
    <div className="mt-4 px-4 space-y-3">
      <h3 className="text-foreground font-semibold text-sm">✨ Oferta exclusiva</h3>
      {bumps.map((bump) => {
        const desconto = Math.round(
          ((Number(bump.preco_original) - Number(bump.preco_promocional)) /
            Number(bump.preco_original)) * 100
        );
        return (
          <button
            key={bump.id}
            onClick={() => adicionar(bump)}
            className="w-full flex gap-3 p-3 bg-gradient-to-r from-promo/20 to-accent/10 border-2 border-dashed border-promo rounded-xl text-left hover:scale-[1.01] transition-transform"
          >
            {bump.imagem && (
              <img
                src={bump.imagem}
                alt={bump.nome}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-promo text-[10px] font-bold uppercase tracking-wide">
                {bump.titulo || "Añade al pedido"}
              </p>
              <p className="text-foreground font-semibold text-sm leading-tight mb-1">
                {bump.nome}
              </p>
              {bump.descricao && (
                <p className="text-muted-foreground text-xs line-clamp-2 mb-1">{bump.descricao}</p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs line-through">
                  {Number(bump.preco_original).toFixed(2).replace(".", ",")} €
                </span>
                <span className="text-green-500 font-bold text-sm">
                  {Number(bump.preco_promocional).toFixed(2).replace(".", ",")} €
                </span>
                {desconto > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                    -{desconto}%
                  </span>
                )}
              </div>
            </div>
            <div className="self-center w-8 h-8 flex items-center justify-center bg-card text-card-foreground rounded-full flex-shrink-0">
              <Plus size={16} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default OrderBumpList;
