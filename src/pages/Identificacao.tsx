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

  // Teléfono España: 9 dígitos, formato "XXX XX XX XX"
  const formatTelefone = (value: string) => {
    const n = value.replace(/\D/g, "").slice(0, 9);
    if (n.length <= 3) return n;
    if (n.length <= 5) return `${n.slice(0, 3)} ${n.slice(3)}`;
    if (n.length <= 7) return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5)}`;
    return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
  };

  // DNI: 8 dígitos + 1 letra (12345678A)
  // NIE: X/Y/Z + 7 dígitos + 1 letra (X1234567A)
  const formatDni = (value: string) => {
    const raw = value.toUpperCase().replace(/[^0-9XYZA-Z]/g, "");
    if (!raw) return "";

    // NIE: empieza con X, Y o Z
    if (/^[XYZ]/.test(raw)) {
      const prefix = raw[0];
      const digits = raw.slice(1).replace(/[^0-9]/g, "").slice(0, 7);
      const rest = raw.slice(1 + digits.length);
      const letter = rest.replace(/[^A-Z]/g, "").slice(0, 1);
      return `${prefix}${digits}${digits.length === 7 ? letter : ""}`;
    }

    // DNI: empieza con dígito
    if (/^[0-9]/.test(raw)) {
      const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
      const rest = raw.slice(digits.length);
      const letter = rest.replace(/[^A-Z]/g, "").slice(0, 1);
      return `${digits}${digits.length === 8 ? letter : ""}`;
    }

    // Cualquier otra letra al inicio → descartar
    return "";
  };

  const validarDni = (dni: string) => {
    const clean = dni.toUpperCase().trim();
    const dniRegex = /^(\d{8})([A-Z])$/;
    const nieRegex = /^([XYZ])(\d{7})([A-Z])$/;
    const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
    let numero: number;
    let letra: string;
    if (dniRegex.test(clean)) {
      const m = clean.match(dniRegex)!;
      numero = parseInt(m[1], 10);
      letra = m[2];
    } else if (nieRegex.test(clean)) {
      const m = clean.match(nieRegex)!;
      const prefijo = { X: 0, Y: 1, Z: 2 }[m[1] as "X" | "Y" | "Z"];
      numero = parseInt(`${prefijo}${m[2]}`, 10);
      letra = m[3];
    } else {
      return false;
    }
    return letras[numero % 23] === letra;
  };

  const nomeOk = isNomeValido(nome);
  const telOk = telefone.replace(/\D/g, "").length === 9;
  const dniOk = validarDni(cpf);
  const isFormValid = nomeOk && telOk && dniOk;

  const subtotal = useMemo(() => getSubtotal(), [getSubtotal, itens]);

  const handleContinuar = () => {
    if (!nomeOk) return toast({ title: "Nombre no válido", description: "Usa solo letras.", variant: "destructive" });
    if (!telOk) return toast({ title: "Teléfono no válido", variant: "destructive" });
    if (!dniOk) return toast({ title: "DNI/NIE no válido", variant: "destructive" });
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
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">Tus datos</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">2/3</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full transition-all" style={{ width: "66%", background: accent }} />
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 pt-6 pb-6">
        <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
          ¿Para quién es el pedido?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tus datos para confirmar el pedido y contactarte.
        </p>

        <div className="space-y-5">
          <FloatInput
            id="tel"
            label="Teléfono móvil"
            value={telefone}
            onChange={(v) => setTelefone(formatTelefone(v))}
            placeholder="600 00 00 00"
            inputMode="numeric"
            type="tel"
            accent={accent}
            valid={telOk}
          />
          <FloatInput
            id="nome"
            label="Nombre completo"
            value={nome}
            onChange={(v) => setNome(sanitizeNome(v))}
            placeholder="Cómo te llamas"
            accent={accent}
            valid={nomeOk}
            maxLength={80}
          />
          <FloatInput
            id="cpf"
            label="DNI / NIE"
            value={cpf}
            onChange={(v) => setCpf(formatDni(v))}
            placeholder="12345678A o X1234567A"
            accent={accent}
            valid={dniOk}
            maxLength={9}
            hint={
              cpf.length === 9 && !dniOk
                ? "La letra no coincide. Revisa tu DNI/NIE."
                : "Necesario para procesar el pago"
            }
          />
        </div>
      </main>

      {/* Footer Fijo */}
      <footer className="sticky bottom-0 bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-none mb-1">Total</span>
            <span className="text-base font-bold text-foreground leading-none">
              {subtotal.toFixed(2).replace(".", ",")} €
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
