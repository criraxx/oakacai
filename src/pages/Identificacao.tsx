import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { trackLead } from "@/lib/metaPixel";

const sanitizeNome = (value: string) =>
  value.replace(/[^\p{L}\s]/gu, "").replace(/\s{2,}/g, " ").slice(0, 80);

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

  const leadTracked = useRef(false);

  useEffect(() => {
    if (itens.length === 0) navigate("/carrinho");
  }, [itens.length, navigate]);

  useEffect(() => {
    if (!leadTracked.current && (nome.length > 0 || telefone.length > 0)) {
      trackLead({
        content_ids: itens.map((i) => i.produtoId),
        value: getSubtotal(),
      });
      leadTracked.current = true;
    }
  }, [nome, telefone, itens, getSubtotal]);

  const formatTelefone = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
  };

  const formatCpf = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  };

  const validarCpf = (cpf: string) => {
    const n = cpf.replace(/\D/g, "");
    if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(n[i]) * (10 - i);
    let r = (s * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(n[9])) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(n[i]) * (11 - i);
    r = (s * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(n[10]);
  };

  const nomeOk = isNomeValido(nome);
  const telOk = telefone.replace(/\D/g, "").length >= 10;
  const cpfOk = validarCpf(cpf);
  const isFormValid = nomeOk && telOk && cpfOk;

  const subtotal = useMemo(() => getSubtotal(), [getSubtotal, itens]);

  const handleContinuar = () => {
    if (!nomeOk) return toast({ title: "Nome inválido", description: "Use apenas letras.", variant: "destructive" });
    if (!telOk) return toast({ title: "Telefone inválido", variant: "destructive" });
    if (!cpfOk) return toast({ title: "CPF inválido", variant: "destructive" });
    setDadosCliente({
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ""),
      cpf: cpf.replace(/\D/g, ""),
    });
    navigate("/checkout");
  };

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
          <h1 className="text-foreground font-semibold text-base">Seus dados</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">2/3</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "66%", background: accent }} />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 pt-6 pb-6">
        <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
          Para quem é o pedido?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Suas informações para confirmar e enviar no WhatsApp.
        </p>

        <div className="space-y-5">
          <FloatInput
            id="tel"
            label="WhatsApp"
            value={telefone}
            onChange={(v) => setTelefone(formatTelefone(v))}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            type="tel"
            accent={accent}
            valid={telOk}
          />
          <FloatInput
            id="nome"
            label="Nome completo"
            value={nome}
            onChange={(v) => setNome(sanitizeNome(v))}
            placeholder="Como você se chama"
            accent={accent}
            valid={nomeOk}
            maxLength={80}
          />
          <FloatInput
            id="cpf"
            label="CPF"
            value={cpf}
            onChange={(v) => setCpf(formatCpf(v))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            accent={accent}
            valid={cpfOk}
            maxLength={14}
            hint="Necessário para o PIX"
          />
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="sticky bottom-0 bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-none mb-1">Total</span>
            <span className="text-base font-bold text-foreground leading-none">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <button
            onClick={handleContinuar}
            disabled={!isFormValid}
            className="ml-auto flex-1 max-w-[220px] py-3.5 font-semibold rounded-xl transition-all text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accent, color: "#000" }}
          >
            Continuar
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const FloatInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  accent,
  valid,
  hint,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: "numeric" | "text";
  accent: string;
  valid: boolean;
  hint?: string;
  maxLength?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  const showValid = valid && value.length > 0;

  return (
    <div>
      <div
        className="relative rounded-xl border transition-all bg-background"
        style={{
          borderColor: focused ? accent : "hsl(var(--border))",
          borderWidth: focused ? 2 : 1,
          padding: focused ? "0" : "0 1px",
        }}
      >
        <label
          htmlFor={id}
          className={`absolute left-3.5 pointer-events-none transition-all ${
            active
              ? "top-1.5 text-[11px] font-medium text-muted-foreground"
              : "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
          }`}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={active ? placeholder : ""}
          maxLength={maxLength}
          className="w-full pt-6 pb-2 px-3.5 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {showValid && (
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>
      {hint && <p className="text-muted-foreground text-[11px] mt-1.5 ml-1">{hint}</p>}
    </div>
  );
};

export default Identificacao;
