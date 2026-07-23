import { useEffect, useState } from "react";
import { X, Download, Receipt } from "lucide-react";
import Barcode from "react-barcode";
import { supabase } from "@/integrations/supabase/client";

interface PedidoItemDB {
  id: string;
  produto_nome: string;
  produto_preco: number;
  quantidade: number;
  total_item: number;
}

interface ReciboModalProps {
  open: boolean;
  onClose: () => void;
  pedido: {
    id: string;
    numero_pedido: string;
    total: number;
    forma_pagamento: string;
    created_at: string;
  };
  corBorda?: string;
}

const ReciboModal = ({ open, onClose, pedido, corBorda = "#F5E6D3" }: ReciboModalProps) => {
  const [itens, setItens] = useState<PedidoItemDB[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const carregar = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("pedido_itens")
          .select("id, produto_nome, produto_preco, quantidade, total_item")
          .eq("pedido_id", pedido.id);
        setItens(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [open, pedido.id]);

  if (!open) return null;

  const dataFormatada = new Date(pedido.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const codigoBarras =
    (pedido.numero_pedido || pedido.id || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20) || "PEDIDO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:bg-white print:p-0 print:relative">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-modal-print, #recibo-modal-print * { visibility: visible; }
          #recibo-modal-print { position: absolute !important; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; max-height: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-border flex items-center justify-center text-foreground hover:bg-muted no-print"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          id="recibo-modal-print"
          className="overflow-hidden"
          style={{ borderTopWidth: 4, borderTopColor: corBorda, borderTopStyle: "solid" }}
        >
          <div className="px-5 pt-6 pb-4 border-b border-dashed border-border">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-foreground" />
              <span className="font-bold text-foreground text-sm uppercase tracking-wider">Recibo de compra</span>
            </div>
            <p className="text-xs text-muted-foreground">Oak Açaí • Florianópolis</p>
            <p className="text-xs text-muted-foreground">{dataFormatada}</p>
          </div>

          <div className="px-5 py-4 border-b border-dashed border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">ID da compra</p>
            <p className="font-mono font-bold text-foreground text-sm break-all">{pedido.numero_pedido}</p>
          </div>

          <div className="px-5 py-4 border-b border-dashed border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Itens</p>
            {loading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : itens.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum item</p>
            ) : (
              <div className="space-y-2">
                {itens.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground flex-1 pr-2">
                      {item.quantidade ?? 1}x {item.produto_nome}
                    </span>
                    <span className="text-foreground font-medium tabular-nums">
                      R$ {Number(item.total_item ?? 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-b border-dashed border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pago</p>
                <p className="text-[11px] text-muted-foreground uppercase">via {pedido.forma_pagamento}</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                R$ {Number(pedido.total ?? 0).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          <div className="px-5 py-5 flex flex-col items-center bg-white">
            <div className="w-full flex justify-center overflow-hidden">
              <Barcode
                value={codigoBarras}
                format="CODE128"
                width={1.6}
                height={60}
                displayValue={false}
                margin={0}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>
            <p className="mt-2 text-[11px] font-mono tracking-widest text-muted-foreground">{codigoBarras}</p>
          </div>

          <div className="px-5 py-3 bg-muted/40 text-center">
            <p className="text-[11px] text-muted-foreground">Obrigado pela preferência 💚</p>
          </div>
        </div>

        <div className="p-4 no-print">
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-foreground text-background font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Download className="w-4 h-4" />
            BAIXAR RECIBO
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReciboModal;
