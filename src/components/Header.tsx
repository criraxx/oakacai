import { Search, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBranding } from "@/hooks/useBranding";

const Header = () => {
  const { logo_url, cor_borda_logo } = useBranding();
  const navigate = useNavigate();

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
            onClick={() => navigate("/buscar")}
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
    </header>
  );
};

export default Header;
