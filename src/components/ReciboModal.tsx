import { useEffect, useRef, useState } from "react";
import { X, Download, Receipt, Loader2 } from "lucide-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

interface PedidoItemDB {
  id: string;
  produto_nome: string;
  produto_preco: number;
  quantidade: number;
  total_item: number;
  adicionais: Record<string, number> | null;
  observacoes: string | null;
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
  const [complementosMap, setComplementosMap] = useState<Record<string, { nome: string; preco: number }>>({});
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reciboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const carregar = async () => {
      setLoading(true);
      try {
        const [itensRes, compRes] = await Promise.all([
          supabase
            .from("pedido_itens")
            .select("id, produto_nome, produto_preco, quantidade, total_item, adicionais, observacoes")
            .eq("pedido_id", pedido.id),
          supabase.from("complementos").select("id, nome, preco"),
        ]);
        setItens((itensRes.data as PedidoItemDB[]) || []);
        const map: Record<string, { nome: string; preco: number }> = {};
        (compRes.data || []).forEach((c: any) => {
          map[c.id] = { nome: c.nome, preco: Number(c.preco) };
        });
        setComplementosMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [open, pedido.id]);

  const handleDownload = async () => {
    if (!reciboRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`recibo-${pedido.numero_pedido}.pdf`);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
    } finally {
      setDownloading(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-border flex items-center justify-center text-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          ref={reciboRef}
          className="overflow-hidden bg-white"
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
              <div className="space-y-3">
                {itens.map((item) => {
                  const adicionaisList = Object.entries(item.adicionais || {}).filter(([, v]) => v && v > 0);
                  return (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground flex-1 pr-2 font-medium">
                          {item.quantidade ?? 1}x {item.produto_nome}
                        </span>
                        <span className="text-foreground font-medium tabular-nums">
                          R$ {Number(item.total_item ?? 0).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {adicionaisList.length > 0 && (
                        <ul className="mt-1 pl-3 space-y-0.5">
                          {adicionaisList.map(([id, qtd]) => {
                            const comp = complementosMap[id];
                            const nome = comp?.nome || id;
                            return (
                              <li key={id} className="text-[11px] text-muted-foreground flex justify-between">
                                <span>+ {qtd}x {nome}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {item.observacoes && (
                        <p className="mt-1 pl-3 text-[11px] italic text-muted-foreground">
                          Obs: {item.observacoes}
                        </p>
                      )}
                    </div>
                  );
                })}
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
            <p className="text-[11px] text-muted-foreground">Obrigado pela preferência</p>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="w-full py-3 bg-foreground text-background font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> BAIXAR RECIBO
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReciboModal;
