import { Plus, Minus } from "lucide-react";
import { Complemento } from "@/data/complementosData";

interface ComplementItemProps {
  complemento: Complemento;
  quantidade: number;
  onQuantidadeChange: (id: string, quantidade: number) => void;
  bloqueadoAdicionar?: boolean;
}

const ComplementItem = ({ complemento, quantidade, onQuantidadeChange, bloqueadoAdicionar = false }: ComplementItemProps) => {
  const { id, nome, preco } = complemento;
  
  const handleAdd = () => {
    if (bloqueadoAdicionar) return;
    onQuantidadeChange(id, quantidade + 1);
  };

  const handleRemove = () => {
    if (quantidade > 0) {
      onQuantidadeChange(id, quantidade - 1);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border bg-background">
      {/* Imagem */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img 
          src={complemento.imagem} 
          alt={nome}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Nome e Preço */}
      <div className="flex-1 min-w-0">
        <h4 className="text-foreground text-sm font-medium leading-tight">{nome}</h4>
        <p className="text-muted-foreground text-xs mt-0.5">
          {preco === null ? "Grátis" : `R$ ${preco.toFixed(2).replace(".", ",")}`}
        </p>
      </div>

      {/* Contador ou Botão + */}
      <div className="flex items-center gap-2">
        {quantidade > 0 ? (
          <>
            <button
              onClick={handleRemove}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="w-5 text-center text-foreground text-sm font-medium">{quantidade}</span>
            <button
              onClick={handleAdd}
              disabled={bloqueadoAdicionar}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                bloqueadoAdicionar 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
            >
              <Plus size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={handleAdd}
            disabled={bloqueadoAdicionar}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              bloqueadoAdicionar 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-foreground text-background hover:bg-foreground/90'
            }`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ComplementItem;
