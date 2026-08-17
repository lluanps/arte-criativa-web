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
    <main className="mx-auto max-w-6xl px-6 py-10">
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
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              {errosCampos.nome && <p className="mt-1 text-sm text-critical">{errosCampos.nome}</p>}
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
              {errosCampos.precoVenda && <p className="mt-1 text-sm text-critical">{errosCampos.precoVenda}</p>}
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
                className="mb-1.5 block text-sm font-medium text-ink-secondary hover:underline"
              >
                ✨ Gerar com ChatGPT
              </button>
              <Input id="descricao" value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fotoUrl">URL da foto</Label>
              <div className="mb-1.5 flex gap-3 text-sm font-medium text-ink-secondary">
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
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : produtos.length === 0 ? (
        <EmptyState mensagem="Nenhum produto cadastrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Categoria</th>
                <th className="px-5 py-4">Preço</th>
                <th className="px-5 py-4">Estoque</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo;
                return (
                  <tr key={produto.id} className="border-b border-hairline last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">
                      <Link href={`/estoque/produtos/${produto.id}`} className="hover:underline">
                        {produto.nome}
                      </Link>
                      {!produto.ativo && <span className="ml-2 text-sm text-ink-faint">(inativo)</span>}
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">{produto.categoria ?? "—"}</td>
                    <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(produto.precoVenda)}</td>
                    <td className={`px-5 py-4 ${estoqueBaixo ? "font-medium text-critical" : "text-ink-secondary"}`}>
                      {produto.estoqueAtual}
                      {estoqueBaixo && " ⚠"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/estoque/produtos/${produto.id}`} className="mr-3 text-ink-secondary hover:underline">
                        Ver
                      </Link>
                      <button onClick={() => excluir(produto)} className="text-critical hover:underline">
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
