import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface ItemCarrinho {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoPreco: number;
  produtoImagem: string;
  complementos: Record<string, number>; // id do complemento -> quantidade
  observacoes: string;
  totalAdicionais: number;
  isPromocional?: boolean; // indica se é item da promoção metade do preço
  quantidade?: number;
}

export interface DadosCliente {
  nome: string;
  telefone: string;
  cpf: string;
}

export interface DadosEntrega {
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  formaPagamento: "pix" | "cartao" | "dinheiro";
  troco?: number;
}

export interface Pedido {
  id: string;
  itens: ItemCarrinho[];
  dadosEntrega: DadosEntrega;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  descontoPix?: number;
  data: Date;
  status: "pendente" | "confirmado" | "preparando" | "saiu" | "entregue";
}

interface CartContextType {
  itens: ItemCarrinho[];
  adicionarItem: (item: ItemCarrinho) => void;
  atualizarItem: (id: string, dados: Partial<ItemCarrinho>) => void;
  removerItem: (id: string) => void;
  incrementarQuantidade: (id: string) => void;
  decrementarQuantidade: (id: string) => void;
  limparCarrinho: () => void;
  getSubtotal: () => number;
  getSubtotalSemPromocional: () => number; // subtotal sem itens promocionais
  getTotal: () => number;
  getDescontoPix: () => number;
  getDescontoMetadePreco: () => number;
  getTotalComDesconto: () => number;
  pedidoAtual: Pedido | null;
  finalizarPedido: (dadosEntrega: DadosEntrega) => Pedido;
  dadosCliente: DadosCliente | null;
  setDadosCliente: (dados: DadosCliente) => void;
  temItemPromocional: () => boolean;
  podeAdicionarPromocional: () => boolean;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vibe-carrinho";
const CLIENTE_STORAGE_KEY = "vibe-cliente";

// Sanitiza item vindo do storage — garante numéricos válidos para evitar NaN/R$ 0,00
const sanitizeItem = (item: any): ItemCarrinho => ({
  ...item,
  produtoPreco: Number.isFinite(Number(item?.produtoPreco)) ? Number(item.produtoPreco) : 0,
  totalAdicionais: Number.isFinite(Number(item?.totalAdicionais)) ? Number(item.totalAdicionais) : 0,
  quantidade: Number.isFinite(Number(item?.quantidade)) && Number(item.quantidade) > 0 ? Number(item.quantidade) : 1,
  complementos: item?.complementos ?? {},
  observacoes: item?.observacoes ?? "",
});

// Função para carregar itens do localStorage
const loadCartFromStorage = (): ItemCarrinho[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Descarta itens sem preço válido (>0) para não exibir R$ 0,00 no carrinho
        return parsed.map(sanitizeItem).filter((i) => i.produtoPreco > 0);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
  }
  return [];
};

// Função para carregar dados do cliente do localStorage
const loadClienteFromStorage = (): DadosCliente | null => {
  try {
    const stored = localStorage.getItem(CLIENTE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Erro ao carregar dados do cliente:", error);
  }
  return null;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [itens, setItens] = useState<ItemCarrinho[]>(loadCartFromStorage);
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [dadosCliente, setDadosClienteState] = useState<DadosCliente | null>(loadClienteFromStorage);

  // Persistir carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

  // Persistir dados do cliente no localStorage
  useEffect(() => {
    if (dadosCliente) {
      localStorage.setItem(CLIENTE_STORAGE_KEY, JSON.stringify(dadosCliente));
    }
  }, [dadosCliente]);

  const setDadosCliente = (dados: DadosCliente) => {
    setDadosClienteState(dados);
  };

  const adicionarItem = (item: ItemCarrinho) => {
    const sanitized = sanitizeItem({ ...item, id: `item-${Date.now()}` });
    // Não adiciona produto sem preço válido para evitar itens com R$ 0,00 no carrinho
    if (sanitized.produtoPreco <= 0) {
      console.warn("[Cart] tentativa de adicionar item com preço inválido", item);
      return;
    }
    setItens((prev) => [...prev, sanitized]);
  };

  const atualizarItem = (id: string, dados: Partial<ItemCarrinho>) => {
    setItens((prev) => prev.map((i) => (i.id === id ? sanitizeItem({ ...i, ...dados, id: i.id }) : i)));
  };


  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const incrementarQuantidade = (id: string) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade: (item.quantidade ?? 1) + 1 } : item
      )
    );
  };

  const decrementarQuantidade = (id: string) => {
    setItens((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const qtd = item.quantidade ?? 1;
      if (qtd <= 1) {
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) =>
        i.id === id ? { ...i, quantidade: qtd - 1 } : i
      );
    });
  };

  const limparCarrinho = () => {
    setItens([]);
  };

  const getSubtotal = () => {
    return itens.reduce((acc, item) => {
      const qtd = Number(item.quantidade) > 0 ? Number(item.quantidade) : 1;
      const preco = Number.isFinite(Number(item.produtoPreco)) ? Number(item.produtoPreco) : 0;
      const add = Number.isFinite(Number(item.totalAdicionais)) ? Number(item.totalAdicionais) : 0;
      return acc + (preco + add) * qtd;
    }, 0);
  };

  // Subtotal sem itens promocionais (para calcular elegibilidade da promoção)
  const getSubtotalSemPromocional = () => {
    return itens
      .filter(item => !item.isPromocional)
      .reduce((acc, item) => {
        const qtd = Number(item.quantidade) > 0 ? Number(item.quantidade) : 1;
        const preco = Number.isFinite(Number(item.produtoPreco)) ? Number(item.produtoPreco) : 0;
        const add = Number.isFinite(Number(item.totalAdicionais)) ? Number(item.totalAdicionais) : 0;
        return acc + (preco + add) * qtd;
      }, 0);
  };

  // Verifica se já tem item promocional no carrinho
  const temItemPromocional = () => {
    return itens.some(item => item.isPromocional);
  };

  // Verifica se pode adicionar item promocional (carrinho >= 25 € e não tem item promocional)
  const podeAdicionarPromocional = () => {
    return getSubtotalSemPromocional() >= 25 && !temItemPromocional();
  };

  // Desconto "mitad de precio" — cheapest unit vai pela metade quando subtotal (sem promocional) >= 25 €
  const getDescontoMetadePreco = () => {
    const elegiveis = itens.filter((i) => !i.isPromocional);
    if (elegiveis.length === 0) return 0;
    const subtotalSemPromo = getSubtotalSemPromocional();
    if (subtotalSemPromo < 25) return 0;
    const menorUnitario = elegiveis.reduce((min, item) => {
      const preco = Number.isFinite(Number(item.produtoPreco)) ? Number(item.produtoPreco) : 0;
      const add = Number.isFinite(Number(item.totalAdicionais)) ? Number(item.totalAdicionais) : 0;
      const unit = preco + add;
      return unit > 0 && unit < min ? unit : min;
    }, Infinity);
    if (!Number.isFinite(menorUnitario)) return 0;
    return menorUnitario / 2;
  };

  // Entrega sempre grátis
  const getTotal = () => {
    return getSubtotal() - getDescontoMetadePreco();
  };

  // Desconto de 6% para PIX (aplicado sobre total já com metade)
  const getDescontoPix = () => {
    return getTotal() * 0.06;
  };

  // Total com desconto PIX
  const getTotalComDesconto = () => {
    return getTotal() - getDescontoPix();
  };

  const finalizarPedido = (dadosEntrega: DadosEntrega): Pedido => {
    const isPix = dadosEntrega.formaPagamento === "pix";
    const descontoPix = isPix ? getDescontoPix() : 0;
    
    const pedido: Pedido = {
      id: `PED-${Date.now()}`,
      itens: [...itens],
      dadosEntrega,
      subtotal: getSubtotal(),
      taxaEntrega: 0, // Entrega grátis
      total: isPix ? getTotalComDesconto() : getTotal(),
      descontoPix: isPix ? descontoPix : undefined,
      data: new Date(),
      status: "confirmado",
    };
    setPedidoAtual(pedido);
    // Esvaziar o carrinho assim que o pedido é criado
    setItens([]);
    return pedido;
  };

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarItem,
        atualizarItem,
        removerItem,
        incrementarQuantidade,
        decrementarQuantidade,
        limparCarrinho,
        getSubtotal,
        getSubtotalSemPromocional,
        getTotal,
        getDescontoPix,
        getTotalComDesconto,
        pedidoAtual,
        finalizarPedido,
        dadosCliente,
        setDadosCliente,
        temItemPromocional,
        podeAdicionarPromocional,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
};
