import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCatalogo } from "@/hooks/useCatalogo";
import { useToast } from "@/hooks/use-toast";

interface Props {
  posicao: "checkout" | "saida";
  /** Se posicao=saida, dispara ao detectar intenção de sair. Se checkout, exibe embutido. */
  triggerOnMount?: boolean;
}

const DownsellModal = ({ posicao, triggerOnMount = false }: Props) => {
  const { data } = useCatalogo();
  const { itens, adicionarItem } = useCart();
  const { toast } = useToast();
  const [open, setOpen] = useState(triggerOnMount);
  const shownRef = useRef(false);

  const downsell = data?.downsells.find(
    (d) => (d.posicao ?? "saida") === posicao && d.produto_ofertado_id
  );

  const jaNoCarrinho = downsell
    ? itens.some((i) => i.produtoId === downsell.produto_ofertado_id)
    : false;

  useEffect(() => {
    if (posicao !== "saida" || !downsell || jaNoCarrinho || itens.length === 0) return;

    const trigger = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      setOpen(true);
    };

    // Exit intent (desktop) - mouse sai pelo topo
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };
    // Mobile - back button
    const onPopState = () => trigger();

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("popstate", onPopState);
    // Timer fallback
    const t = setTimeout(trigger, 45000);

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("popstate", onPopState);
      clearTimeout(t);
    };
  }, [posicao, downsell, jaNoCarrinho, itens.length]);

  if (!downsell || jaNoCarrinho) return null;

  const aceitar = () => {
    const produto = data?.produtos.find((p) => p.id === downsell.produto_ofertado_id);
    if (!produto) {
      toast({ title: "Produto indisponível", variant: "destructive" });
      return;
    }
    adicionarItem({
      id: `item-${Date.now()}`,
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoPreco: Number(downsell.preco_promocional),
      produtoImagem: produto.imagem || "",
      complementos: {},
      observacoes: `🔥 Downsell: ${downsell.titulo || downsell.nome}`,
      totalAdicionais: 0,
    });
    toast({ title: "Oferta aceita!", description: downsell.titulo || downsell.nome });
    setOpen(false);
  };

  const desconto = Math.round(
    ((Number(downsell.preco_original) - Number(downsell.preco_promocional)) /
      Number(downsell.preco_original)) * 100
  );

  const card = (
    <div className="bg-background border-2 border-promo rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full">
      {downsell.imagem && (
        <img src={downsell.imagem} alt={downsell.nome} className="w-full h-40 object-cover" />
      )}
      <div className="p-5 text-center">
        <p className="text-promo text-xs font-bold uppercase tracking-wide mb-1">
          {downsell.titulo || "Espere! Oferta especial"}
        </p>
        <h3 className="text-foreground font-bold text-lg mb-2">{downsell.nome}</h3>
        {downsell.descricao && (
          <p className="text-muted-foreground text-sm mb-3">{downsell.descricao}</p>
        )}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-muted-foreground line-through">
            R$ {Number(downsell.preco_original).toFixed(2).replace(".", ",")}
          </span>
          <span className="text-green-500 font-bold text-2xl">
            R$ {Number(downsell.preco_promocional).toFixed(2).replace(".", ",")}
          </span>
          {desconto > 0 && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">
              -{desconto}%
            </span>
          )}
        </div>
        <button
          onClick={aceitar}
          className="w-full py-3 bg-promo text-promo-foreground font-bold rounded-xl mb-2 hover:opacity-90 transition-opacity"
        >
          Sim, quero aproveitar!
        </button>
        {posicao === "saida" && (
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2 text-muted-foreground text-xs"
          >
            Não, obrigado
          </button>
        )}
      </div>
    </div>
  );

  if (posicao === "checkout") {
    return <div className="px-4 my-3">{card}</div>;
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative">
        <button
          onClick={() => setOpen(false)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-background rounded-full flex items-center justify-center border border-border z-10"
        >
          <X size={16} />
        </button>
        {card}
      </div>
    </div>
  );
};

export default DownsellModal;
