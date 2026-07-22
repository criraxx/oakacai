import { Search, Share2 } from "lucide-react";
import logoOak from "@/assets/logo-oak-v2.png.asset.json";

const Header = () => {
  return <header className="bg-background relative">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-background -mt-8 bg-background shadow-sm">
            <img alt="Oak Açaí" className="w-full h-full object-cover" src={logoOak.url} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-sm leading-tight">Oak Açaí </span>
            <span className="text-muted-foreground text-xs">Florianópolis </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>;
};
export default Header;
