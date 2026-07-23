import { Search, Share2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBranding } from "@/hooks/useBranding";
import { useCatalogo } from "@/hooks/useCatalogo";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Header = () => {
  const { logo_url, cor_borda_logo } = useBranding();
  const navigate = useNavigate();
  const { data: catalogo } = useCatalogo();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !catalogo?.produtos) return [];
    return catalogo.produtos
      .filter((p) => p.ativo && p.nome.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, catalogo]);

  const handleShare = async () => {
    const url = window.location.origin;
    const shareData = {
      title: "Oak Açaí",
      text: "Confira o cardápio da Oak Açaí!",
      url,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData) !== false) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("share-unavailable");
    } catch (err) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!", { description: url });
      } catch {
        toast.error("Não foi possível compartilhar");
      }
    }
  };

  const abrirProduto = (id: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(`/produto/${id}`);
  };

  return (
    <header className="bg-background relative">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 -mt-8 bg-background shadow-sm"
            style={{ border: `3px solid ${cor_borda_logo}` }}
          >
            <img alt="Oak Açaí" className="w-full h-full object-cover" src={logo_url} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-sm leading-tight">Oak Açaí </span>
            <span className="text-muted-foreground text-xs">Florianópolis </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Pesquisar produtos"
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground transition-all active:scale-95 shadow-sm"
            style={{ border: `1.5px solid ${cor_borda_logo}` }}
          >
            <Search size={18} strokeWidth={2} />
          </button>
          <button
            aria-label="Compartilhar"
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground transition-all active:scale-95 shadow-sm"
            style={{ border: `1.5px solid ${cor_borda_logo}` }}
          >
            <Share2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          className="top-4 translate-y-0 sm:top-[10%] p-0 gap-0 max-w-lg overflow-hidden rounded-2xl border-0 shadow-2xl bg-background"
          style={{ borderTop: `4px solid ${cor_borda_logo}` }}
        >
          {/* Header do modal */}
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Oak Açaí • Cardápio
            </p>
            <h2 className="text-foreground font-bold text-lg">O que você procura?</h2>
          </div>

          {/* Campo de busca */}
          <div className="px-5 pb-4">
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

          {/* Resultados */}
          <div className="max-h-[60vh] overflow-y-auto border-t border-border">
            {query.trim() === "" ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${cor_borda_logo}40` }}
                >
                  <Search size={22} className="text-foreground/70" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-foreground">Comece a digitar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Encontre seus produtos favoritos
                </p>
              </div>
            ) : resultados.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <X size={22} className="text-muted-foreground" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-foreground">Nada encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tente buscar por outro nome
                </p>
              </div>
            ) : (
              <ul className="p-2">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => abrirProduto(p.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-all text-left active:scale-[0.99]"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center relative"
                        style={{
                          border: `1.5px solid ${cor_borda_logo}`,
                          background: `linear-gradient(135deg, ${cor_borda_logo}22, ${cor_borda_logo}44)`,
                        }}
                      >
                        {p.imagem ? (
                          <img
                            src={p.imagem}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = "none";
                              const fb = img.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="absolute inset-0 items-center justify-center text-[10px] font-black uppercase tracking-tight text-center px-1"
                          style={{
                            display: p.imagem ? "none" : "flex",
                            color: cor_borda_logo,
                          }}
                        >
                          {p.nome.slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-accent font-bold mt-0.5">
                          R$ {p.preco.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs font-medium">Ver →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rodapé sutil */}
          {resultados.length > 0 && (
            <div className="px-5 py-2 bg-muted/40 text-center border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
};
export default Header;
