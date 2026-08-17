"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { criarArteNoCanva, gerarDescricaoComChatGPT, gerarImagemComChatGPT } from "@/lib/ai-shortcuts";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import {
  MotivoMovimentacaoProduto,
  MovimentacaoProdutoRequest,
  MovimentacaoResponse,
  ProdutoRequest,
  ProdutoResponse,
  TipoMovimentacao,
} from "@/types/estoque";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

const MOTIVOS: MotivoMovimentacaoProduto[] = ["PRODUCAO", "VENDA", "AJUSTE", "PERDA"];

export default function ProdutoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [produto, setProduto] = useState<ProdutoResponse | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<ProdutoRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [movForm, setMovForm] = useState<MovimentacaoProdutoRequest>({
    tipo: "ENTRADA",
    motivo: "AJUSTE",
    quantidade: 0,
    observacao: "",
  });
  const [registrandoMov, setRegistrandoMov] = useState(false);
  const [erroMov, setErroMov] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [p, movs] = await Promise.all([
        api.get<ProdutoResponse>(`/produtos/${id}`),
        api.get<MovimentacaoResponse[]>(`/produtos/${id}/movimentacoes`),
      ]);
      setProduto(p);
      setForm({
        nome: p.nome,
        descricao: p.descricao ?? "",
        categoria: p.categoria ?? "",
        precoVenda: p.precoVenda,
        estoqueMinimo: p.estoqueMinimo,
        fotoUrl: p.fotoUrl ?? "",
        ativo: p.ativo,
      });
      setMovimentacoes(movs);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar produto");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      const atualizado = await api.put<ProdutoResponse>(`/produtos/${id}`, form);
      setProduto(atualizado);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao salvar produto");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function registrarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    setRegistrandoMov(true);
    setErroMov(null);
    try {
      await api.post(`/produtos/${id}/movimentacoes`, movForm);
      setMovForm({ tipo: "ENTRADA", motivo: "AJUSTE", quantidade: 0, observacao: "" });
      await carregar();
    } catch (e) {
      setErroMov(e instanceof ApiError ? e.message : "Erro ao registrar movimentação");
    } finally {
      setRegistrandoMov(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-4xl px-6 py-10 text-sm text-neutral-500 dark:text-neutral-400">Carregando...</main>;
  if (!produto || !form) return <main className="mx-auto max-w-4xl px-6 py-10"><ErrorBanner mensagem={erro ?? "Produto não encontrado"} /></main>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/estoque/produtos" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">
        ← Produtos
      </Link>
      <PageHeader
        titulo={produto.nome}
        descricao={`Estoque atual: ${produto.estoqueAtual} · Preço: ${formatarMoeda(produto.precoVenda)}`}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Editar produto</h2>
          <form onSubmit={salvar} className="grid gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              {errosCampos.nome && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errosCampos.nome}</p>}
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" value={form.categoria ?? ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="precoVenda">Preço de venda *</Label>
              <Input
                id="precoVenda"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.precoVenda}
                onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })}
              />
              {errosCampos.precoVenda && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errosCampos.precoVenda}</p>}
            </div>
            <div>
              <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="0.001"
                min="0"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <button
                type="button"
                onClick={() => gerarDescricaoComChatGPT(form)}
                className="mb-1.5 block text-xs font-medium text-neutral-600 hover:underline dark:text-neutral-400"
              >
                ✨ Gerar com ChatGPT
              </button>
              <Input id="descricao" value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="fotoUrl">URL da foto</Label>
              <div className="mb-1.5 flex gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <button type="button" onClick={() => gerarImagemComChatGPT(form)} className="hover:underline">
                  🖼️ Gerar imagem com ChatGPT
                </button>
                <button type="button" onClick={criarArteNoCanva} className="hover:underline">
                  🎨 Criar arte no Canva
                </button>
              </div>
              <Input
                id="fotoUrl"
                placeholder="https://..."
                value={form.fotoUrl ?? ""}
                onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.ativo ?? true}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Ativo
            </label>
            <div>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Registrar movimentação</h2>
          {erroMov && <ErrorBanner mensagem={erroMov} />}
          <form onSubmit={registrarMovimentacao} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={movForm.tipo}
                  onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as TipoMovimentacao })}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Select
                  id="motivo"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value as MotivoMovimentacaoProduto })}
                >
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.001"
                min="0"
                required
                value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={movForm.observacao ?? ""}
                onChange={(e) => setMovForm({ ...movForm, observacao: e.target.value })}
              />
            </div>
            <div>
              <Button type="submit" disabled={registrandoMov}>
                {registrandoMov ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <h2 className="mb-4 mt-8 font-semibold">Histórico de movimentações</h2>
      {movimentacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma movimentação registrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Observação</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov) => (
                <tr key={mov.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatarDataHora(mov.dataMovimentacao)}</td>
                  <td className={`px-4 py-3 font-medium ${mov.tipo === "ENTRADA" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                    {mov.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{mov.motivo}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{mov.quantidade}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
