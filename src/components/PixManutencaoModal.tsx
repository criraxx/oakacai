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
      {/* Cabecera estándar del sistema */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Volver"
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Pago online no disponible</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Aviso de mantenimiento */}
        <div className="bg-card rounded-xl p-4 mb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground text-sm leading-tight">
              Pago online temporalmente en mantenimiento
            </h2>
            <p className="text-card-foreground/60 text-xs mt-1 leading-relaxed">
              No ha sido posible generar tu código de pago ahora mismo. Nuestro equipo ya está
              trabajando para normalizar el servicio.
            </p>
          </div>
        </div>

        {/* Oferta de compensación */}
        <div className="bg-card rounded-xl p-5 mb-3">
          <div className="flex items-center gap-1.5 bg-accent/15 text-accent px-2.5 py-1 rounded-full text-[11px] font-bold w-fit mb-3">
            <Zap className="w-3 h-3" />
            COMPENSACIÓN EXCLUSIVA
          </div>

          <h3 className="text-card-foreground font-bold text-lg leading-tight mb-1.5">
            Paga con tarjeta y consigue{" "}
            <span className="text-accent">un 8% de descuento</span>
          </h3>
          <p className="text-card-foreground/60 text-xs leading-relaxed mb-4">
            Como disculpa por la indisponibilidad del pago online, hemos habilitado un descuento
            exclusivo para el pago con tarjeta. Aprovéchalo ahora.
          </p>

          {/* Resumen de importes */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Importe original</span>
              <span className="text-muted-foreground line-through">
                {totalOriginal.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-accent font-medium">Descuento con tarjeta (8%)</span>
              <span className="text-accent font-medium">
                - {economia.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-muted-foreground font-semibold text-sm">Total con tarjeta</span>
              <span className="text-accent font-bold text-xl">
                {totalComDesconto.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          </div>
        </div>

        {/* Sello de confianza */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground py-2">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          Pago 100% seguro y cifrado
        </div>
      </main>

      {/* Pie fijo estándar del sistema */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card p-4 space-y-2 border-t border-border">
        <button
          onClick={onIrParaCartao}
          className="w-full py-3.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Pagar con tarjeta con 8% de descuento
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          Intentar el pago online más tarde
        </button>
      </footer>
    </div>
  );
};

export default PixManutencaoModal;
