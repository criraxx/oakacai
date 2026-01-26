import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SecaoComplemento } from "@/data/complementosData";
import ComplementItem from "./ComplementItem";

interface ComplementSectionProps {
  secao: SecaoComplemento;
  quantidades: Record<string, number>;
  onQuantidadeChange: (id: string, quantidade: number) => void;
}

const ComplementSection = ({ secao, quantidades, onQuantidadeChange }: ComplementSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const totalSelecionados = secao.itens.reduce((acc, item) => {
    return acc + (quantidades[item.id] || 0);
  }, 0);

  // Verifica se é uma seção grátis (itens com preco === null)
  const isSecaoGratis = secao.itens.some(item => item.preco === null);
  
  // Limite da seção - só aplica para seções grátis
  const limiteSecao = isSecaoGratis ? (secao.maxItens || 4) : undefined;
  const atingiuLimite = limiteSecao !== undefined && totalSelecionados >= limiteSecao;

  return (
    <div className="mb-2">
      {/* Header da Seção */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted"
      >
        <div className="flex-1 text-left">
          <h3 className="text-foreground text-sm font-semibold">{secao.titulo}</h3>
          <p className="text-muted-foreground text-xs">
            {secao.subtitulo}
            {totalSelecionados > 0 && limiteSecao && (
              <span className={`ml-2 font-medium ${atingiuLimite ? 'text-green-500' : 'text-secondary'}`}>
                ({totalSelecionados}/{limiteSecao})
              </span>
            )}
            {totalSelecionados > 0 && !limiteSecao && (
              <span className="ml-2 text-secondary font-medium">
                ({totalSelecionados} selecionado{totalSelecionados > 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Lista de Itens */}
      {isOpen && (
        <div>
          {secao.itens.map((item) => (
            <ComplementItem
              key={item.id}
              complemento={item}
              quantidade={quantidades[item.id] || 0}
              onQuantidadeChange={onQuantidadeChange}
              bloqueadoAdicionar={atingiuLimite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplementSection;
