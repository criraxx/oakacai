import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Pencil, X, ArrowUp, ArrowDown } from "lucide-react";

type Entity = "produtos" | "categorias" | "secoes_complementos" | "complementos" | "produto_secoes" | "banners" | "order_bumps" | "downsells";

interface Row { id: string; [k: string]: unknown }

async function api(password: string, action: "list" | "create" | "update" | "delete", entity: Entity, payload: { id?: string; data?: Record<string, unknown> } = {}) {
  const { data, error } = await supabase.functions.invoke("admin-catalogo", {
    body: { password, action, entity, ...payload },
  });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data;
}

async function fileToBase64(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Imagem maior que 2MB");
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const CatalogoAdmin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState(() => sessionStorage.getItem("admin_pw") || "");
  const [authed, setAuthed] = useState(false);
  const [inputPw, setInputPw] = useState("");

  useEffect(() => {
    if (password) {
      // Se já tem senha salva, marca como autenticado (o painel valida internamente)
      setAuthed(true);
      sessionStorage.setItem("admin_pw", password);
    }
  }, [password]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Admin · Catálogo</h1>
          <Input type="password" placeholder="Senha admin" value={inputPw} onChange={(e) => setInputPw(e.target.value)} />
          <Button className="w-full" onClick={() => setPassword(inputPw)}>Entrar</Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/admin")}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft size={20} /></Button>
        <h1 className="font-bold text-lg">Catálogo</h1>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <CatalogoPanel password={password} />
      </main>
    </div>
  );
};

// Painel reutilizável (sem auth/header) — usado embutido em /admin
export function CatalogoPanel({ password }: { password: string }) {
  const [produtos, setProdutos] = useState<Row[]>([]);
  const [categorias, setCategorias] = useState<Row[]>([]);
  const [secoes, setSecoes] = useState<Row[]>([]);
  const [complementos, setComplementos] = useState<Row[]>([]);
  const [produtoSecoes, setProdutoSecoes] = useState<Row[]>([]);
  const [banners, setBanners] = useState<Row[]>([]);
  const [orderBumps, setOrderBumps] = useState<Row[]>([]);
  const [downsells, setDownsells] = useState<Row[]>([]);

  async function loadAll(pw: string) {
    try {
      const [p, c, s, cp, ps, b, ob, ds] = await Promise.all([
        api(pw, "list", "produtos"),
        api(pw, "list", "categorias"),
        api(pw, "list", "secoes_complementos"),
        api(pw, "list", "complementos"),
        api(pw, "list", "produto_secoes"),
        api(pw, "list", "banners"),
        api(pw, "list", "order_bumps"),
        api(pw, "list", "downsells"),
      ]);
      setProdutos((p as { rows: Row[] }).rows);
      setCategorias((c as { rows: Row[] }).rows);
      setSecoes((s as { rows: Row[] }).rows);
      setComplementos((cp as { rows: Row[] }).rows);
      setProdutoSecoes((ps as { rows: Row[] }).rows);
      setBanners((b as { rows: Row[] }).rows);
      setOrderBumps((ob as { rows: Row[] }).rows);
      setDownsells((ds as { rows: Row[] }).rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => { if (password) loadAll(password); }, [password]);

  async function crud(action: "create" | "update" | "delete", entity: Entity, payload: { id?: string; data?: Record<string, unknown> } = {}) {
    try {
      await api(password, action, entity, payload);
      await loadAll(password);
      toast.success("Salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Tabs defaultValue="banners">
      <TabsList className="grid grid-cols-3 w-full h-auto">
        <TabsTrigger value="banners">Banners</TabsTrigger>
        <TabsTrigger value="orderbump">Order Bump</TabsTrigger>
        <TabsTrigger value="downsell">Downsell</TabsTrigger>
      </TabsList>

      <TabsContent value="banners" className="mt-4">
        <BannersTab banners={banners} produtos={produtos} categorias={categorias} onCrud={crud} />
      </TabsContent>
      <TabsContent value="orderbump" className="mt-4">
        <OfertaTab entity="order_bumps" rows={orderBumps} produtos={produtos} onCrud={crud} label="Order Bump" />
      </TabsContent>
      <TabsContent value="downsell" className="mt-4">
        <OfertaTab entity="downsells" rows={downsells} produtos={produtos} onCrud={crud} label="Downsell" />
      </TabsContent>
    </Tabs>
  );
}


// ================== PRODUTOS ==================
function ProdutosTab({ produtos, categorias, secoes, produtoSecoes, onCrud, onReload }: {
  produtos: Row[]; categorias: Row[]; secoes: Row[]; produtoSecoes: Row[];
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <Button onClick={() => { setEditing({ id: "", nome: "", descricao: "", preco: 0, ativo: true, com_borda: false, cor_borda: "#F5E6D3", cor_fundo_card: "#FFFFFF", ordem: 0 }); setCreating(true); }}>
        <Plus size={16} className="mr-1" /> Novo produto
      </Button>
      <div className="grid gap-2">
        {produtos.map((p, i) => (
          <Card key={p.id} className="p-3 flex items-center gap-2">
            {p.imagem ? <img src={p.imagem as string} className="w-14 h-14 rounded object-cover" alt="" /> : <div className="w-14 h-14 rounded bg-muted" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{p.nome as string}</div>
              <div className="text-xs text-muted-foreground">R$ {Number(p.preco).toFixed(2)} · {p.ativo ? "ativo" : "inativo"}</div>
            </div>
            <div className="flex flex-col">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => reorder(produtos, i, i - 1, "produtos", onCrud)}><ArrowUp size={12} /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === produtos.length - 1} onClick={() => reorder(produtos, i, i + 1, "produtos", onCrud)}><ArrowDown size={12} /></Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setCreating(false); }}><Pencil size={16} /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir produto?")) onCrud("delete", "produtos", { id: p.id }); }}><Trash2 size={16} className="text-destructive" /></Button>
          </Card>
        ))}
      </div>

      {editing && (
        <ProdutoEditor
          produto={editing}
          creating={creating}
          categorias={categorias}
          secoes={secoes}
          produtoSecoes={produtoSecoes}
          onClose={() => setEditing(null)}
          onSave={async (data, vinculos) => {
            if (creating) {
              const res = (await api(sessionStorage.getItem("admin_pw") || "", "create", "produtos", { data }));
              const newId = (res as { row: Row }).row.id;
              for (const sid of vinculos) {
                await api(sessionStorage.getItem("admin_pw") || "", "create", "produto_secoes", { data: { produto_id: newId, secao_id: sid } });
              }
            } else {
              await api(sessionStorage.getItem("admin_pw") || "", "update", "produtos", { id: editing.id, data });
              // Reset vínculos: excluir todos e recriar
              const atuais = produtoSecoes.filter(ps => ps.produto_id === editing.id);
              for (const ps of atuais) await api(sessionStorage.getItem("admin_pw") || "", "delete", "produto_secoes", { id: ps.id });
              for (const sid of vinculos) {
                await api(sessionStorage.getItem("admin_pw") || "", "create", "produto_secoes", { data: { produto_id: editing.id, secao_id: sid } });
              }
            }
            await onReload();
            toast.success("Salvo");
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProdutoEditor({ produto, creating, categorias, secoes, produtoSecoes, onClose, onSave }: {
  produto: Row; creating: boolean; categorias: Row[]; secoes: Row[]; produtoSecoes: Row[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>, vinculos: string[]) => Promise<void>;
}) {
  const [nome, setNome] = useState(produto.nome as string);
  const [descricao, setDescricao] = useState((produto.descricao as string) || "");
  const [preco, setPreco] = useState(String(produto.preco ?? 0));
  const [imagem, setImagem] = useState((produto.imagem as string) || "");
  const [categoriaId, setCategoriaId] = useState((produto.categoria_id as string) || "");
  const [ativo, setAtivo] = useState((produto.ativo as boolean) ?? true);
  const [comBorda, setComBorda] = useState((produto.com_borda as boolean) ?? false);
  const [corBorda, setCorBorda] = useState((produto.cor_borda as string) || "#F5E6D3");
  const [corFundoCard, setCorFundoCard] = useState((produto.cor_fundo_card as string) || "#FFFFFF");
  const [ordem, setOrdem] = useState(String(produto.ordem ?? 0));
  const [vinculos, setVinculos] = useState<string[]>(creating ? [] : produtoSecoes.filter(ps => ps.produto_id === produto.id).map(ps => ps.secao_id as string));
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{creating ? "Novo produto" : "Editar produto"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Preço</Label><Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} /></div>
          <div><Label>Ordem</Label><Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} /></div>
        </div>
        <div>
          <Label>Categoria</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">— Sem categoria —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome as string}</option>)}
          </select>
        </div>
        <div>
          <Label>Foto (max 2MB)</Label>
          <Input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { setImagem(await fileToBase64(f)); } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
          }} />
          {imagem && <img src={imagem} className="mt-2 w-24 h-24 object-cover rounded" alt="" />}
        </div>
        <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={ativo} onCheckedChange={setAtivo} /></div>
        <div className="flex items-center justify-between"><Label>Com borda</Label><Switch checked={comBorda} onCheckedChange={setComBorda} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Cor borda</Label><Input type="color" value={corBorda} onChange={(e) => setCorBorda(e.target.value)} /></div>
          <div><Label>Fundo do card</Label><Input type="color" value={corFundoCard} onChange={(e) => setCorFundoCard(e.target.value)} /></div>
        </div>
        <div>
          <Label>Seções de complementos</Label>
          <div className="space-y-1 mt-1 max-h-40 overflow-y-auto border rounded p-2">
            {secoes.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={vinculos.includes(s.id)} onChange={(e) => {
                  setVinculos(v => e.target.checked ? [...v, s.id] : v.filter(x => x !== s.id));
                }} />
                {s.titulo as string}
              </label>
            ))}
          </div>
        </div>
        <Button className="w-full" disabled={saving} onClick={async () => {
          setSaving(true);
          try {
            await onSave({
              nome, descricao, preco: parseFloat(preco), imagem: imagem || null,
              categoria_id: categoriaId || null, ativo, com_borda: comBorda,
              cor_borda: corBorda, cor_fundo_card: corFundoCard, ordem: parseInt(ordem) || 0,
            }, vinculos);
          } finally { setSaving(false); }
        }}>{saving ? "Salvando..." : "Salvar"}</Button>
      </Card>
    </div>
  );
}

// ================== COMPLEMENTOS ==================
function ComplementosTab({ secoes, complementos, onCrud }: {
  secoes: Row[]; complementos: Row[];
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>;
}) {
  const [secaoSelId, setSecaoSelId] = useState<string>(secoes[0]?.id as string || "");
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");

  const items = complementos.filter(c => c.secao_id === secaoSelId);

  return (
    <div className="space-y-4">
      {/* Seções */}
      <Card className="p-3 space-y-2">
        <h3 className="font-semibold text-sm">Seções</h3>
        {secoes.map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <button className={`flex-1 text-left text-sm px-2 py-1 rounded ${secaoSelId === s.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setSecaoSelId(s.id)}>
              {s.titulo as string} <span className="text-xs opacity-70">({s.tipo as string})</span>
            </button>
            <Button variant="ghost" size="sm" onClick={async () => {
              const novo = prompt("Novo título", s.titulo as string);
              if (novo && novo !== s.titulo) onCrud("update", "secoes_complementos", { id: s.id, data: { titulo: novo } });
            }}><Pencil size={14} /></Button>
            <Switch checked={s.ativo as boolean} onCheckedChange={(v) => onCrud("update", "secoes_complementos", { id: s.id, data: { ativo: v } })} />
          </div>
        ))}
        <Button size="sm" onClick={async () => {
          const titulo = prompt("Título da nova seção");
          if (!titulo) return;
          const tipo = prompt("Tipo (gratis ou pago)", "pago");
          if (tipo !== "gratis" && tipo !== "pago") return;
          onCrud("create", "secoes_complementos", { data: { titulo, subtitulo: "", tipo, max_itens: 15, ordem: secoes.length + 1 } });
        }}><Plus size={14} className="mr-1" /> Nova seção</Button>
      </Card>

      {/* Itens da seção */}
      {secaoSelId && (
        <Card className="p-3 space-y-2">
          <h3 className="font-semibold text-sm">Itens</h3>
          {items.map(c => (
            <div key={c.id} className="flex items-center gap-2 border rounded p-2">
              {c.imagem ? <img src={c.imagem as string} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-muted" />}
              <Input className="flex-1" defaultValue={c.nome as string} onBlur={(e) => e.target.value !== c.nome && onCrud("update", "complementos", { id: c.id, data: { nome: e.target.value } })} />
              <Input className="w-20" type="number" step="0.01" placeholder="Grátis" defaultValue={c.preco == null ? "" : String(c.preco)}
                onBlur={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                  if (val !== c.preco) onCrud("update", "complementos", { id: c.id, data: { preco: val } });
                }} />
              <Input type="file" accept="image/*" className="w-32 text-xs" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const b64 = await fileToBase64(f); onCrud("update", "complementos", { id: c.id, data: { imagem: b64 } }); } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
              }} />
              <Switch checked={c.ativo as boolean} onCheckedChange={(v) => onCrud("update", "complementos", { id: c.id, data: { ativo: v } })} />
              <Button variant="ghost" size="icon" onClick={() => confirm("Excluir?") && onCrud("delete", "complementos", { id: c.id })}><Trash2 size={14} className="text-destructive" /></Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Input placeholder="Nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            <Input placeholder="Preço (vazio = grátis)" type="number" step="0.01" value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} className="w-32" />
            <Button size="sm" onClick={async () => {
              if (!novoNome) return;
              await onCrud("create", "complementos", { data: {
                secao_id: secaoSelId, nome: novoNome,
                preco: novoPreco === "" ? null : parseFloat(novoPreco),
                max_quantidade: 15, ordem: items.length + 1,
              } });
              setNovoNome(""); setNovoPreco("");
            }}><Plus size={14} /></Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ================== BANNERS ==================
function BannersTab({ banners, produtos, categorias, onCrud }: {
  banners: Row[]; produtos: Row[]; categorias: Row[];
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <Button onClick={async () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "image/*";
        inp.onchange = async () => {
          const f = inp.files?.[0]; if (!f) return;
          try {
            const b64 = await fileToBase64(f);
            await onCrud("create", "banners", { data: { imagem: b64, acao_tipo: "nenhuma", ativo: true, ordem: banners.length + 1, intervalo_segundos: 6 } });
          } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
        };
        inp.click();
      }}><Plus size={16} className="mr-1" /> Novo banner</Button>

      <div className="grid gap-2">
        {banners.map(b => (
          <Card key={b.id} className="p-3 space-y-2">
            <img src={b.imagem as string} className="w-full h-24 object-cover rounded" alt="" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ação</Label>
                <select className="w-full h-9 rounded border bg-background px-2 text-sm"
                  value={b.acao_tipo as string}
                  onChange={(e) => onCrud("update", "banners", { id: b.id, data: { acao_tipo: e.target.value, acao_valor: null } })}>
                  <option value="nenhuma">Nenhuma</option>
                  <option value="produto">Produto</option>
                  <option value="categoria">Categoria</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Destino</Label>
                {b.acao_tipo === "produto" ? (
                  <select className="w-full h-9 rounded border bg-background px-2 text-sm"
                    value={(b.acao_valor as string) || ""}
                    onChange={(e) => onCrud("update", "banners", { id: b.id, data: { acao_valor: e.target.value } })}>
                    <option value="">—</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome as string}</option>)}
                  </select>
                ) : b.acao_tipo === "categoria" ? (
                  <select className="w-full h-9 rounded border bg-background px-2 text-sm"
                    value={(b.acao_valor as string) || ""}
                    onChange={(e) => onCrud("update", "banners", { id: b.id, data: { acao_valor: e.target.value } })}>
                    <option value="">—</option>
                    {categorias.map(c => <option key={c.id} value={c.slug as string}>{c.nome as string}</option>)}
                  </select>
                ) : b.acao_tipo === "url" ? (
                  <Input defaultValue={(b.acao_valor as string) || ""} onBlur={(e) => onCrud("update", "banners", { id: b.id, data: { acao_valor: e.target.value } })} placeholder="https://" />
                ) : <div className="text-xs text-muted-foreground">—</div>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs">Ativo</Label>
              <Switch checked={b.ativo as boolean} onCheckedChange={(v) => onCrud("update", "banners", { id: b.id, data: { ativo: v } })} />
              <div className="flex-1" />
              <Label className="text-xs">Ordem</Label>
              <Input type="number" className="w-16 h-8" defaultValue={String(b.ordem)} onBlur={(e) => onCrud("update", "banners", { id: b.id, data: { ordem: parseInt(e.target.value) || 0 } })} />
              <Button variant="ghost" size="icon" onClick={() => confirm("Excluir?") && onCrud("delete", "banners", { id: b.id })}><Trash2 size={14} className="text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ================== OFERTAS (Order Bump / Downsell) ==================
function OfertaTab({ entity, rows, produtos, onCrud, label }: {
  entity: "order_bumps" | "downsells"; rows: Row[]; produtos: Row[];
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>;
  label: string;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoOriginal, setPrecoOriginal] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [imagem, setImagem] = useState("");

  return (
    <div className="space-y-3">
      <Card className="p-3 space-y-2">
        <h3 className="font-semibold text-sm">Novo {label}</h3>
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Textarea placeholder="Descrição" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Preço original" type="number" step="0.01" value={precoOriginal} onChange={(e) => setPrecoOriginal(e.target.value)} />
          <Input placeholder="Preço promo" type="number" step="0.01" value={precoPromocional} onChange={(e) => setPrecoPromocional(e.target.value)} />
        </div>
        <select className="w-full h-10 rounded border bg-background px-3 text-sm" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">— Produto vinculado (opcional) —</option>
          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome as string}</option>)}
        </select>
        <Input type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          try { setImagem(await fileToBase64(f)); } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
        }} />
        {imagem && <img src={imagem} className="w-20 h-20 object-cover rounded" alt="" />}
        <Button onClick={async () => {
          if (!nome) return;
          await onCrud("create", entity, { data: {
            nome, descricao, preco_original: parseFloat(precoOriginal) || 0,
            preco_promocional: parseFloat(precoPromocional) || 0,
            produto_vinculado_id: produtoId || null, imagem: imagem || null,
            ativo: true, ordem: rows.length + 1,
          } });
          setNome(""); setDescricao(""); setPrecoOriginal(""); setPrecoPromocional(""); setProdutoId(""); setImagem("");
        }}>Criar</Button>
      </Card>

      <div className="grid gap-2">
        {rows.map(r => (
          <Card key={r.id} className="p-3 flex items-center gap-3">
            {r.imagem ? <img src={r.imagem as string} className="w-14 h-14 rounded object-cover" alt="" /> : <div className="w-14 h-14 rounded bg-muted" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{r.nome as string}</div>
              <div className="text-xs text-muted-foreground">De R$ {Number(r.preco_original).toFixed(2)} por R$ {Number(r.preco_promocional).toFixed(2)}</div>
            </div>
            <Switch checked={r.ativo as boolean} onCheckedChange={(v) => onCrud("update", entity, { id: r.id, data: { ativo: v } })} />
            <Button variant="ghost" size="icon" onClick={() => confirm("Excluir?") && onCrud("delete", entity, { id: r.id })}><Trash2 size={14} className="text-destructive" /></Button>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Apenas o primeiro {label.toLowerCase()} ativo será exibido no site.</p>
    </div>
  );
}

// ================== HELPERS ==================
async function reorder(
  rows: Row[],
  from: number,
  to: number,
  entity: Entity,
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>,
) {
  const a = rows[from], b = rows[to];
  if (!a || !b) return;
  const oa = Number(a.ordem ?? from);
  const ob = Number(b.ordem ?? to);
  await onCrud("update", entity, { id: a.id, data: { ordem: ob } });
  await onCrud("update", entity, { id: b.id, data: { ordem: oa } });
}

// ================== CATEGORIAS ==================
function CategoriasTab({ categorias, onCrud }: {
  categorias: Row[];
  onCrud: (action: "create" | "update" | "delete", entity: Entity, payload?: { id?: string; data?: Record<string, unknown> }) => Promise<void>;
}) {
  const [novoNome, setNovoNome] = useState("");

  return (
    <div className="space-y-3">
      <Card className="p-3 flex gap-2">
        <Input placeholder="Nome da nova categoria" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
        <Button onClick={async () => {
          if (!novoNome) return;
          const slug = novoNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          await onCrud("create", "categorias", { data: { nome: novoNome, slug, ordem: categorias.length + 1, ativo: true, cor_fundo: "#FFFFFF", cor_texto: "#1F1F1F" } });
          setNovoNome("");
        }}><Plus size={14} className="mr-1" /> Criar</Button>
      </Card>

      <div className="grid gap-2">
        {categorias.map((c, i) => (
          <Card key={c.id} className="p-3 space-y-2" style={{ backgroundColor: (c.cor_fundo as string) || undefined }}>
            <div className="flex items-center gap-2">
              {c.icone ? <img src={c.icone as string} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-muted" />}
              <Input className="flex-1" style={{ color: (c.cor_texto as string) || undefined }}
                defaultValue={c.nome as string}
                onBlur={(e) => e.target.value !== c.nome && onCrud("update", "categorias", { id: c.id, data: { nome: e.target.value } })} />
              <div className="flex flex-col">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => reorder(categorias, i, i - 1, "categorias", onCrud)}><ArrowUp size={12} /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === categorias.length - 1} onClick={() => reorder(categorias, i, i + 1, "categorias", onCrud)}><ArrowDown size={12} /></Button>
              </div>
              <Switch checked={c.ativo as boolean} onCheckedChange={(v) => onCrud("update", "categorias", { id: c.id, data: { ativo: v } })} />
              <Button variant="ghost" size="icon" onClick={() => confirm(`Excluir categoria "${c.nome}"?`) && onCrud("delete", "categorias", { id: c.id })}><Trash2 size={14} className="text-destructive" /></Button>
            </div>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <Label className="text-xs">Ícone</Label>
                <Input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  try { const b64 = await fileToBase64(f); onCrud("update", "categorias", { id: c.id, data: { icone: b64 } }); } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
                }} />
              </div>
              <div>
                <Label className="text-xs">Cor de fundo</Label>
                <Input type="color" defaultValue={(c.cor_fundo as string) || "#FFFFFF"} onBlur={(e) => onCrud("update", "categorias", { id: c.id, data: { cor_fundo: e.target.value } })} />
              </div>
              <div>
                <Label className="text-xs">Cor do texto</Label>
                <Input type="color" defaultValue={(c.cor_texto as string) || "#1F1F1F"} onBlur={(e) => onCrud("update", "categorias", { id: c.id, data: { cor_texto: e.target.value } })} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">A cor de fundo e cor do texto são usadas nos chips de categoria do site.</p>
    </div>
  );
}

export default CatalogoAdmin;
