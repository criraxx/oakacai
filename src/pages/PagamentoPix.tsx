import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Copy, CheckCircle, AlertCircle, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Pedido } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
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

  const pixData: PixData | undefined = location.state?.pixData;
  const pedidoId: string | undefined = location.state?.pedidoId;
  const pedidoDBId: string | undefined = location.state?.pedidoDBId;
  const pedido: Pedido | undefined = location.state?.pedido;
  const economia: number | undefined = location.state?.economia;
  const totalComDesconto: number | undefined = location.state?.totalComDesconto;

  const [status, setStatus] = useState<"pending" | "approved" | "expired">("pending");
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos em segundos
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (status !== "pending" || !pixData?.id) return;

    let isMounted = true;

    const checkPaymentStatus = async () => {
      try {
        console.log("[PIX] Verificando status do pagamento...");

        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: { paymentId: pixData.id },
        });

        if (!isMounted) return;

        if (error) {
          console.error("[PIX] Erro na verificação:", error);
          return;
        }

        console.log("[PIX] Status recebido:", data);

        if (data?.status === "paid") {
          console.log("[PIX] Pagamento confirmado! Redirecionando...");
          setStatus("approved");

          // Limpar polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Aguardar 2 segundos para mostrar animação de sucesso
          setTimeout(() => {
            if (isMounted) {
              navigate("/pix-confirmado", {
                state: {
                  pedidoId,
                  pedidoDBId,
                  pedido,
                  totalComDesconto,
                  fromPixPayment: true,
                },
              });
            }
          }, 2000);
        } else if (data?.status === "expired") {
          console.log("[PIX] Pagamento expirado");
          setStatus("expired");

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
        // Se ainda 'pending', continua o polling
      } catch (error) {
        console.error("[PIX] Erro ao verificar status:", error);
        // Não interrompe o polling em caso de erro
      }
    };

    // Verificar imediatamente após 5 segundos (dar tempo pro pagamento)
    const initialTimeout = setTimeout(() => {
      if (isMounted) {
        checkPaymentStatus();
      }
    }, 5000);

    // Depois verificar a cada 10 segundos
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

  // Redirecionar se não tiver dados do PIX
  useEffect(() => {
    if (!pixData) {
      navigate("/checkout");
    }
  }, [pixData, navigate]);

  // Timer de countdown
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

  // Copiar código PIX
  const handleCopiar = async () => {
    if (!pixData?.copiaCola) return;

    try {
      await navigator.clipboard.writeText(pixData.copiaCola);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamento",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente",
        variant: "destructive",
      });
    }
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calcular progresso do timer (0 a 100)
  const timerProgress = (timeLeft / 900) * 100;

  if (!pixData) return null;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/checkout")}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Pagamento</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-4 flex flex-col items-center">
        {/* Status messages */}
        {status === "approved" && (
          <div className="w-full bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-accent" />
            <div>
              <p className="text-accent font-semibold">Pagamento confirmado!</p>
              <p className="text-accent/80 text-sm">Redirecionando...</p>
            </div>
          </div>
        )}

        {status === "expired" && (
          <div className="w-full bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-destructive font-semibold">Tempo expirado</p>
              <p className="text-destructive/80 text-sm">Volte e gere um novo código</p>
            </div>
          </div>
        )}

        {status === "pending" && (
          <>
            {/* Título */}
            <h2 className="text-foreground font-bold text-xl mb-2 text-center">Aguardando pagamento Pix...</h2>

            {/* Valor */}
            {totalComDesconto && (
              <div className="mb-6 text-center">
                <p className="text-accent font-bold text-3xl">R$ {totalComDesconto.toFixed(2).replace(".", ",")}</p>
                {economia && economia > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Percent size={14} className="text-accent" />
                    <p className="text-accent text-sm">Você economizou R$ {economia.toFixed(2).replace(".", ",")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Timer Circular Grande */}
            <div className="relative w-40 h-40 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Círculo de fundo */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                {/* Círculo de progresso */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - timerProgress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-foreground font-bold text-3xl">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* QR Code */}
            {pixData.copiaCola && (
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <QRCodeSVG value={pixData.copiaCola} size={180} level="M" includeMargin={true} />
              </div>
            )}

            {/* Código Copia e Cola */}
            <div className="w-full">
              <p className="text-muted-foreground text-sm mb-2">Pague com Pix copia e cola:</p>

              <div className="bg-muted rounded-lg p-3 mb-3 flex items-center gap-2">
                <p className="text-foreground text-sm font-mono flex-1 truncate">
                  {pixData.copiaCola.length > 40 ? `${pixData.copiaCola.slice(0, 40)}...` : pixData.copiaCola}
                </p>
                <button
                  onClick={handleCopiar}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>

              <button
                onClick={handleCopiar}
                disabled={status !== "pending"}
                className="w-full py-3.5 bg-card text-card-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar código
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Logo iFood Pago */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <img src={ifoodPagoLogo} alt="iFood Pago" className="h-10 object-contain" />
          <p className="text-muted-foreground text-xs text-center">Pagamento seguro • Seus dados estão protegidos</p>
        </div>

        {/* Instruções */}
        <p className="text-muted-foreground text-sm text-center mt-4">
          Abra o app do seu banco e escaneie o QR Code ou cole o código PIX
        </p>
      </main>
    </div>
  );
};

export default PagamentoPix;
