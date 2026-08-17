"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { CategoriaRequest, CategoriaResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from "@/components/ui";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeNovo, setNomeNovo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

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

  async function excluir(categoria: CategoriaResponse) {
    if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return;
    try {
      await api.del(`/categorias/${categoria.id}`);
      await carregar();
    } catch (e) {
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
                    ) : (
                      <>
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
