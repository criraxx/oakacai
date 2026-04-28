import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle, CreditCard, ShieldCheck, Zap } from "lucide-react";

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
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 border-0">
        {/* Topo de alerta */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base leading-tight">
              PIX temporariamente indisponível
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              Nosso sistema PIX está em manutenção no momento. Não foi possível gerar o seu código.
            </p>
          </div>
        </div>

        {/* Oferta principal */}
        <div className="p-5">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 bg-accent/15 text-accent px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5" />
              OFERTA EXCLUSIVA AGORA
            </div>
            <h3 className="text-foreground font-bold text-lg leading-tight">
              Pague no cartão e ganhe <span className="text-accent">8% de desconto</span>
            </h3>
            <p className="text-muted-foreground text-xs mt-1.5">
              Como compensação pela indisponibilidade do PIX, liberamos um desconto exclusivo no cartão.
            </p>
          </div>

          {/* Card de valores */}
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground line-through">
                R$ {totalOriginal.toFixed(2).replace(".", ",")}
              </span>
              <span className="px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded">
                -8%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold text-sm">Total no cartão</span>
              <span className="text-accent font-bold text-2xl">
                R$ {totalComDesconto.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-center gap-1.5 text-xs text-accent font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Você economiza R$ {economia.toFixed(2).replace(".", ",")}
            </div>
          </div>

          {/* Botões */}
          <button
            onClick={onIrParaCartao}
            className="w-full py-3.5 bg-accent text-accent-foreground font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base shadow-lg shadow-accent/20"
          >
            <CreditCard className="w-5 h-5" />
            Pagar no cartão com 8% OFF
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 mt-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            Tentar PIX novamente mais tarde
          </button>

          {/* Selo confiança */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            Pagamento seguro e criptografado
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixManutencaoModal;
