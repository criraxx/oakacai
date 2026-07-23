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
      <header className="sticky top-0 z-20 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Buscar</h1>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="pl-10 pr-9 h-11 rounded-xl border border-input bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpar"
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {query.trim() === "" ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <Search size={32} className="text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-base font-medium text-foreground">O que você procura?</p>
            <p className="text-sm text-muted-foreground mt-1">Digite o nome de um produto</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <X size={32} className="text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-base font-medium text-foreground">Nenhum resultado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente outro termo de busca</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/produto/${p.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors active:bg-muted"
                >
                  <div className="w-[72px] h-[72px] rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Search size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-foreground leading-snug line-clamp-2">
                      {p.title}
                    </p>
                    <p
                      className="text-sm font-semibold mt-1"
                      style={{ color: cor_borda_logo || "hsl(var(--primary))" }}
                    >
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
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
