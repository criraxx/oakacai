import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, QrCode, CreditCard, Loader2, Percent, Zap, MessageCircle } from "lucide-react";
import { useCart, DadosEntrega } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { trackInitiateCheckout, trackAddPaymentInfo, trackAddAddress } from "@/lib/metaPixel";
import { gaTrackBeginCheckout, gaTrackAddShippingInfo, gaTrackAddPaymentInfo } from "@/lib/googleAnalytics";
import { supabase } from "@/integrations/supabase/client";
import PixManutencaoModal from "@/components/PixManutencaoModal";

const isNomeValido = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\p{L}+(?:\s+\p{L}+)*$/u.test(trimmed);
};

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
        num_items: itens.length,
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
          quantity: 1,
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
            quantity: 1,
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
            quantity: 1,
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
          quantity: 1,
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
          adicionais: item.complementos,
          total_adicionais: item.totalAdicionais,
          total_item: item.produtoPreco + item.totalAdicionais,
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
        const itensTexto = itens.map(i => `- ${i.produtoNome}: R$ ${(i.produtoPreco + i.totalAdicionais).toFixed(2).replace(".", ",")}`).join("\n");
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
        adicionais: item.complementos,
        total_adicionais: item.totalAdicionais,
        total_item: item.produtoPreco + item.totalAdicionais,
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

  return (
    <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Finalizar Pedido</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pb-40">
        {/* Dados do Cliente */}
        <div className="bg-background p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium">{dadosCliente.nome}</p>
              <p className="text-muted-foreground text-sm">
                {dadosCliente.telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
              </p>
            </div>
            <button
              onClick={() => navigate("/identificacao")}
              className="text-accent text-sm font-medium"
            >
              Trocar
            </button>
          </div>
        </div>

        {/* Escolha como receber */}
        <div className="bg-card p-4 mb-2 mx-4 rounded-xl">
          <h2 className="text-card-foreground font-semibold text-sm mb-3">
            Escolha como receber o pedido
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setTipoEntrega("delivery")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                tipoEntrega === "delivery"
                  ? "border-accent bg-accent/10"
                  : "border-card-foreground/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                tipoEntrega === "delivery" ? "border-accent" : "border-card-foreground/40"
              }`}>
                {tipoEntrega === "delivery" && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </div>
              <span className="text-card-foreground text-sm">Cadastrar endereço</span>
            </button>
            <button
              onClick={() => setTipoEntrega("pickup")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                tipoEntrega === "pickup"
                  ? "border-accent bg-accent/10"
                  : "border-card-foreground/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                tipoEntrega === "pickup" ? "border-accent" : "border-card-foreground/40"
              }`}>
                {tipoEntrega === "pickup" && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </div>
              <span className="text-card-foreground text-sm">Buscar o pedido</span>
            </button>
          </div>
        </div>

        {/* Endereço (só mostra se delivery) */}
        {tipoEntrega === "delivery" && (
          <div className="bg-card p-4 mb-2 mx-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-accent" />
              <h2 className="text-card-foreground font-semibold text-sm">Endereço de entrega</h2>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={formatCep(formData.cep)}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  placeholder="CEP (opcional)"
                  maxLength={9}
                  className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {buscandoCep && (
                  <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-card-foreground/50" />
                )}
              </div>

              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                placeholder="Endereço (rua, avenida) *"
                className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />

              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleInputChange("numero", e.target.value)}
                  placeholder="Número *"
                  className="w-24 px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange("complemento", e.target.value)}
                  placeholder="Complemento"
                  className="flex-1 px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => handleInputChange("bairro", e.target.value)}
                placeholder="Bairro *"
                className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />

              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                placeholder="Cidade"
                className="w-full px-3 py-2.5 bg-card-foreground/10 border-0 rounded-lg text-card-foreground text-sm placeholder:text-card-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        )}

        {/* Forma de Pagamento */}
        <div className="bg-card p-4 mb-2 mx-4 rounded-xl">
            <h2 className="text-card-foreground font-semibold text-sm mb-3">
              Escolha a forma de pagamento
            </h2>
            <p className="text-card-foreground/60 text-xs mb-3">Pagar agora</p>

            <button
              onClick={() => handleInputChange("formaPagamento", "pix")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                formData.formaPagamento === "pix"
                  ? "border-accent bg-accent/10"
                  : "border-card-foreground/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.formaPagamento === "pix" ? "border-accent" : "border-card-foreground/40"
              }`}>
                {formData.formaPagamento === "pix" && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </div>
              <QrCode size={20} className="text-accent" />
              <span className="text-card-foreground text-sm flex-1 text-left">PIX</span>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded flex items-center gap-1">
                  <Zap size={10} />
                  Mais rápido
                </span>
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded">
                  6% OFF
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate("/checkout-cartao")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-card-foreground/20 transition-colors hover:border-card-foreground/40 mt-2"
            >
              <div className="w-5 h-5 rounded-full border-2 border-card-foreground/40 flex items-center justify-center" />
              <CreditCard size={20} className="text-card-foreground" />
              <span className="text-card-foreground text-sm flex-1 text-left">Cartão de Crédito</span>
            </button>

            <p className="text-card-foreground/50 text-xs text-center mt-3">
              Ao utilizar PIX, você ganha 6% de desconto!
            </p>
        </div>

        {/* Resumo do pedido */}
        <div className="bg-background p-4 mx-4 rounded-xl">
          <h2 className="text-foreground font-semibold text-sm mb-3">Resumo do pedido</h2>
          
          {itens.map((item) => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{item.produtoNome}</span>
              <span className="text-foreground">
                R$ {(item.produtoPreco + item.totalAdicionais).toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}

          <div className="border-t border-border mt-3 pt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                R$ {getSubtotal().toFixed(2).replace(".", ",")}
              </span>
            </div>
            
            {isPix && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-accent flex items-center gap-1">
                  <Percent size={14} />
                  Desconto PIX (6%)
                </span>
                <span className="text-accent font-medium">
                  -R$ {getDescontoPix().toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-base font-bold mt-2">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                R$ {(isPix ? getTotalComDesconto() : getTotal()).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Banner Privacidade */}
        <div className="mx-4 mt-4 p-3 bg-accent/10 rounded-lg">
          <p className="text-accent text-xs text-center">
            Ao fazer o pedido, você concorda com a Política de Privacidade
          </p>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card p-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-card text-card-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processando...
            </>
          ) : (
            "Finalizar Pedido"
          )}
        </button>
      </footer>
    </div>
  );
};

export default Checkout;
