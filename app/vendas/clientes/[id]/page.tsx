"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import { ClienteRequest, ClienteResponse } from "@/types/cadastros";
import { VendaResponse } from "@/types/vendas";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

export default function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<ClienteRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [c, historico] = await Promise.all([
        api.get<ClienteResponse>(`/clientes/${id}`),
        api.get<VendaResponse[]>(`/vendas/cliente/${id}`),
      ]);
      setCliente(c);
      setForm({ nome: c.nome, telefone: c.telefone ?? "", email: c.email ?? "" });
      setVendas(historico);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar cliente");
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
    try {
      const atualizado = await api.put<ClienteResponse>(`/clientes/${id}`, form);
      setCliente(atualizado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar cliente");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const confirmacao = await perguntar({
      titulo: "Excluir esse cliente?",
      descricao: "Essa ação não pode ser desfeita.",
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    setExcluindo(true);
    setErro(null);
    try {
      await api.del(`/clientes/${id}`);
      router.push("/vendas/clientes");
    } catch (e) {
      setExcluindo(false);
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        await perguntar({
          titulo: "Não é possível excluir",
          descricao: e.message,
          tone: "warning",
          acoes: [{ id: "entendi", label: "Entendi", variant: "primary" }],
        });
        return;
      }
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir cliente");
    }
  }

  if (carregando) return <main className="mx-auto max-w-4xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (!cliente || !form)
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Cliente não encontrado"} />
      </main>
    );

  const totalGasto = vendas.reduce((soma, v) => soma + v.valorTotal, 0);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/vendas/clientes" className="text-base text-ink-secondary hover:underline">
        ← Clientes
      </Link>
      <PageHeader
        titulo={cliente.nome}
        descricao={`${vendas.length} venda${vendas.length === 1 ? "" : "s"} · Total: ${formatarMoeda(totalGasto)}`}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Editar cliente</h2>
        <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex items-center justify-between sm:col-span-3 border-t border-hairline pt-4">
            <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir cliente"}
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Histórico de vendas</h2>
      {vendas.length === 0 ? (
        <EmptyState mensagem="Esse cliente ainda não tem vendas registradas." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Canal</th>
                <th className="px-5 py-4">Itens</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda) => (
                <tr key={venda.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarDataHora(venda.dataVenda)}</td>
                  <td className="px-5 py-4 text-ink-secondary">{venda.canalNome ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{venda.itens.length}</td>
                  <td className="px-5 py-4 font-medium text-ink">{formatarMoeda(venda.valorTotal)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/vendas/${venda.id}`} className="text-ink-secondary hover:underline">
                      Ver
                    </Link>
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
