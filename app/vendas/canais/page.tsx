"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { CanalVendaRequest, CanalVendaResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

export default function CanaisVendaPage() {
  const perguntar = useConfirm();
  const [canais, setCanais] = useState<CanalVendaResponse[]>([]);
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
      setCanais(await api.get<CanalVendaResponse[]>("/canais-venda"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar canais de venda");
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
      const request: CanalVendaRequest = { nome: nomeNovo.trim() };
      await api.post("/canais-venda", request);
      setNomeNovo("");
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao criar canal de venda");
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(canal: CanalVendaResponse) {
    setEditandoId(canal.id);
    setNomeEdicao(canal.nome);
  }

  async function salvarEdicao(id: number) {
    if (!nomeEdicao.trim()) return;
    setErro(null);
    try {
      const request: CanalVendaRequest = { nome: nomeEdicao.trim() };
      await api.put(`/canais-venda/${id}`, request);
      setEditandoId(null);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar canal de venda");
    }
  }

  async function excluir(canal: CanalVendaResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir o canal "${canal.nome}"?`,
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    try {
      await api.del(`/canais-venda/${canal.id}`);
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
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir canal de venda");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/vendas" className="text-base text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader titulo="Canais de venda" descricao="Onde as vendas acontecem — Instagram, feira, loja física..." />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card className="mb-6">
        <form onSubmit={criar} className="flex gap-3">
          <Input placeholder="Nome do canal" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} />
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "+ Novo canal"}
          </Button>
        </form>
      </Card>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : canais.length === 0 ? (
        <EmptyState mensagem="Nenhum canal de venda cadastrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {canais.map((canal) => (
                <tr key={canal.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    {editandoId === canal.id ? (
                      <Input
                        autoFocus
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao(canal.id)}
                      />
                    ) : (
                      canal.nome
                    )}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {editandoId === canal.id ? (
                      <>
                        <button onClick={() => salvarEdicao(canal.id)} className="mr-3 font-medium text-accent hover:underline">
                          Salvar
                        </button>
                        <button onClick={() => setEditandoId(null)} className="text-ink-secondary hover:underline">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => iniciarEdicao(canal)} className="mr-3 text-ink-secondary hover:underline">
                          Editar
                        </button>
                        <button onClick={() => excluir(canal)} className="text-critical hover:underline">
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
