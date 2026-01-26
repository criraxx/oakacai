import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import PedidoCard from "@/components/PedidoCard";
import { supabase } from "@/integrations/supabase/client";
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
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .ilike("cliente_telefone", `%${telefoneAtivo.trim()}%`)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar pedidos:", error);
        } else {
          setPedidos(data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 text-center">
          <h1 className="text-xl font-bold">Meus Pedidos</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando pedidos...</div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold">Meus Pedidos</h1>
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={telefoneBusca}
              onChange={(e) => setTelefoneBusca(e.target.value)}
              placeholder="Digite seu telefone para buscar"
              className="bg-primary-foreground text-primary placeholder:text-primary/60 border-primary/20 focus-visible:ring-primary"
              inputMode="tel"
            />
            <Button type="button" onClick={handleBuscar} variant="secondary" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ClipboardList className="w-20 h-20 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {telefoneAtivo ? "Seus pedidos aparecerão aqui" : "Busque seus pedidos pelo telefone"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {telefoneAtivo
              ? "Faça seu primeiro pedido e acompanhe o status por aqui!"
              : "Digite o telefone na barra acima e toque em buscar."}
          </p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90">
              Ver Cardápio
            </Button>
          </Link>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Meus Pedidos</h1>
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            value={telefoneBusca}
            onChange={(e) => setTelefoneBusca(e.target.value)}
            placeholder="Digite seu telefone para buscar"
            className="bg-primary-foreground text-primary placeholder:text-primary/60 border-primary/20 focus-visible:ring-primary"
            inputMode="tel"
          />
          <Button
            type="button"
            onClick={handleBuscar}
            variant="secondary"
            className="shrink-0"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {pedidos.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} />
        ))}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Pedidos;
