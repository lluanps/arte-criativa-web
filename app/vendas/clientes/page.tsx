"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ClienteRequest, ClienteResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";

const CLIENTE_VAZIO: ClienteRequest = { nome: "", telefone: "", email: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<ClienteRequest>(CLIENTE_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setClientes(await api.get<ClienteResponse[]>("/clientes"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar clientes");
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
      await api.post("/clientes", form);
      setForm(CLIENTE_VAZIO);
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao criar cliente");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(cliente: ClienteResponse) {
    if (!confirm(`Excluir "${cliente.nome}"?`)) return;
    try {
      await api.del(`/clientes/${cliente.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir cliente");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/vendas" className="text-base text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo="Clientes"
        descricao="Clientes do ateliê, vinculados às vendas."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "+ Novo cliente"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-3">
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
            <div className="sm:col-span-3">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar cliente"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : clientes.length === 0 ? (
        <EmptyState mensagem="Nenhum cliente cadastrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Telefone</th>
                <th className="px-5 py-4">E-mail</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/vendas/clientes/${cliente.id}`} className="hover:underline">
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{cliente.telefone ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{cliente.email ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/vendas/clientes/${cliente.id}`} className="mr-3 text-ink-secondary hover:underline">
                      Ver
                    </Link>
                    <button onClick={() => excluir(cliente)} className="text-critical hover:underline">
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
