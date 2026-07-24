import { useCart } from "@/contexts/CartContext";
import SectionTitle from "./SectionTitle";

const MetadePrecoSection = () => {
  const { getSubtotalSemPromocional, getDescontoMetadePreco, itens } = useCart();

  const subtotal = getSubtotalSemPromocional();
  const isVisible = subtotal >= 25 && itens.length > 0;
  const desconto = getDescontoMetadePreco();

  if (!isVisible) return null;

  return (
    <section className="mb-4 animate-fade-in" id="metade-preco">
      <SectionTitle title="🔥 MITAD DE PRECIO (AUTOMÁTICO)" />

      <div className="mx-4 mb-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
        <p className="text-green-400 text-xs text-center font-bold">
          🎉 ¡ENHORABUENA! Has desbloqueado la promoción
        </p>
        <p className="text-green-300 text-[11px] text-center mt-1 leading-snug">
          El artículo más barato de tu pedido va a{" "}
          <strong>mitad de precio</strong> automáticamente.
        </p>
        {desconto > 0 && (
          <p className="text-green-300 text-[11px] text-center mt-1">
            Ahorro aplicado:{" "}
            <strong>{desconto.toFixed(2).replace(".", ",")} €</strong>
          </p>
        )}
      </div>
    </section>
  );
};

export default MetadePrecoSection;
