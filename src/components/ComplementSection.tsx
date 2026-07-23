import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SecaoComplemento, TipoSecao } from "@/data/complementosData";
import ComplementItem from "./ComplementItem";

interface ComplementSectionProps {
  secao: SecaoComplemento;
  quantidades: Record<string, number>;
  onQuantidadeChange: (id: string, quantidade: number) => void;
  defaultOpen?: boolean;
}

const badgeStyles: Record<TipoSecao, { label: string; className: string }> = {
  gratis: { label: "Grátis", className: "bg-emerald-100 text-emerald-700" },
  pago: { label: "Pago", className: "bg-amber-100 text-amber-800" },
  premium: { label: "Premium", className: "bg-fuchsia-100 text-fuchsia-800" },
};

const ComplementSection = ({
  secao,
  quantidades,
  onQuantidadeChange,
  defaultOpen = false,
}: ComplementSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const totalSelecionados = secao.itens.reduce(
    (acc, item) => acc + (quantidades[item.id] || 0),
    0
  );

  const valorSelecionado = secao.itens.reduce((acc, item) => {
    const q = quantidades[item.id] || 0;
    if (item.preco && q > 0) return acc + item.preco * q;
    return acc;
  }, 0);

  const tipo = secao.tipo;
  const isSecaoGratis = tipo === "gratis" || secao.itens.some((i) => i.preco === null);
  const limiteSecao = secao.maxItens;
  const atingiuLimite = limiteSecao !== undefined && totalSelecionados >= limiteSecao;

  const badge = tipo ? badgeStyles[tipo] : null;

  return (
    <div className="mb-2 bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/60 hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-foreground text-sm font-semibold truncate">
              {secao.titulo}
            </h3>
            {badge && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {secao.subtitulo}
            {totalSelecionados > 0 && (
              <span
                className={`ml-2 font-medium ${
                  atingiuLimite ? "text-emerald-600" : "text-foreground"
                }`}
              >
                • {limiteSecao ? `${totalSelecionados}/${limiteSecao}` : `${totalSelecionados} selecionado${totalSelecionados > 1 ? "s" : ""}`}
                {!isSecaoGratis && valorSelecionado > 0 && (
                  <> · R$ {valorSelecionado.toFixed(2).replace(".", ",")}</>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

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
