import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Home, Store, CreditCard, Zap, Percent } from "lucide-react";
import { useCart, DadosEntrega } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { trackInitiateCheckout, trackAddPaymentInfo, trackAddAddress } from "@/lib/metaPixel";
import { gaTrackBeginCheckout, gaTrackAddShippingInfo, gaTrackAddPaymentInfo } from "@/lib/googleAnalytics";
import { supabase } from "@/integrations/supabase/client";

import OrderBumpList from "@/components/OrderBumpList";
import DownsellModal from "@/components/DownsellModal";

interface PedidoExistenteItem {
  id?: string;
  produto_nome: string;
  produto_preco?: number;
  quantidade?: number;
  total_item?: number;
  adicionais?: Record<string, number> | null;
  observacoes?: string | null;
}

interface PedidoExistenteCheckout {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf?: string | null;
  total: number;
  subtotal?: number;
  desconto_pix?: number | null;
  forma_pagamento?: string;
  tipo_entrega?: string;
  endereco_completo?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  itens?: PedidoExistenteItem[];
}

const isNomeValido = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\p{L}+(?:\s+\p{L}+)*$/u.test(trimmed);
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pedidoExistente = location.state?.pedidoExistente as PedidoExistenteCheckout | undefined;
  const isRepagamento = Boolean(pedidoExistente);
  const { toast } = useToast();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const { itens, getSubtotal, getTotal, getDescontoPix, getTotalComDesconto, finalizarPedido, dadosCliente } = useCart();




  const [tipoEntrega, setTipoEntrega] = useState<"delivery" | "pickup">("delivery");
  const [formData, setFormData] = useState<DadosEntrega>({
    nome: pedidoExistente?.cliente_nome || dadosCliente?.nome || "",
    telefone: pedidoExistente?.cliente_telefone || dadosCliente?.telefone || "",
    cep: "",
    endereco: pedidoExistente?.endereco_completo || "",
    numero: "",
    complemento: "",
    bairro: pedidoExistente?.bairro || "",
    cidade: pedidoExistente?.cidade || "",
    formaPagamento: "cartao",
    troco: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [gatewayAtivo, setGatewayAtivo] = useState<string>("umbrellapag");
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string>("");
  const modoCartaoApenas = true;
  const initiateCheckoutTracked = useRef(false);
  const paymentInfoTracked = useRef<string | null>(null);
  const addressTracked = useRef(false);
  const gaBeginCheckoutTracked = useRef(false);
  const gaShippingTracked = useRef(false);
  const gaPaymentTracked = useRef<string | null>(null);

  const isWhatsApp = gatewayAtivo === "whatsapp";

  const clienteCheckout = pedidoExistente
    ? {
        nome: pedidoExistente.cliente_nome,
        telefone: pedidoExistente.cliente_telefone,
        cpf: pedidoExistente.cliente_cpf || "",
      }
    : dadosCliente;

  const pedidoSubtotal = Number(pedidoExistente?.subtotal ?? pedidoExistente?.total ?? 0);
  const pedidoTotal = Number(pedidoExistente?.total ?? 0);
  const pedidoDescontoPix = Number(
    pedidoExistente?.desconto_pix ??
      (pedidoExistente?.forma_pagamento === "pix" ? Math.max(pedidoSubtotal - pedidoTotal, 0) : 0)
  );
  const itensResumo = pedidoExistente
    ? (pedidoExistente.itens && pedidoExistente.itens.length > 0
        ? pedidoExistente.itens.map((item, index) => {
        const quantidade = Number(item.quantidade) > 0 ? Number(item.quantidade) : 1;
        const totalItem = Number.isFinite(Number(item.total_item))
          ? Number(item.total_item)
          : (Number(item.produto_preco) || 0) * quantidade;
        return {
          id: item.id || `${pedidoExistente.id}-${index}`,
          nome: item.produto_nome || "Item do pedido",
          quantidade,
          total: totalItem,
        };
      })
        : [{ id: pedidoExistente.id, nome: pedidoExistente.numero_pedido, quantidade: 1, total: pedidoSubtotal }])
    : itens.map((item) => ({
        id: item.id,
        nome: item.produtoNome,
        quantidade: item.quantidade ?? 1,
        total: (item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1),
      }));

  // Buscar configuração via edge function segura
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config"
        );
        const data = await response.json();
        
        if (data?.gateway_pix) {
          setGatewayAtivo(data.gateway_pix);
        }
        if (data?.whatsapp_numero) {
          setNumeroWhatsAppAtivo(data.whatsapp_numero);
        }
      } catch (error) {
        console.error("Erro ao buscar config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Se o usuário veio de /pagamento-pix e clicou em voltar, intercepta o próximo
  // "voltar" para levar à home e disparar o downsell de recuperação de venda.
  useEffect(() => {
    let veioDoPix = false;
    try { veioDoPix = sessionStorage.getItem("oak_pix_flow") === "1"; } catch {}
    if (!veioDoPix) return;

    // Push dummy state para capturar o próximo popstate
    window.history.pushState({ oakDownsellTrap: true }, "");
    const onPop = () => {
      try { sessionStorage.removeItem("oak_pix_flow"); } catch {}
      navigate("/", { state: { showDownsell: true }, replace: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);


  // Redirecionar se carrinho estiver vazio (exceto no fluxo de repagamento)
  useEffect(() => {
    if (isRepagamento) return;
    if (itens.length === 0) {
      navigate("/carrinho");
    }
  }, [itens.length, navigate, isRepagamento]);

  // Redirecionar se não tiver dados do cliente (exceto no fluxo de repagamento)
  useEffect(() => {
    if (isRepagamento) return;
    if (!dadosCliente) {
      navigate("/identificacao");
    }
  }, [dadosCliente, navigate, isRepagamento]);

  // Meta Pixel: InitiateCheckout e AddPaymentInfo - Disparar apenas uma vez
  useEffect(() => {
    if (isRepagamento) return;
    if (!initiateCheckoutTracked.current && itens.length > 0) {
      trackInitiateCheckout({
        content_ids: itens.map(item => item.produtoId),
        value: getSubtotal(),
        num_items: itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0),
      });
      
      // Disparar AddPaymentInfo com a forma de pagamento inicial (PIX)
      if (!paymentInfoTracked.current) {
        trackAddPaymentInfo({
          content_ids: itens.map(item => item.produtoId),
          value: getSubtotal(),
        });
        paymentInfoTracked.current = formData.formaPagamento;
      }
      
      initiateCheckoutTracked.current = true;
    }
  }, [itens, getSubtotal, formData.formaPagamento, isRepagamento]);

  // Google Analytics: begin_checkout e add_payment_info - Disparar apenas uma vez
  useEffect(() => {
    if (isRepagamento) return;
    if (!gaBeginCheckoutTracked.current && itens.length > 0) {
      gaTrackBeginCheckout({
        items: itens.map(item => ({
          item_id: item.produtoId,
          item_name: item.produtoNome,
          price: item.produtoPreco + item.totalAdicionais,
          quantity: item.quantidade ?? 1,
        })),
        value: getSubtotal(),
      });
      
      // Disparar add_payment_info com a forma de pagamento inicial (PIX)
      if (!gaPaymentTracked.current) {
        gaTrackAddPaymentInfo({
          items: itens.map(item => ({
            item_id: item.produtoId,
            item_name: item.produtoNome,
            price: item.produtoPreco + item.totalAdicionais,
            quantity: item.quantidade ?? 1,
          })),
          value: getSubtotal(),
          payment_type: 'PIX',
        });
        gaPaymentTracked.current = formData.formaPagamento;
      }
      
      gaBeginCheckoutTracked.current = true;
    }
  }, [itens, getSubtotal, formData.formaPagamento, isRepagamento]);

  // Buscar endereço pelo CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleInputChange = (field: keyof DadosEntrega, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Buscar CEP quando completar 8 dígitos
    if (field === "cep") {
      const cepLimpo = String(value).replace(/\D/g, "");
      if (cepLimpo.length === 8) {
        buscarCep(cepLimpo);
      }
    }

    // Meta Pixel: AddAddress - Disparar quando preencher endereço completo
    if ((field === "endereco" || field === "numero" || field === "bairro") && !addressTracked.current) {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.endereco && updatedData.numero && updatedData.bairro) {
        trackAddAddress({
          content_ids: itens.map(item => item.produtoId),
          value: getSubtotal(),
        });
        addressTracked.current = true;
      }
    }

    // Google Analytics: add_shipping_info - Disparar quando preencher endereço completo
    if ((field === "endereco" || field === "numero" || field === "bairro") && !gaShippingTracked.current) {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.endereco && updatedData.numero && updatedData.bairro) {
        gaTrackAddShippingInfo({
          items: itens.map(item => ({
            item_id: item.produtoId,
            item_name: item.produtoNome,
            price: item.produtoPreco + item.totalAdicionais,
            quantity: item.quantidade ?? 1,
          })),
          value: getSubtotal(),
          shipping_tier: 'delivery',
        });
        gaShippingTracked.current = true;
      }
    }

    // Meta Pixel: AddPaymentInfo - Disparar quando mudar forma de pagamento
    if (field === "formaPagamento" && paymentInfoTracked.current !== value) {
      trackAddPaymentInfo({
        content_ids: itens.map(item => item.produtoId),
        value: getSubtotal(),
        payment_method: value as string,
      });
      paymentInfoTracked.current = value as string;
    }

    // Google Analytics: add_payment_info - Disparar quando mudar forma de pagamento
    if (field === "formaPagamento" && gaPaymentTracked.current !== value) {
      const paymentTypeMap: Record<string, string> = {
        pix: 'PIX',
        cartao: 'Cartão',
        dinheiro: 'Dinheiro',
      };
      gaTrackAddPaymentInfo({
        items: itens.map(item => ({
          item_id: item.produtoId,
          item_name: item.produtoNome,
          price: item.produtoPreco + item.totalAdicionais,
          quantity: item.quantidade ?? 1,
        })),
        value: getSubtotal(),
        payment_type: paymentTypeMap[value as string] || value as string,
      });
      gaPaymentTracked.current = value as string;
    }
  };

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleRepagamentoSubmit = async () => {
    if (!pedidoExistente) return;

    navigate("/checkout-cartao", {
      state: {
        pedidoExistente: {
          id: pedidoExistente.id,
          numero_pedido: pedidoExistente.numero_pedido,
          cliente_nome: pedidoExistente.cliente_nome,
          cliente_telefone: pedidoExistente.cliente_telefone,
          cliente_cpf: pedidoExistente.cliente_cpf || "",
          total: pedidoTotal,
        },
      },
    });
  };

  const handleSubmit = async () => {
    if (pedidoExistente) {
      await handleRepagamentoSubmit();
      return;
    }

    if (!dadosCliente || !isNomeValido(dadosCliente.nome)) {
      toast({
        title: "Nombre inválido",
        description: "Vuelva e indique un nombre válido (solo letras y espacios).",
        variant: "destructive",
      });
      navigate("/identificacao");
      return;
    }

    if (tipoEntrega === "delivery") {
      // Validação básica
      if (!formData.endereco || !formData.numero || !formData.bairro) {
        toast({
          title: "Campos obligatorios",
          description: "Rellene todos los campos de dirección",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const numeroPedido = `PED-${Date.now()}`;
      const enderecoCompleto = tipoEntrega === "delivery"
        ? `${formData.endereco}, ${formData.numero}${formData.complemento ? ` - ${formData.complemento}` : ""}`
        : "";

      const itensParaSalvar = itens.map((item) => ({
        produto_nome: item.produtoNome,
        produto_preco: item.produtoPreco,
        quantidade: item.quantidade ?? 1,
        adicionais: item.complementos,
        total_adicionais: item.totalAdicionais,
        total_item: (item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1),
        observacoes: item.observacoes || "",
      }));

      // Não cria pedido aqui — só monta o payload e passa para /checkout-cartao.
      // O pedido será criado após o pagamento aprovado.
      const pedidoPayload = {
        numero_pedido: numeroPedido,
        cliente_nome: dadosCliente?.nome || "",
        cliente_telefone: dadosCliente?.telefone || "",
        cliente_cpf: dadosCliente?.cpf || "",
        endereco_completo: enderecoCompleto,
        bairro: formData.bairro,
        cidade: formData.cidade,
        cep: formData.cep.replace(/\D/g, ""),
        tipo_entrega: tipoEntrega,
        forma_pagamento: "cartao",
        subtotal: getSubtotal(),
        desconto_pix: 0,
        total: getTotal(),
        itens: itensParaSalvar,
      };

      navigate("/checkout-cartao", {
        state: {
          numeroPedido,
          descontoCartao: 0,
          pedidoPayload,
        },
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Error al procesar el pago",
        description: error instanceof Error ? error.message : "Inténtelo de nuevo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (!isRepagamento && (itens.length === 0 || !dadosCliente)) return null;
  if (!clienteCheckout) return null;

  const totalFinal = pedidoExistente
    ? pedidoTotal
    : getSubtotal();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Pago</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">3/3</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "100%", background: accent }} />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-40">
        {/* Cliente */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <p className="text-foreground font-semibold text-[15px] truncate">{clienteCheckout.nome}</p>
            <p className="text-muted-foreground text-xs">
              {clienteCheckout.telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
            </p>
            {pedidoExistente && (
              <p className="text-muted-foreground text-[11px] mt-0.5">{pedidoExistente.numero_pedido}</p>
            )}
          </div>
          <button
            onClick={() => (pedidoExistente ? navigate("/pedidos") : navigate("/identificacao"))}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
          >
            Cambiar
          </button>
        </div>

        {!pedidoExistente && <OrderBumpList gatilho="checkout" />}
        {!pedidoExistente && <DownsellModal posicao="checkout" />}

        {/* Entrega */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Entrega
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceCard
              active={tipoEntrega === "delivery"}
              onClick={() => setTipoEntrega("delivery")}
              accent={accent}
              icon={<Home size={18} />}
              label="Entregar"
            />
            <ChoiceCard
              active={tipoEntrega === "pickup"}
              onClick={() => setTipoEntrega("pickup")}
              accent={accent}
              icon={<Store size={18} />}
              label="Recoger"
            />
          </div>
        </section>

        {/* Endereço */}
        {tipoEntrega === "delivery" && (
          <section className="mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Dirección
            </h2>
            <div className="space-y-3">
              <FieldInput
                label="Código postal"
                value={formatCep(formData.cep)}
                onChange={(v) => handleInputChange("cep", v)}
                accent={accent}
                maxLength={9}
                inputMode="numeric"
                rightAdornment={buscandoCep ? <Loader2 size={14} className="animate-spin text-muted-foreground" /> : null}
              />
              <FieldInput
                label="Calle / Avenida"
                value={formData.endereco}
                onChange={(v) => handleInputChange("endereco", v)}
                accent={accent}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <FieldInput
                    label="Número"
                    value={formData.numero}
                    onChange={(v) => handleInputChange("numero", v)}
                    accent={accent}
                  />
                </div>
                <div className="col-span-2">
                  <FieldInput
                    label="Complemento"
                    value={formData.complemento || ""}
                    onChange={(v) => handleInputChange("complemento", v)}
                    accent={accent}
                  />
                </div>
              </div>
              <FieldInput
                label="Barrio"
                value={formData.bairro}
                onChange={(v) => handleInputChange("bairro", v)}
                accent={accent}
              />
              <FieldInput
                label="Ciudad"
                value={formData.cidade}
                onChange={(v) => handleInputChange("cidade", v)}
                accent={accent}
              />
            </div>
          </section>
        )}

        {/* Pagamento */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Pago
          </h2>
          <div className="space-y-2">
            <PaymentOption
              active={formData.formaPagamento === "cartao"}
              onClick={() => handleInputChange("formaPagamento", "cartao")}
              accent={accent}
              icon={<CreditCard size={20} />}
              title="Tarjeta de crédito"
              subtitle="Débito o crédito"
            />
          </div>
          <p className="text-muted-foreground text-[11px] mt-3 ml-1">
            Pago seguro con tarjeta de crédito o débito.
          </p>
        </section>

        {/* Resumo */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Resumen
          </h2>
          <div className="rounded-2xl border border-border p-4">
            <div className="space-y-1.5">
              {itensResumo.map((item) => (
                <div key={item.id} className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground truncate pr-2">
                    {item.quantidade}x {item.nome}
                  </span>
                  <span className="text-foreground font-medium whitespace-nowrap">
                    {item.total.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {(pedidoExistente ? pedidoSubtotal : getSubtotal()).toFixed(2).replace(".", ",")} €
                </span>
              </div>
              {pedidoExistente && pedidoDescontoPix > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground/70 flex items-center gap-1">
                    <Percent size={12} /> Descuento pago online
                  </span>
                  <span className="font-medium" style={{ color: accent }}>
                    -{pedidoDescontoPix.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">
                  {totalFinal.toFixed(2).replace(".", ",")} €
                </span>
              </div>
            </div>
          </div>
        </section>

        <p className="text-muted-foreground text-[11px] text-center">
          Al continuar, usted acepta nuestra Política de Privacidad.
        </p>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-none mb-1">Total</span>
            <span className="text-base font-bold text-foreground leading-none">
              {totalFinal.toFixed(2).replace(".", ",")} €
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="ml-auto flex-1 max-w-[220px] py-3.5 font-semibold rounded-xl transition-all text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accent, color: "#000" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando
              </>
            ) : (
              <>
                Finalizar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </footer>

    </div>
  );
};

const ChoiceCard = ({
  active,
  onClick,
  accent,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  accent: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all active:scale-[0.98]"
    style={{
      borderColor: active ? accent : "hsl(var(--border))",
      borderWidth: active ? 2 : 1,
      background: active ? `${accent}18` : "transparent",
      color: "hsl(var(--foreground))",
    }}
  >
    {icon}
    {label}
  </button>
);

const FieldInput = ({
  label,
  value,
  onChange,
  accent,
  maxLength,
  inputMode,
  rightAdornment,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
  rightAdornment?: React.ReactNode;
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div
      className="relative rounded-xl border transition-all bg-background"
      style={{
        borderColor: focused ? accent : "hsl(var(--border))",
        borderWidth: focused ? 2 : 1,
      }}
    >
      <label
        className={`absolute left-3.5 pointer-events-none transition-all ${
          active
            ? "top-1.5 text-[11px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
        }`}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        inputMode={inputMode}
        className="w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] focus:outline-none"
      />
      {rightAdornment && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightAdornment}</div>
      )}
    </div>
  );
};

const PaymentOption = ({
  active,
  disabled,
  onClick,
  accent,
  icon,
  title,
  subtitle,
  badge,
  fastTag,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  fastTag?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
      disabled ? "opacity-70" : "active:scale-[0.99]"
    }`}
    style={{
      borderColor: active ? accent : "hsl(var(--border))",
      borderWidth: active ? 2 : 1,
      background: active ? `${accent}14` : "transparent",
    }}
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: active ? `${accent}30` : "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-foreground text-sm font-semibold leading-tight">{title}</p>
      {subtitle && <p className="text-muted-foreground text-[11px] mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex flex-col items-end gap-1">
      {fastTag && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1" style={{ background: `${accent}30`, color: "#000" }}>
          <Zap size={9} /> Rápido
        </span>
      )}
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: accent, color: "#000" }}>
          {badge}
        </span>
      )}
    </div>
  </button>
);

export default Checkout;
