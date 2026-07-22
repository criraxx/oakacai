import { useEffect, useState } from "react";
import { ClipboardList, Search, ArrowLeft, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import PedidoCard from "@/components/PedidoCard";
import { useCart } from "@/contexts/CartContext";

interface PedidoDB {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string | null;
  total: number;
  subtotal: number;
  desconto_pix: number | null;
  forma_pagamento: string;
  tipo_entrega: string;
  status_pagamento: string;
  status_pedido: string;
  endereco_completo: string | null;
  bairro: string | null;
  cidade: string | null;
  created_at: string;
  payment_id: string | null;
}

const Pedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const { dadosCliente } = useCart();

  const [telefoneBusca, setTelefoneBusca] = useState("");
  const [telefoneAtivo, setTelefoneAtivo] = useState<string>("");

  useEffect(() => {
    if (dadosCliente?.telefone && !telefoneBusca) {
      setTelefoneBusca(dadosCliente.telefone);
      setTelefoneAtivo(dadosCliente.telefone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosCliente?.telefone]);

  useEffect(() => {
    const buscarPedidos = async () => {
      if (!telefoneAtivo?.trim()) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-pedidos",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telefone: telefoneAtivo.trim() }),
          }
        );

        const result = await response.json();

        if (result.error) {
          console.error("Erro ao buscar pedidos:", result.error);
          setPedidos([]);
        } else {
          setPedidos(result.pedidos || []);
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    buscarPedidos();
  }, [telefoneAtivo]);

  const handleBuscar = () => {
    setLoading(true);
    setPedidos([]);
    setTelefoneAtivo(telefoneBusca);
  };

  const Header = () => (
    <header className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Meus Pedidos</h1>
        </div>
        {pedidos.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
          </span>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={telefoneBusca}
              onChange={(e) => setTelefoneBusca(e.target.value)}
              placeholder="Buscar pelo seu telefone"
              className="pl-9 bg-muted border-border"
              inputMode="tel"
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            />
          </div>
          <Button
            type="button"
            onClick={handleBuscar}
            className="shrink-0 bg-card text-card-foreground hover:opacity-90"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-pulse text-muted-foreground text-sm">Carregando pedidos...</div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-24 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ClipboardList size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-foreground font-semibold text-lg mb-2">
            {telefoneAtivo ? "Nenhum pedido encontrado" : "Busque seus pedidos"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {telefoneAtivo
              ? "Faça seu primeiro pedido e acompanhe o status por aqui!"
              : "Digite seu telefone na barra acima para ver seu histórico."}
          </p>
          <Link to="/">
            <button className="px-6 py-3 bg-card text-card-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Ver cardápio
            </button>
          </Link>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      <Header />
      <main className="flex-1 p-4 space-y-3 pb-24">
        {pedidos.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} />
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Pedidos;
