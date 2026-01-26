import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppRetorno = () => {
  const navigate = useNavigate();
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string>("");

  useEffect(() => {
    const fetchNumeroAtivo = async () => {
      const { data } = await supabase
        .from("numeros_whatsapp")
        .select("numero")
        .eq("ativo", true)
        .maybeSingle();

      if (data?.numero) {
        setNumeroWhatsAppAtivo(data.numero);
      }
    };
    fetchNumeroAtivo();
  }, []);

  const abrirWhatsApp = () => {
    if (!numeroWhatsAppAtivo) {
      return;
    }
    const mensagem = encodeURIComponent("Olá! Gostaria de falar sobre meu pedido.");
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
          <h1 className="text-foreground font-semibold text-lg">Pedido Enviado</h1>
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
            Pedido Recebido!
          </h2>

          {/* Descrição */}
          <p className="text-muted-foreground mb-6">
            Seu pedido foi enviado para a loja via WhatsApp. Para mais informações ou acompanhar seu pedido, entre em contato conosco.
          </p>

          {/* Botão WhatsApp */}
          <Button
            onClick={abrirWhatsApp}
            disabled={!numeroWhatsAppAtivo}
            className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2 mb-4"
          >
            <Phone className="w-5 h-5" />
            {numeroWhatsAppAtivo ? "Falar com a Loja" : "Carregando..."}
          </Button>

          {/* Botão Voltar */}
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>

        {/* Informação adicional */}
        <p className="text-sm text-muted-foreground mt-6 text-center">
          Se você não conseguiu enviar a mensagem, clique no botão acima para entrar em contato diretamente.
        </p>
      </main>
    </div>
  );
};

export default WhatsAppRetorno;
