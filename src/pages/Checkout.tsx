import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RepagamentoCheckout } from "./RepagamentoCheckout";
import { ArrowLeft, ArrowRight, Loader2, Home, Store, QrCode, CreditCard, Zap, Percent } from "lucide-react";
import { useCart, DadosEntrega } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { trackInitiateCheckout, trackAddPaymentInfo, trackAddAddress } from "@/lib/metaPixel";
import { gaTrackBeginCheckout, gaTrackAddShippingInfo, gaTrackAddPaymentInfo } from "@/lib/googleAnalytics";
import { supabase } from "@/integrations/supabase/client";
import PixManutencaoModal from "@/components/PixManutencaoModal";
import OrderBumpList from "@/components/OrderBumpList";
import DownsellModal from "@/components/DownsellModal";

const isNomeValido = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\p{L}+(?:\s+\p{L}+)*$/u.test(trimmed);
};

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const { itens, getSubtotal, getTotal, getDescontoPix, getTotalComDesconto, finalizarPedido, dadosCliente } = useCart();

  const [tipoEntrega, setTipoEntrega] = useState<"delivery" | "pickup">("delivery");
  const [formData, setFormData] = useState<DadosEntrega>({
    nome: dadosCliente?.nome || "",
    telefone: dadosCliente?.telefone || "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    formaPagamento: "pix",
    troco: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [gatewayAtivo, setGatewayAtivo] = useState<string>("umbrellapag");
  const [numeroWhatsAppAtivo, setNumeroWhatsAppAtivo] = useState<string>("");
  const [modoCartaoApenas, setModoCartaoApenas] = useState<boolean>(false);
  const [showPixManutencao, setShowPixManutencao] = useState<boolean>(false);
  const initiateCheckoutTracked = useRef(false);
  const paymentInfoTracked = useRef<string | null>(null);
  const addressTracked = useRef(false);
  const gaBeginCheckoutTracked = useRef(false);
  const gaShippingTracked = useRef(false);
  const gaPaymentTracked = useRef<string | null>(null);

  const isWhatsApp = gatewayAtivo === "whatsapp";
  const isPix = formData.formaPagamento === "pix";

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
        if (typeof data?.modo_cartao_apenas === "boolean") {
          setModoCartaoApenas(data.modo_cartao_apenas);
        }
      } catch (error) {
        console.error("Erro ao buscar config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Redirecionar se carrinho estiver vazio
  useEffect(() => {
    if (itens.length === 0) {
      navigate("/carrinho");
    }
  }, [itens.length, navigate]);

  // Redirecionar se não tiver dados do cliente
  useEffect(() => {
    if (!dadosCliente) {
      navigate("/identificacao");
    }
  }, [dadosCliente, navigate]);

  // Meta Pixel: InitiateCheckout e AddPaymentInfo - Disparar apenas uma vez
  useEffect(() => {
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
  }, [itens, getSubtotal, formData.formaPagamento]);

  // Google Analytics: begin_checkout e add_payment_info - Disparar apenas uma vez
  useEffect(() => {
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
  }, [itens, getSubtotal, formData.formaPagamento]);

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

  const handleSubmit = async () => {
    if (!dadosCliente || !isNomeValido(dadosCliente.nome)) {
      toast({
        title: "Nome inválido",
        description: "Volte e informe um nome válido (apenas letras e espaços).",
        variant: "destructive",
      });
      navigate("/identificacao");
      return;
    }

    if (tipoEntrega === "delivery") {
      // Validação básica
      if (!formData.endereco || !formData.numero || !formData.bairro) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos de endereço",
          variant: "destructive",
        });
        return;
      }
    }

    // Modo Cartão Apenas: bloquear PIX e abrir modal persuasivo
    if (modoCartaoApenas && formData.formaPagamento === "pix") {
      setShowPixManutencao(true);
      return;
    }

    // Forma de pagamento cartão: ir para tela do cartão (com desconto se modo ativo)
    if (formData.formaPagamento === "cartao") {
      navigate("/checkout-cartao", modoCartaoApenas ? { state: { descontoCartao: 0.08 } } : undefined);
      return;
    }

    setLoading(true);

    try {
      // Gerar número do pedido
      const numeroPedido = `PED-${Date.now()}`;
      
      // Salvar pedido no banco de dados primeiro
      const enderecoCompleto = tipoEntrega === "delivery" 
        ? `${formData.endereco}, ${formData.numero}${formData.complemento ? ` - ${formData.complemento}` : ""}`
        : "";

      // Se for WhatsApp + PIX, redirecionar para o WhatsApp diretamente
      if (isWhatsApp && formData.formaPagamento === "pix") {
        if (!numeroWhatsAppAtivo) {
          toast({
            title: "Erro",
            description: "Nenhum número de WhatsApp ativo. Entre em contato com a loja.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Salvar pedido via edge function segura
        const itensParaSalvar = itens.map((item) => ({
          produto_nome: item.produtoNome,
          produto_preco: item.produtoPreco,
          quantidade: item.quantidade ?? 1,
          adicionais: item.complementos,
          total_adicionais: item.totalAdicionais,
          total_item: (item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1),
          observacoes: item.observacoes || "",
        }));

        const pedidoResponse = await fetch(
          "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/criar-pedido",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              numero_pedido: numeroPedido,
              cliente_nome: dadosCliente?.nome || "",
              cliente_telefone: dadosCliente?.telefone || "",
              cliente_cpf: dadosCliente?.cpf || "",
              endereco_completo: enderecoCompleto,
              bairro: formData.bairro,
              cidade: formData.cidade,
              cep: formData.cep.replace(/\D/g, ""),
              tipo_entrega: tipoEntrega,
              forma_pagamento: "pix",
              status_pagamento: "pendente",
              status_pedido: "pendente",
              subtotal: getSubtotal(),
              desconto_pix: getDescontoPix(),
              total: getTotalComDesconto(),
              payment_id: null,
              pix_copia_e_cola: null,
              pix_expires_at: null,
              itens: itensParaSalvar,
            }),
          }
        );

        const pedidoResult = await pedidoResponse.json();

        if (!pedidoResult.success) {
          console.error("[Checkout] Erro ao salvar pedido:", pedidoResult.error);
          throw new Error("Erro ao salvar pedido");
        }

        // Montar mensagem do WhatsApp
        const itensTexto = itens.map(i => `- ${i.quantidade ?? 1}x ${i.produtoNome}: R$ ${((i.produtoPreco + i.totalAdicionais) * (i.quantidade ?? 1)).toFixed(2).replace(".", ",")}`).join("\n");
        const enderecoTexto = tipoEntrega === "delivery" 
          ? `\n📍 *Endereço:* ${enderecoCompleto}, ${formData.bairro} - ${formData.cidade}`
          : "\n🏪 *Retirada no local*";
        
        const mensagem = `🛒 *NOVO PEDIDO - ${numeroPedido}*\n\n` +
          `👤 *Cliente:* ${dadosCliente?.nome}\n` +
          `📞 *Telefone:* ${dadosCliente?.telefone}\n` +
          enderecoTexto + `\n\n` +
          `📋 *Itens:*\n${itensTexto}\n\n` +
          `💰 *Total:* R$ ${getTotalComDesconto().toFixed(2).replace(".", ",")}`;

        const urlWhatsApp = `https://wa.me/55${numeroWhatsAppAtivo}?text=${encodeURIComponent(mensagem)}`;
        
        window.open(urlWhatsApp, "_blank");
        
        // Navegar para página de retorno
        navigate("/whatsapp-retorno");
        setLoading(false);
        return;
      }

      // Primeiro criar o pagamento PIX para obter o payment_id
      let paymentId: string | undefined;
      let pixResponse: any = null;
      
      if (formData.formaPagamento === "pix") {
        const valorComDesconto = getTotalComDesconto();
        
        console.log('[Checkout] === INICIANDO PAGAMENTO PIX ===');
        console.log('[Checkout] Valor:', valorComDesconto);
        
        // Chamar edge function unificada de pagamento PIX
        const { data: response, error: pixError } = await supabase.functions.invoke("create-pix-payment", {
          body: {
            valor: valorComDesconto,
            descricao: `Pedido Açaí: ${itens.map(i => i.produtoNome).join(", ")}`,
            nome: dadosCliente?.nome || "",
            telefone: dadosCliente?.telefone || "",
            cpf: dadosCliente?.cpf || "",
            email: `${(dadosCliente?.telefone || "").replace(/\D/g, "")}@cliente.local`,
          },
        });

        console.log('[Checkout] === RESPOSTA RECEBIDA ===');
        console.log('[Checkout] Response completa:', JSON.stringify(response, null, 2));

        if (pixError || !response?.success) {
          throw new Error(response?.error || pixError?.message || 'Erro ao criar pagamento PIX');
        }
        
        // Verificar se tem código PIX (obrigatório)
        if (!response.pixCopiaECola) {
          throw new Error('Código PIX não gerado. Tente novamente.');
        }
        
        // Extrair paymentId
        console.log('[Checkout] === EXTRAINDO PAYMENT ID ===');
        console.log('[Checkout] response.paymentId:', response.paymentId);
        
        if (response.paymentId !== undefined && response.paymentId !== null && response.paymentId !== '') {
          paymentId = String(response.paymentId);
          console.log('[Checkout] paymentId extraído:', paymentId);
        } else {
          throw new Error('ID do pagamento não retornado. Tente novamente.');
        }
        
        console.log('[Checkout] === PAYMENT ID FINAL ===');
        console.log('[Checkout] paymentId:', paymentId);
        
        // Salvar dados do PIX para uso posterior
        pixResponse = response;
      }

      // Salvar pedido via edge function segura
      const itensParaSalvar = itens.map((item) => ({
        produto_nome: item.produtoNome,
        produto_preco: item.produtoPreco,
        quantidade: item.quantidade ?? 1,
        adicionais: item.complementos,
        total_adicionais: item.totalAdicionais,
        total_item: (item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1),
        observacoes: item.observacoes || "",
      }));

      const pedidoResponse = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/criar-pedido",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero_pedido: numeroPedido,
            cliente_nome: dadosCliente?.nome || "",
            cliente_telefone: dadosCliente?.telefone || "",
            cliente_cpf: dadosCliente?.cpf || "",
            endereco_completo: enderecoCompleto,
            bairro: formData.bairro,
            cidade: formData.cidade,
            cep: formData.cep.replace(/\D/g, ""),
            tipo_entrega: tipoEntrega,
            forma_pagamento: formData.formaPagamento,
            status_pagamento: "pendente",
            status_pedido: "pendente",
            subtotal: getSubtotal(),
            desconto_pix: formData.formaPagamento === "pix" ? getDescontoPix() : 0,
            total: formData.formaPagamento === "pix" ? getTotalComDesconto() : getTotal(),
            payment_id: paymentId,
            pix_copia_e_cola: pixResponse?.pixCopiaECola || null,
            pix_expires_at: pixResponse?.expiresAt || null,
            itens: itensParaSalvar,
          }),
        }
      );

      const pedidoResult = await pedidoResponse.json();

      console.log('[Checkout] === INSERINDO PEDIDO NO BANCO ===');
      console.log('[Checkout] payment_id sendo inserido:', paymentId);

      if (!pedidoResult.success) {
        console.error("[Checkout] Erro ao salvar pedido:", pedidoResult.error);
        throw new Error("Erro ao salvar pedido");
      }

      const pedidoDB = pedidoResult.pedido;

      console.log('[Checkout] === PEDIDO SALVO COM SUCESSO ===');
      console.log('[Checkout] pedidoDB.id:', pedidoDB.id);

      if (formData.formaPagamento === "pix" && pixResponse) {
        const pedido = finalizarPedido(formData);
        
        // Redirecionar para página de pagamento PIX (Purchase será disparado lá)
        navigate("/pagamento-pix", { 
          state: { 
            pixData: {
              id: pixResponse.paymentId,
              copiaCola: pixResponse.pixCopiaECola,
              expiresAt: pixResponse.expiresAt,
              secureUrl: pixResponse.checkoutUrl,
            },
            pedidoId: pedido.id,
            pedidoDBId: pedidoDB.id,
            pedido: pedido,
            economia: getDescontoPix(),
            totalComDesconto: getTotalComDesconto(),
          } 
        });
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0 || !dadosCliente) return null;

  const totalFinal = modoCartaoApenas
    ? getSubtotal() * 0.92
    : isPix
    ? getTotalComDesconto()
    : getTotal();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Pagamento</h1>
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
            <p className="text-foreground font-semibold text-[15px] truncate">{dadosCliente.nome}</p>
            <p className="text-muted-foreground text-xs">
              {dadosCliente.telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
            </p>
          </div>
          <button
            onClick={() => navigate("/identificacao")}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
          >
            Trocar
          </button>
        </div>

        <OrderBumpList gatilho="checkout" />
        <DownsellModal posicao="checkout" />

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
              label="Retirar"
            />
          </div>
        </section>

        {/* Endereço */}
        {tipoEntrega === "delivery" && (
          <section className="mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Endereço
            </h2>
            <div className="space-y-3">
              <FieldInput
                label="CEP"
                value={formatCep(formData.cep)}
                onChange={(v) => handleInputChange("cep", v)}
                accent={accent}
                maxLength={9}
                inputMode="numeric"
                rightAdornment={buscandoCep ? <Loader2 size={14} className="animate-spin text-muted-foreground" /> : null}
              />
              <FieldInput
                label="Rua / Avenida"
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
                label="Bairro"
                value={formData.bairro}
                onChange={(v) => handleInputChange("bairro", v)}
                accent={accent}
              />
              <FieldInput
                label="Cidade"
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
            Pagamento
          </h2>
          <div className="space-y-2">
            <PaymentOption
              active={formData.formaPagamento === "pix" && !modoCartaoApenas}
              disabled={modoCartaoApenas}
              onClick={() => {
                if (modoCartaoApenas) return setShowPixManutencao(true);
                handleInputChange("formaPagamento", "pix");
              }}
              accent={accent}
              icon={<QrCode size={20} />}
              title="PIX"
              subtitle={modoCartaoApenas ? "Em manutenção" : "Aprovação imediata"}
              badge={!modoCartaoApenas ? "6% OFF" : undefined}
              fastTag={!modoCartaoApenas}
            />
            <PaymentOption
              active={formData.formaPagamento === "cartao"}
              onClick={() => handleInputChange("formaPagamento", "cartao")}
              accent={accent}
              icon={<CreditCard size={20} />}
              title="Cartão de crédito"
              subtitle="Débito ou crédito"
              badge={modoCartaoApenas ? "8% OFF" : undefined}
            />
          </div>
          <p className="text-muted-foreground text-[11px] mt-3 ml-1">
            {modoCartaoApenas
              ? "PIX em manutenção. Cartão com 8% de desconto."
              : "PIX com 6% de desconto no total."}
          </p>
        </section>

        {/* Resumo */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Resumo
          </h2>
          <div className="rounded-2xl border border-border p-4">
            <div className="space-y-1.5">
              {itens.map((item) => (
                <div key={item.id} className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground truncate pr-2">
                    {item.quantidade ?? 1}x {item.produtoNome}
                  </span>
                  <span className="text-foreground font-medium whitespace-nowrap">
                    R$ {((item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1)).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">R$ {getSubtotal().toFixed(2).replace(".", ",")}</span>
              </div>
              {isPix && !modoCartaoApenas && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground/70 flex items-center gap-1">
                    <Percent size={12} /> Desconto PIX
                  </span>
                  <span className="font-medium" style={{ color: accent }}>
                    -R$ {getDescontoPix().toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              {modoCartaoApenas && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground/70 flex items-center gap-1">
                    <Percent size={12} /> Desconto cartão
                  </span>
                  <span className="font-medium" style={{ color: accent }}>
                    -R$ {(getSubtotal() * 0.08).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">
                  R$ {totalFinal.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <p className="text-muted-foreground text-[11px] text-center">
          Ao continuar, você concorda com nossa Política de Privacidade.
        </p>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-none mb-1">Total</span>
            <span className="text-base font-bold text-foreground leading-none">
              R$ {totalFinal.toFixed(2).replace(".", ",")}
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
                Processando
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

      <PixManutencaoModal
        open={showPixManutencao}
        onClose={() => setShowPixManutencao(false)}
        onIrParaCartao={() => {
          setShowPixManutencao(false);
          navigate("/checkout-cartao", { state: { descontoCartao: 0.08 } });
        }}
        totalOriginal={getTotal()}
        totalComDesconto={getTotal() * 0.92}
        economia={getTotal() * 0.08}
      />
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
