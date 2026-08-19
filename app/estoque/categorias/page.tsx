"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarData, formatarMoeda } from "@/lib/format";
import { CategoriaRequest, CategoriaResponse, PrecoMercadoRequest } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

export default function CategoriasPage() {
  const perguntar = useConfirm();
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeNovo, setNomeNovo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const [editandoPrecoId, setEditandoPrecoId] = useState<number | null>(null);
  const [minEdicao, setMinEdicao] = useState("");
  const [maxEdicao, setMaxEdicao] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setCategorias(await api.get<CategoriaResponse[]>("/categorias"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar categorias");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeNovo.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const request: CategoriaRequest = { nome: nomeNovo.trim() };
      await api.post("/categorias", request);
      setNomeNovo("");
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao criar categoria");
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(categoria: CategoriaResponse) {
    setEditandoId(categoria.id);
    setNomeEdicao(categoria.nome);
  }

  async function salvarEdicao(id: number) {
    if (!nomeEdicao.trim()) return;
    setErro(null);
    try {
      const request: CategoriaRequest = { nome: nomeEdicao.trim() };
      await api.put(`/categorias/${id}`, request);
      setEditandoId(null);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar categoria");
    }
  }

  function iniciarEdicaoPreco(categoria: CategoriaResponse) {
    setEditandoPrecoId(categoria.id);
    setMinEdicao(categoria.precoMercadoMin?.toString() ?? "");
    setMaxEdicao(categoria.precoMercadoMax?.toString() ?? "");
  }

  async function salvarPreco(id: number) {
    const min = Number(minEdicao);
    const max = Number(maxEdicao);
    if (!minEdicao || !maxEdicao || Number.isNaN(min) || Number.isNaN(max)) return;
    setErro(null);
    try {
      const request: PrecoMercadoRequest = { min, max };
      await api.put(`/categorias/${id}/preco-mercado`, request);
      setEditandoPrecoId(null);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar referência de mercado");
    }
  }

  async function excluir(categoria: CategoriaResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir a categoria "${categoria.nome}"?`,
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    try {
      await api.del(`/categorias/${categoria.id}`);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        await perguntar({
          titulo: "Não é possível excluir",
          descricao: e.message,
          tone: "warning",
          acoes: [{ id: "entendi", label: "Entendi", variant: "primary" }],
        });
        return;
      }
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir categoria");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/estoque" className="text-base text-ink-secondary hover:underline">
        ← Estoque
      </Link>
      <PageHeader titulo="Categorias" descricao="Categorias usadas para organizar os produtos." />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card className="mb-6">
        <form onSubmit={criar} className="flex gap-3">
          <Input
            placeholder="Nome da categoria"
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
          />
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "+ Nova categoria"}
          </Button>
        </form>
      </Card>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : categorias.length === 0 ? (
        <EmptyState mensagem="Nenhuma categoria cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Referência de mercado</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    {editandoId === categoria.id ? (
                      <Input
                        autoFocus
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao(categoria.id)}
                      />
                    ) : (
                      categoria.nome
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">
                    {editandoPrecoId === categoria.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="min"
                          className="w-24"
                          value={minEdicao}
                          onChange={(e) => setMinEdicao(e.target.value)}
                        />
                        <span>–</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="max"
                          className="w-24"
                          value={maxEdicao}
                          onChange={(e) => setMaxEdicao(e.target.value)}
                        />
                      </div>
                    ) : categoria.precoMercadoMin !== null && categoria.precoMercadoMax !== null ? (
                      <>
                        {formatarMoeda(categoria.precoMercadoMin)} – {formatarMoeda(categoria.precoMercadoMax)}
                        {categoria.precoMercadoAtualizadoEm && (
                          <span className="ml-2 text-sm text-ink-faint">
                            (atualizado em {formatarData(categoria.precoMercadoAtualizadoEm.slice(0, 10))})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-faint">Sem referência ainda</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {editandoId === categoria.id ? (
                      <>
                        <button onClick={() => salvarEdicao(categoria.id)} className="mr-3 font-medium text-accent hover:underline">
                          Salvar
                        </button>
                        <button onClick={() => setEditandoId(null)} className="text-ink-secondary hover:underline">
                          Cancelar
                        </button>
                      </>
                    ) : editandoPrecoId === categoria.id ? (
                      <>
                        <button onClick={() => salvarPreco(categoria.id)} className="mr-3 font-medium text-accent hover:underline">
                          Salvar
                        </button>
                        <button onClick={() => setEditandoPrecoId(null)} className="text-ink-secondary hover:underline">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => iniciarEdicaoPreco(categoria)} className="mr-3 text-ink-secondary hover:underline">
                          Ref. mercado
                        </button>
                        <button onClick={() => iniciarEdicao(categoria)} className="mr-3 text-ink-secondary hover:underline">
                          Editar
                        </button>
                        <button onClick={() => excluir(categoria)} className="text-critical hover:underline">
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
