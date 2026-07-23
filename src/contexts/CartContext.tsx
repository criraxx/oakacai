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

// Função para carregar itens do localStorage
const loadCartFromStorage = (): ItemCarrinho[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
    setItens((prev) => [...prev, { ...item, id: `item-${Date.now()}`, quantidade: item.quantidade ?? 1 }]);
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
      const qtd = item.quantidade ?? 1;
      return acc + (item.produtoPreco + item.totalAdicionais) * qtd;
    }, 0);
  };

  // Subtotal sem itens promocionais (para calcular elegibilidade da promoção)
  const getSubtotalSemPromocional = () => {
    return itens
      .filter(item => !item.isPromocional)
      .reduce((acc, item) => acc + (item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1), 0);
  };

  // Verifica se já tem item promocional no carrinho
  const temItemPromocional = () => {
    return itens.some(item => item.isPromocional);
  };

  // Verifica se pode adicionar item promocional (carrinho >= R$50 e não tem item promocional)
  const podeAdicionarPromocional = () => {
    return getSubtotalSemPromocional() >= 50 && !temItemPromocional();
  };

  // Entrega sempre grátis
  const getTotal = () => {
    return getSubtotal();
  };

  // Desconto de 6% para PIX
  const getDescontoPix = () => {
    return getSubtotal() * 0.06;
  };

  // Total com desconto PIX
  const getTotalComDesconto = () => {
    return getSubtotal() - getDescontoPix();
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
    // NÃO limpar carrinho aqui - será limpo após confirmação do pagamento
    // O carrinho será limpo em PixConfirmado.tsx ou OrderConfirmation.tsx
    return pedido;
  };

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarItem,
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
