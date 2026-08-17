"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { criarArteNoCanva, gerarDescricaoComChatGPT, gerarImagemComChatGPT } from "@/lib/ai-shortcuts";
import { formatarMoeda } from "@/lib/format";
import { ProdutoRequest, ProdutoResponse } from "@/types/estoque";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";

const PRODUTO_VAZIO: ProdutoRequest = {
  nome: "",
  descricao: "",
  categoria: "",
  precoVenda: 0,
  estoqueMinimo: 0,
  fotoUrl: "",
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<ProdutoRequest>(PRODUTO_VAZIO);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.get<ProdutoResponse[]>("/produtos");
      setProdutos(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar produtos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      await api.post("/produtos", form);
      setForm(PRODUTO_VAZIO);
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar produto");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(produto: ProdutoResponse) {
    if (!confirm(`Excluir "${produto.nome}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.del(`/produtos/${produto.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir produto");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        titulo="Produtos"
        descricao="Produtos finais vendidos (velas, xícaras etc.)"
        acao={
          <Button onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "Novo produto"}
          </Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
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
            <div className="sm:col-span-2">
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
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar produto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>
      ) : produtos.length === 0 ? (
        <EmptyState mensagem="Nenhum produto cadastrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo;
                return (
                  <tr key={produto.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      <Link href={`/estoque/produtos/${produto.id}`} className="hover:underline">
                        {produto.nome}
                      </Link>
                      {!produto.ativo && <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">(inativo)</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{produto.categoria ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatarMoeda(produto.precoVenda)}</td>
                    <td className={`px-4 py-3 ${estoqueBaixo ? "font-medium text-red-600 dark:text-red-400" : "text-neutral-600 dark:text-neutral-400"}`}>
                      {produto.estoqueAtual}
                      {estoqueBaixo && " ⚠"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/estoque/produtos/${produto.id}`} className="mr-3 text-neutral-600 dark:text-neutral-400 hover:underline">
                        Ver
                      </Link>
                      <button onClick={() => excluir(produto)} className="text-red-600 dark:text-red-400 hover:underline">
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
