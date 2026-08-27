"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { FornecedorRequest, FornecedorResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

const FORNECEDOR_VAZIO: FornecedorRequest = { nome: "", telefone: "", observacao: "" };

export default function FornecedoresPage() {
  const perguntar = useConfirm();
  const [fornecedores, setFornecedores] = useState<FornecedorResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FornecedorRequest>(FORNECEDOR_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setFornecedores(await api.get<FornecedorResponse[]>("/fornecedores"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar fornecedores");
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
    try {
      await api.post("/fornecedores", form);
      setForm(FORNECEDOR_VAZIO);
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao criar fornecedor");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(fornecedor: FornecedorResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir "${fornecedor.nome}"?`,
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    try {
      await api.del(`/fornecedores/${fornecedor.id}`);
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
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir fornecedor");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/estoque" className="text-base text-ink-secondary hover:underline">
        ← Estoque
      </Link>
      <PageHeader
        titulo="Fornecedores"
        descricao="Fornecedores de matéria-prima, usados na compra de insumos."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "+ Novo fornecedor"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                placeholder="ex: loja no Mercado Livre, condições de entrega..."
                value={form.observacao ?? ""}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar fornecedor"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : fornecedores.length === 0 ? (
        <EmptyState mensagem="Nenhum fornecedor cadastrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Telefone</th>
                <th className="px-5 py-4">Observação</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/estoque/fornecedores/${fornecedor.id}`} className="hover:underline">
                      {fornecedor.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{fornecedor.telefone ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{fornecedor.observacao ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/estoque/fornecedores/${fornecedor.id}`} className="mr-3 text-ink-secondary hover:underline">
                      Ver
                    </Link>
                    <button onClick={() => excluir(fornecedor)} className="text-critical hover:underline">
                      Excluir
                    </button>
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
