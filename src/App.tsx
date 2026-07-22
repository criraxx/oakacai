import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Identificacao from "./pages/Identificacao";
import Checkout from "./pages/Checkout";
import CheckoutCartao from "./pages/CheckoutCartao";
import PagamentoPix from "./pages/PagamentoPix";
import PixConfirmado from "./pages/PixConfirmado";
import OrderConfirmation from "./pages/OrderConfirmation";
import Admin from "./pages/Admin";
import CatalogoAdmin from "./pages/CatalogoAdmin";
import Pedidos from "./pages/Pedidos";
import WhatsAppRetorno from "./pages/WhatsAppRetorno";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/identificacao" element={<Identificacao />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-cartao" element={<CheckoutCartao />} />
          <Route path="/pagamento-pix" element={<PagamentoPix />} />
          <Route path="/pix-confirmado" element={<PixConfirmado />} />
          <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/catalogo" element={<CatalogoAdmin />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/whatsapp-retorno" element={<WhatsAppRetorno />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
