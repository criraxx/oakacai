import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronUp, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FloatingCart = () => {
  const { itens, getSubtotal, removerItem } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (itens.length === 0) return null;

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          {/* Expanded content */}
          <AnimatePresence>

            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-background border-b border-border"
              >
                <div className="p-4 max-h-60 overflow-y-auto">
                  <h3 className="font-semibold text-foreground mb-3 text-sm">
                    Itens no carrinho ({itens.length})
                  </h3>
                  <div className="space-y-3">
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-muted rounded-lg p-2"
                      >
                        <img
                          src={item.produtoImagem}
                          alt={item.produtoNome}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.produtoNome}
                          </p>
                          <p className="text-xs text-accent font-semibold">
                            {formatPrice(item.produtoPreco + item.totalAdicionais)}
                          </p>
                        </div>
                        <button
                          onClick={() => removerItem(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main bar */}
          <div className="p-4 flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-card-foreground"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itens.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1">
              <p className="text-card-foreground font-bold text-lg">
                {formatPrice(getSubtotal())}
              </p>
            </div>

            <button
              onClick={() => navigate("/carrinho")}
              className="bg-muted text-foreground font-semibold px-5 py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm"
            >
              Ver carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;
