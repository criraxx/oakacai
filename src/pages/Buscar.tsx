import { Search, X, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";
import { todosProdutos } from "@/data/todosProutos";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";

const Buscar = () => {
  const navigate = useNavigate();
  const { cor_borda_logo } = useBranding();
  const [query, setQuery] = useState("");

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return todosProdutos
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query]);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col pb-24">
      <header
        className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border"
        style={{ borderBottomColor: `${cor_borda_logo}55` }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted transition-all active:scale-95"
            style={{ border: `1.5px solid ${cor_borda_logo}` }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Oak Açaí • Cardápio
            </p>
            <h1 className="text-foreground font-bold text-base leading-tight">O que você procura?</h1>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 transition-all focus-within:bg-muted focus-within:ring-2"
            style={{ ["--tw-ring-color" as any]: cor_borda_logo }}
          >
            <Search size={18} className="text-muted-foreground flex-shrink-0" strokeWidth={2.2} />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar açaí, sorvete, complemento..."
              className="border-0 focus-visible:ring-0 shadow-none px-0 h-auto py-0 bg-transparent text-sm placeholder:text-muted-foreground/70"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors flex-shrink-0"
                aria-label="Limpar"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {query.trim() === "" ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${cor_borda_logo}40` }}
            >
              <Search size={26} className="text-foreground/70" strokeWidth={2} />
            </div>
            <p className="text-base font-semibold text-foreground">Comece a digitar</p>
            <p className="text-sm text-muted-foreground mt-1">Encontre seus produtos favoritos</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <X size={26} className="text-muted-foreground" strokeWidth={2} />
            </div>
            <p className="text-base font-semibold text-foreground">Nada encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro nome</p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/produto/${p.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card hover:bg-muted transition-all text-left active:scale-[0.99] border border-border"
                >
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 bg-muted overflow-hidden flex items-center justify-center"
                    style={{ border: `1.5px solid ${cor_borda_logo}` }}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Search size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{p.title}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: cor_borda_logo }}>
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs font-medium">Ver →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Buscar;
