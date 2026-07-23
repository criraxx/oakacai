import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Copy, CheckCircle, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Pedido } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/hooks/useBranding";
import ifoodPagoLogo from "@/assets/ifood-pago.jpg";

interface PixData {
  id: string;
  copiaCola: string;
  expiresAt: string;
  secureUrl?: string;
}

const PagamentoPix = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";

  const pixData: PixData | undefined = location.state?.pixData;
  const pedidoId: string | undefined = location.state?.pedidoId;
  const pedidoDBId: string | undefined = location.state?.pedidoDBId;
  const pedido: Pedido | undefined = location.state?.pedido;
  const economia: number | undefined = location.state?.economia;
  const totalComDesconto: number | undefined = location.state?.totalComDesconto;

  const [status, setStatus] = useState<"pending" | "approved" | "expired">("pending");
  const [timeLeft, setTimeLeft] = useState(900);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling
  useEffect(() => {
    if (status !== "pending" || !pixData?.id) return;
    let isMounted = true;

    const checkPaymentStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: { paymentId: pixData.id },
        });
        if (!isMounted) return;
        if (error) return;

        if (data?.status === "paid") {
          setStatus("approved");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setTimeout(() => {
            if (isMounted) {
              navigate("/pix-confirmado", {
                state: { pedidoId, pedidoDBId, pedido, totalComDesconto, fromPixPayment: true },
              });
            }
          }, 2000);
        } else if (data?.status === "expired") {
          setStatus("expired");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (e) {
        console.error("[PIX] Erro:", e);
      }
    };

    const initialTimeout = setTimeout(() => { if (isMounted) checkPaymentStatus(); }, 5000);
    pollingRef.current = setInterval(checkPaymentStatus, 10000);
    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, pixData?.id, pedidoId, pedidoDBId, pedido, totalComDesconto, navigate]);

  useEffect(() => {
    if (!pixData) navigate("/checkout");
  }, [pixData, navigate]);

  useEffect(() => {
    if (status !== "pending" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleCopiar = async () => {
    if (!pixData?.copiaCola) return;
    try {
      await navigator.clipboard.writeText(pixData.copiaCola);
      setCopied(true);
      toast({ title: "Código copiado!", description: "Cole no seu app de pagamento" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro ao copiar", description: "Tente copiar manualmente", variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timerProgress = (timeLeft / 900) * 100;

  if (!pixData) return null;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate("/checkout")}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Pagamento Pix</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">3/3</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "100%", background: accent }} />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 pt-6 pb-6">
        {status === "approved" && (
          <div
            className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 border"
            style={{ background: `${accent}20`, borderColor: `${accent}66` }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: accent }} />
            <div>
              <p className="font-semibold text-foreground">Pagamento confirmado!</p>
              <p className="text-muted-foreground text-sm">Redirecionando...</p>
            </div>
          </div>
        )}

        {status === "expired" && (
          <div className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 border bg-destructive/10 border-destructive/30">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-destructive font-semibold">Tempo expirado</p>
              <p className="text-destructive/80 text-sm">Volte e gere um novo código</p>
            </div>
          </div>
        )}

        {status === "pending" && (
          <>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
              Escaneie para pagar
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Abra o app do seu banco e leia o QR Code abaixo.
            </p>

            {/* Card com QR Code */}
            <div className="rounded-2xl border border-border bg-card p-5 mb-4 flex flex-col items-center">
              {/* Timer inline */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
                style={{ background: `${accent}25`, color: "hsl(var(--foreground))" }}
              >
                <Clock size={14} />
                Expira em {formatTime(timeLeft)}
              </div>

              {/* Progress bar do timer */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-5">
                <div
                  className="h-full transition-all duration-1000"
                  style={{ width: `${timerProgress}%`, background: accent }}
                />
              </div>

              {/* QR */}
              <div className="bg-white rounded-xl p-3 mb-4 border border-border">
                <QRCodeSVG value={pixData.copiaCola} size={190} level="M" includeMargin={false} />
              </div>

              {/* Valor */}
              {totalComDesconto && (
                <>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Valor a pagar</span>
                  <p className="text-foreground font-bold text-[28px] leading-tight">
                    R$ {totalComDesconto.toFixed(2).replace(".", ",")}
                  </p>
                  {economia && economia > 0 && (
                    <p className="text-xs font-medium mt-0.5" style={{ color: accent }}>
                      Você economizou R$ {economia.toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Copia e cola */}
            <div className="rounded-2xl border border-border bg-card p-4 mb-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">
                Pix copia e cola
              </p>
              <div className="bg-muted rounded-lg p-3 mb-3">
                <p className="text-foreground text-xs font-mono break-all leading-relaxed">
                  {pixData.copiaCola.length > 80
                    ? `${pixData.copiaCola.slice(0, 80)}...`
                    : pixData.copiaCola}
                </p>
              </div>
              <button
                onClick={handleCopiar}
                disabled={status !== "pending"}
                className="w-full py-3.5 font-semibold rounded-xl transition-all text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
                style={{ background: accent, color: "#000" }}
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar código Pix
                  </>
                )}
              </button>
            </div>

            {/* Como pagar */}
            <div className="rounded-2xl border border-border bg-card p-4 mb-4">
              <p className="text-[13px] font-semibold text-foreground mb-3">Como pagar</p>
              <ol className="space-y-2.5">
                {[
                  "Abra o app do seu banco",
                  "Escolha pagar via Pix com QR Code ou copia e cola",
                  "Confirme e aguarde a confirmação automática",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-black"
                      style={{ background: accent }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* Rodapé de segurança */}
        <div className="mt-2 flex flex-col items-center gap-2">
          <img src={ifoodPagoLogo} alt="iFood Pago" className="h-9 object-contain opacity-90" />
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <ShieldCheck size={12} />
            Pagamento seguro • Seus dados estão protegidos
          </div>
        </div>
      </main>
    </div>
  );
};

export default PagamentoPix;
