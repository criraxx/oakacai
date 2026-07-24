import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppRetorno = () => {
  const navigate = useNavigate();
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string>("");

  useEffect(() => {
    const fetchNumeroAtivo = async () => {
      try {
        const response = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config"
        );
        const data = await response.json();

        if (data?.whatsapp_numero) {
          setNumeroWhatsAppAtivo(data.whatsapp_numero);
        }
      } catch (error) {
        console.error("Erro ao buscar número WhatsApp:", error);
      }
    };
    fetchNumeroAtivo();
  }, []);

  const abrirWhatsApp = () => {
    if (!numeroWhatsAppAtivo) {
      return;
    }
    const mensagem = encodeURIComponent("¡Hola! Me gustaría hablar sobre mi pedido.");
    window.open(`https://wa.me/55${numeroWhatsAppAtivo}?text=${mensagem}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Pedido enviado</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
          {/* Ícone */}
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-success" />
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-card-foreground mb-3">
            ¡Pedido recibido!
          </h2>

          {/* Descrição */}
          <p className="text-muted-foreground mb-6">
            Tu pedido se ha enviado a la tienda a través de WhatsApp. Para más información o para hacer seguimiento de tu pedido, ponte en contacto con nosotros.
          </p>

          {/* Botão WhatsApp */}
          <Button
            onClick={abrirWhatsApp}
            disabled={!numeroWhatsAppAtivo}
            className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2 mb-4"
          >
            <Phone className="w-5 h-5" />
            {numeroWhatsAppAtivo ? "Hablar con la tienda" : "Cargando..."}
          </Button>

          {/* Botão Voltar */}
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Volver al inicio
          </Button>
        </div>

        {/* Informação adicional */}
        <p className="text-sm text-muted-foreground mt-6 text-center">
          Si no has podido enviar el mensaje, haz clic en el botón de arriba para ponerte en contacto directamente.
        </p>
      </main>
    </div>
  );
};

export default WhatsAppRetorno;
