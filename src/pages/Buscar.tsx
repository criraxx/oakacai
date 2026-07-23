import { Search, X, ArrowLeft, ImageOff, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";
import { todosProdutos } from "@/data/todosProutos";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";

const normalize = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const Buscar = () => {
  const navigate = useNavigate();
  const { cor_borda_logo } = useBranding();
  const [query, setQuery] = useState("");
  const [imgErros, setImgErros] = useState<Record<string, boolean>>({});

  const resultados = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return todosProdutos
      .filter((p) => normalize(p.title).includes(q))
      .slice(0, 50);
  }, [query]);

  const sugestoes = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const unicos = new Set<string>();
    todosProdutos.forEach((p) => {
      const palavras = normalize(p.title).split(" ");
      palavras.forEach((palavra) => {
        if (palavra.startsWith(q) && palavra !== q) unicos.add(palavra);
      });
    });
    return Array.from(unicos).slice(0, 6);
  }, [query]);

  const iniciais = (title: string) =>
    title
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  const accentColor = cor_borda_logo || "#22c55e";

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col pb-24">
      <header
        className="sticky top-0 z-20 px-4 pt-5 pb-4"
        style={{
          background: `linear-gradient(180deg, ${accentColor}15 0%, transparent 100%)`,
          borderBottom: `1px solid ${accentColor}30`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Buscar</h1>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: accentColor }}
            strokeWidth={2}
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você quer hoje?"
            style={{
              borderColor: `${accentColor}50`,
            }}
            className="pl-10 pr-9 h-12 rounded-2xl bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-0"
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

        {sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {sugestoes.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-muted"
                style={{ borderColor: `${accentColor}40`, color: accentColor }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pt-4">
        {query.trim() === "" ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${accentColor}15` }}
            >
              <Search size={28} style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-foreground">O que você procura?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Digite o nome de um produto, açaí, combo...
            </p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${accentColor}15` }}
            >
              <X size={28} style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-foreground">Nenhum resultado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente outro termo de busca
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} style={{ color: accentColor }} strokeWidth={2} />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {resultados.length} resultado{resultados.length > 1 ? "s" : ""}
              </p>
            </div>

            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/produto/${p.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl text-left bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted"
                  style={{ border: `1px solid ${accentColor}20` }}
                >
                  {p.image && !imgErros[p.id] ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImgErros((prev) => ({ ...prev, [p.id]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageOff size={22} strokeWidth={1.5} />
                      <span className="text-[10px] mt-1 font-medium">
                        {iniciais(p.title)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-semibold text-card-foreground leading-snug line-clamp-2">
                    {p.title}
                  </p>
                  <p
                    className="text-base font-bold mt-1"
                    style={{ color: accentColor }}
                  >
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accentColor}15` }}
                >
                  <span style={{ color: accentColor }}>→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Buscar;
