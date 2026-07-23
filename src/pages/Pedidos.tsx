import { useEffect, useState } from "react";
import { ClipboardList, Search, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import PedidoCard from "@/components/PedidoCard";
import { useCart } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";

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

const formatTelefone = (value: string) => {
  const n = value.replace(/\D/g, "");
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
};

const Pedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const { dadosCliente } = useCart();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";

  const [telefoneBusca, setTelefoneBusca] = useState("");
  const [telefoneAtivo, setTelefoneAtivo] = useState<string>("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (dadosCliente?.telefone && !telefoneBusca) {
      const formatted = formatTelefone(dadosCliente.telefone);
      setTelefoneBusca(formatted);
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
    const clean = telefoneBusca.replace(/\D/g, "");
    if (clean.length < 10) return;
    setLoading(true);
    setPedidos([]);
    setTelefoneAtivo(clean);
  };

  const telValid = telefoneBusca.replace(/\D/g, "").length >= 10;
  const active = focused || telefoneBusca.length > 0;

  const Header = () => (
    <header className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-foreground font-semibold text-base">Meus pedidos</h1>
        {pedidos.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
          </span>
        )}
      </div>
      <div className="h-1 bg-muted">
        <div className="h-full transition-all" style={{ width: telValid ? "100%" : "35%", background: accent }} />
      </div>

      <div className="px-4 pt-4 pb-4">
        <div className="flex gap-2 items-stretch">
          <div
            className="relative flex-1 rounded-xl border transition-all bg-background"
            style={{
              borderColor: focused ? accent : "hsl(var(--border))",
              borderWidth: focused ? 2 : 1,
            }}
          >
            <label
              htmlFor="tel-busca"
              className={`absolute left-3.5 pointer-events-none transition-all ${
                active
                  ? "top-1.5 text-[11px] font-medium text-muted-foreground"
                  : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
              }`}
            >
              WhatsApp
            </label>
            <input
              id="tel-busca"
              type="tel"
              inputMode="numeric"
              value={telefoneBusca}
              onChange={(e) => setTelefoneBusca(formatTelefone(e.target.value))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              placeholder={active ? "(00) 00000-0000" : ""}
              maxLength={15}
              className="w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleBuscar}
            disabled={!telValid}
            aria-label="Buscar"
            className="shrink-0 w-14 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{ background: accent, color: "#000" }}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col page-enter">
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
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: `${accent}30`, border: `1.5px solid ${accent}` }}
          >
            <ClipboardList size={36} style={{ color: accent }} />
          </div>
          <h2 className="text-foreground font-bold text-[19px] mb-2">
            {telefoneAtivo ? "Nenhum pedido encontrado" : "Busque seus pedidos"}
          </h2>
          <p className="text-muted-foreground text-sm mb-7 max-w-[280px] leading-relaxed">
            {telefoneAtivo
              ? "Não achamos pedidos com esse telefone. Faça seu primeiro pedido e acompanhe por aqui!"
              : "Digite seu WhatsApp na barra acima para ver seu histórico de pedidos."}
          </p>
          <Link to="/">
            <button
              className="px-7 py-3.5 font-semibold rounded-xl transition-all active:scale-[0.98] text-[15px]"
              style={{ background: accent, color: "#000" }}
            >
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

