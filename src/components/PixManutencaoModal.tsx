import { useEffect } from "react";
import { AlertTriangle, CreditCard, ShieldCheck, Zap, ArrowRight, X } from "lucide-react";

interface PixManutencaoModalProps {
  open: boolean;
  onClose: () => void;
  onIrParaCartao: () => void;
  totalOriginal: number;
  totalComDesconto: number;
  economia: number;
}

const PixManutencaoModal = ({
  open,
  onClose,
  onIrParaCartao,
  totalOriginal,
  totalComDesconto,
  economia,
}: PixManutencaoModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-muted max-w-md mx-auto flex flex-col animate-in fade-in duration-200">
      {/* Header padrão do sistema */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Voltar"
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">PIX indisponível</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Aviso de manutenção */}
        <div className="bg-card rounded-xl p-4 mb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground text-sm leading-tight">
              PIX temporariamente em manutenção
            </h2>
            <p className="text-card-foreground/60 text-xs mt-1 leading-relaxed">
              Não foi possível gerar o seu código PIX agora. Nossa equipe já está trabalhando para
              normalizar o serviço.
            </p>
          </div>
        </div>

        {/* Oferta de compensação */}
        <div className="bg-card rounded-xl p-5 mb-3">
          <div className="flex items-center gap-1.5 bg-accent/15 text-accent px-2.5 py-1 rounded-full text-[11px] font-bold w-fit mb-3">
            <Zap className="w-3 h-3" />
            COMPENSAÇÃO EXCLUSIVA
          </div>

          <h3 className="text-card-foreground font-bold text-lg leading-tight mb-1.5">
            Pague no cartão e ganhe{" "}
            <span className="text-accent">8% de desconto</span>
          </h3>
          <p className="text-card-foreground/60 text-xs leading-relaxed mb-4">
            Como pedido de desculpas pela indisponibilidade do PIX, liberamos um desconto exclusivo
            no pagamento via cartão. Aproveite agora.
          </p>

          {/* Resumo de valores */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Valor original</span>
              <span className="text-muted-foreground line-through">
                R$ {totalOriginal.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-accent font-medium">Desconto no cartão (8%)</span>
              <span className="text-accent font-medium">
                - R$ {economia.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-card-foreground font-semibold text-sm">Total no cartão</span>
              <span className="text-accent font-bold text-xl">
                R$ {totalComDesconto.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Selo de confiança */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground py-2">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          Pagamento 100% seguro e criptografado
        </div>
      </main>

      {/* Footer fixo padrão do sistema */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card p-4 space-y-2 border-t border-border">
        <button
          onClick={onIrParaCartao}
          className="w-full py-3.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Pagar no cartão com 8% OFF
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          Tentar PIX novamente mais tarde
        </button>
      </footer>
    </div>
  );
};

export default PixManutencaoModal;
