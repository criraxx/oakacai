import { Home, ClipboardList, ShoppingCart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useBranding } from "@/hooks/useBranding";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itens } = useCart();
  const { cor_borda_logo } = useBranding();

  const totalItens = itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0);
  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
    { icon: ShoppingCart, label: "Carrinho", path: "/carrinho", badge: totalItens > 0 ? totalItens : null },
  ];

  const activeColor = cor_borda_logo || "#16a34a";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 press-effect transition-all duration-200 ${
                  isActive ? "scale-105" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ color: isActive ? activeColor : undefined }}
              >
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  {item.badge && (
                    <span
                      key={item.badge}
                      className="badge-pop absolute -top-1 -right-2 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: activeColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
