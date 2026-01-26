import { useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingCart, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="max-w-sm mx-auto bg-background border-border">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Adicionado ao carrinho!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <p className="text-foreground text-sm text-center font-medium">
            {produto.nome}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleIrParaCarrinho}
            className="w-full py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Ir para o carrinho
          </button>
          
          <button
            onClick={handleContinuarComprando}
            className="w-full py-3 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 border border-border"
          >
            <ArrowRight size={18} />
            Continuar comprando
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartModal;
