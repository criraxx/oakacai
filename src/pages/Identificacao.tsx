import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, User, Phone, IdCard, Check, Lock, ShoppingBag, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { trackLead } from "@/lib/metaPixel";

const sanitizeNome = (value: string) =>
  value
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);

const isNomeValido = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\p{L}+(?:\s+\p{L}+)*$/u.test(trimmed);
};

const Identificacao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setDadosCliente, itens, getSubtotal } = useCart();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const leadTracked = useRef(false);

  useEffect(() => {
    if (itens.length === 0) {
      navigate("/carrinho");
    }
  }, [itens.length, navigate]);

  useEffect(() => {
    if (!leadTracked.current && (nome.length > 0 || telefone.length > 0)) {
      trackLead({
        content_ids: itens.map((item) => item.produtoId),
        value: getSubtotal(),
      });
      leadTracked.current = true;
    }
  }, [nome, telefone, itens, getSubtotal]);

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const validarCpf = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(numbers[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(numbers[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers[10])) return false;
    return true;
  };

  const nomeOk = isNomeValido(nome);
  const telefoneOk = telefone.replace(/\D/g, "").length >= 10;
  const cpfOk = validarCpf(cpf);
  const isFormValid = nomeOk && telefoneOk && cpfOk;

  const subtotal = useMemo(() => getSubtotal(), [getSubtotal, itens]);

  const handleContinuar = () => {
    if (!nome.trim() || !isNomeValido(nome)) {
      toast({ title: "Nome inválido", description: "Use apenas letras e espaços.", variant: "destructive" });
      return;
    }
    if (!telefoneOk) {
      toast({ title: "Telefone inválido", description: "Informe um WhatsApp válido.", variant: "destructive" });
      return;
    }
    if (!cpfOk) {
      toast({ title: "CPF inválido", description: "Informe um CPF válido.", variant: "destructive" });
      return;
    }
    setDadosCliente({
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ""),
      cpf: cpf.replace(/\D/g, ""),
    });
    navigate("/checkout");
  };

  const fieldClass = (name: string, ok: boolean, filled: boolean) =>
    `w-full pl-11 pr-11 py-4 bg-white border-2 rounded-2xl text-foreground text-base font-medium placeholder:text-muted-foreground/60 focus:outline-none transition-all ${
      focused === name
        ? "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]"
        : ok && filled
        ? "border-emerald-200"
        : "border-border/60"
    }`;

  return (
    <div
      className="min-h-screen max-w-md mx-auto flex flex-col relative"
      style={{
        background: `linear-gradient(180deg, ${accent}55 0%, ${accent}15 35%, hsl(var(--background)) 100%)`,
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground font-bold text-lg leading-tight">Seus dados</h1>
            <p className="text-muted-foreground text-xs">Etapa 2 de 3 · quase lá</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <Lock size={12} className="text-emerald-600" />
            <span className="text-[11px] font-semibold text-emerald-700">Seguro</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5">
            <Step label="Carrinho" icon={<ShoppingBag size={12} />} done accent={accent} />
            <Segment done accent={accent} />
            <Step label="Dados" icon={<User size={12} />} active accent={accent} />
            <Segment accent={accent} />
            <Step label="Pagamento" icon={<CreditCard size={12} />} accent={accent} />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 pt-5 pb-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            Falta pouco para o seu <span style={{ color: "#7c2d12" }}>Açaí</span> 🍧
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Precisamos dessas informações para confirmar seu pedido e enviar as atualizações no WhatsApp.
          </p>
        </div>

        <div
          className="rounded-3xl bg-white/90 backdrop-blur-sm border-2 p-5 space-y-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]"
          style={{ borderColor: `${accent}` }}
        >
          {/* WhatsApp */}
          <Field
            label="WhatsApp"
            hint="Enviaremos o comprovante por aqui"
            valid={telefoneOk}
            filled={telefone.length > 0}
          >
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                onFocus={() => setFocused("tel")}
                onBlur={() => setFocused(null)}
                placeholder="(00) 00000-0000"
                className={fieldClass("tel", telefoneOk, telefone.length > 0)}
                style={focused === "tel" ? { borderColor: accent } : undefined}
              />
              {telefoneOk && (
                <Check size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </Field>

          {/* Nome */}
          <Field label="Nome completo" valid={nomeOk} filled={nome.length > 0}>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(sanitizeNome(e.target.value))}
                onFocus={() => setFocused("nome")}
                onBlur={() => setFocused(null)}
                placeholder="Ex: Maria Silva"
                maxLength={80}
                className={fieldClass("nome", nomeOk, nome.length > 0)}
                style={focused === "nome" ? { borderColor: accent } : undefined}
              />
              {nomeOk && (
                <Check size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </Field>

          {/* CPF */}
          <Field label="CPF" hint="Obrigatório para gerar o PIX" valid={cpfOk} filled={cpf.length > 0}>
            <div className="relative">
              <IdCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                onFocus={() => setFocused("cpf")}
                onBlur={() => setFocused(null)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={fieldClass("cpf", cpfOk, cpf.length > 0)}
                style={focused === "cpf" ? { borderColor: accent } : undefined}
              />
              {cpfOk && (
                <Check size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </Field>
        </div>

        {/* Trust badges */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-border/50 px-3 py-2.5">
            <Shield size={16} className="text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-foreground/80 leading-tight">
              Ambiente<br />protegido
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-border/50 px-3 py-2.5">
            <Lock size={16} className="text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-foreground/80 leading-tight">
              Seus dados<br />criptografados
            </span>
          </div>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="sticky bottom-0 z-10 border-t border-border/40 bg-white/85 backdrop-blur-md">
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-muted-foreground font-medium">Total do pedido</span>
            <span className="text-lg font-bold text-foreground">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <button
            onClick={handleContinuar}
            disabled={!isFormValid}
            className="w-full py-4 font-bold rounded-2xl transition-all text-base flex items-center justify-center gap-2 active:scale-[0.98]"
            style={
              isFormValid
                ? {
                    background: accent,
                    color: "#000",
                    boxShadow: `0 8px 24px -8px ${accent}`,
                  }
                : {
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    cursor: "not-allowed",
                  }
            }
          >
            Ir para pagamento
            <ArrowLeft size={18} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
};

const Field = ({
  label,
  hint,
  valid,
  filled,
  children,
}: {
  label: string;
  hint?: string;
  valid: boolean;
  filled: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-foreground text-[13px] font-semibold">{label}</label>
      {filled && valid && (
        <span className="text-[11px] font-medium text-emerald-600">✓ ok</span>
      )}
    </div>
    {children}
    {hint && <p className="text-muted-foreground text-[11px] mt-1.5 ml-1">{hint}</p>}
  </div>
);

const Step = ({
  label,
  icon,
  active,
  done,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  done?: boolean;
  accent: string;
}) => (
  <div className="flex items-center gap-1.5">
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all"
      style={{
        background: done || active ? accent : "transparent",
        borderColor: done || active ? accent : "hsl(var(--border))",
        color: done || active ? "#000" : "hsl(var(--muted-foreground))",
      }}
    >
      {done ? <Check size={12} /> : icon}
    </div>
    <span
      className={`text-[11px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
    >
      {label}
    </span>
  </div>
);

const Segment = ({ done, accent }: { done?: boolean; accent: string }) => (
  <div
    className="flex-1 h-0.5 rounded-full"
    style={{ background: done ? accent : "hsl(var(--border))" }}
  />
);

export default Identificacao;
