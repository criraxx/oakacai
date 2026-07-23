import { useNavigate } from "react-router-dom";
import { Check, ShoppingBag, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useBranding } from "@/hooks/useBranding";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: {
    nome: string;
    imagem: string;
  };
}

const AddToCartModal = ({ isOpen, onClose, produto }: AddToCartModalProps) => {
  const navigate = useNavigate();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#16a34a";

  const handleContinuarComprando = () => {
    onClose();
    navigate("/");
  };

  const handleIrParaCarrinho = () => {
    onClose();
    navigate("/carrinho");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm mx-auto p-0 overflow-hidden border-0 rounded-3xl bg-background shadow-2xl [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Produto adicionado ao carrinho</DialogTitle>

        {/* Faixa superior decorativa com cor de destaque */}
        <div
          className="relative h-24 flex items-end justify-center"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/25 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>

          {/* Selo de check flutuante */}
          <div
            className="absolute -bottom-8 w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-lg ring-4"
            style={{ boxShadow: `0 8px 24px -8px ${accent}80`, ['--tw-ring-color' as string]: 'transparent' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300"
              style={{ background: accent }}
            >
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="pt-12 pb-6 px-6 flex flex-col items-center">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: accent }}
          >
            Tudo certo
          </p>
          <h2 className="text-xl font-bold text-foreground text-center mb-4">
            Adicionado ao carrinho!
          </h2>

          {/* Card do produto */}
          <div className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border/60 mb-6">
            <div className="relative shrink-0">
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-16 h-16 object-cover rounded-xl"
              />
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                style={{ background: accent }}
              >
                1
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {produto.nome}
            </p>
          </div>

          {/* Ações */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleIrParaCarrinho}
              className="group w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                boxShadow: `0 10px 20px -10px ${accent}`,
              }}
            >
              <ShoppingBag size={18} strokeWidth={2.5} />
              Ir para o carrinho
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>

            <button
              onClick={handleContinuarComprando}
              className="w-full py-3 rounded-2xl font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors text-sm"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartModal;
