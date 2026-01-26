import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { trackLead } from "@/lib/metaPixel";

const sanitizeNome = (value: string) =>
  value
    // Permite apenas letras (inclui acentos) e espaços
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

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  
  const leadTracked = useRef(false);

  // Redirecionar se carrinho estiver vazio
  useEffect(() => {
    if (itens.length === 0) {
      navigate("/carrinho");
    }
  }, [itens.length, navigate]);

  // Meta Pixel: Lead - Disparar quando usuário começar a preencher dados
  useEffect(() => {
    if (!leadTracked.current && (nome.length > 0 || telefone.length > 0)) {
      trackLead({
        content_ids: itens.map(item => item.produtoId),
        value: getSubtotal(),
      });
      leadTracked.current = true;
    }
  }, [nome, telefone, itens, getSubtotal]);

  // Formatar telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Formatar CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Validar CPF (algoritmo oficial)
  const validarCpf = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, "");
    
    if (numbers.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numbers[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers[9])) return false;
    
    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numbers[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setTelefone(formatted);
  };

  const isFormValid = nome.trim() && telefone.replace(/\D/g, "").length >= 10 && cpf.replace(/\D/g, "").length === 11;

  const handleContinuar = () => {
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome",
        variant: "destructive",
      });
      return;
    }

    if (!isNomeValido(nome)) {
      toast({
        title: "Nome inválido",
        description: "Use apenas letras e espaços (sem números ou símbolos).",
        variant: "destructive",
      });
      return;
    }

    const telefoneNumbers = telefone.replace(/\D/g, "");
    if (telefoneNumbers.length < 10 || telefoneNumbers.length > 11) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, informe um telefone válido",
        variant: "destructive",
      });
      return;
    }

    const cpfNumbers = cpf.replace(/\D/g, "");
    if (!validarCpf(cpfNumbers)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF válido",
        variant: "destructive",
      });
      return;
    }

    setDadosCliente({ nome: nome.trim(), telefone: telefoneNumbers, cpf: cpfNumbers });
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-lg">Identifique-se</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-4">
        <div className="space-y-4">
          {/* Campo WhatsApp */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Seu número de WhatsApp é:
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3.5 bg-background border border-border rounded-lg text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-card"
            />
          </div>

          {/* Campo Nome */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Seu nome e sobrenome:
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(sanitizeNome(e.target.value))}
              placeholder="Digite seu nome completo"
              maxLength={80}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-lg text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-card"
            />
          </div>

          {/* Campo CPF */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Seu CPF:
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-lg text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-card"
            />
            <p className="text-muted-foreground text-xs mt-1.5">
              Necessário para o pagamento via PIX
            </p>
          </div>
        </div>

        {/* Ambiente protegido */}
        <div className="mt-6 flex items-center gap-2 text-muted-foreground">
          <Shield size={16} />
          <p className="text-xs">
            Ambiente protegido e seguro
          </p>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="sticky bottom-0 bg-card p-4">
        <button
          onClick={handleContinuar}
          disabled={!isFormValid}
          className={`w-full py-3.5 font-semibold rounded-lg transition-all text-base ${
            isFormValid
              ? "bg-card text-card-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Avançar
        </button>
      </footer>
    </div>
  );
};

export default Identificacao;
