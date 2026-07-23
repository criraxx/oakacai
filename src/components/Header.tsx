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
        <DialogContent className="top-4 translate-y-0 sm:top-[10%] p-0 gap-0 max-w-lg overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search size={18} className="text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="border-0 focus-visible:ring-0 shadow-none px-1"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Limpar"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {query.trim() === "" ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Digite o nome de um produto
              </p>
            ) : resultados.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado
              </p>
            ) : (
              <ul>
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => abrirProduto(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      {p.imagem && (
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {p.preco.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
export default Header;
