"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { FornecedorRequest, FornecedorResponse } from "@/types/cadastros";
import { Button, Card, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

export default function FornecedorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [fornecedor, setFornecedor] = useState<FornecedorResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<FornecedorRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const f = await api.get<FornecedorResponse>(`/fornecedores/${id}`);
      setFornecedor(f);
      setForm({ nome: f.nome, telefone: f.telefone ?? "", observacao: f.observacao ?? "" });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar fornecedor");
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
      const atualizado = await api.put<FornecedorResponse>(`/fornecedores/${id}`, form);
      setFornecedor(atualizado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar fornecedor");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const confirmacao = await perguntar({
      titulo: "Excluir esse fornecedor?",
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
      await api.del(`/fornecedores/${id}`);
      router.push("/estoque/fornecedores");
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
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir fornecedor");
    }
  }

  if (carregando) return <main className="mx-auto max-w-3xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (!fornecedor || !form)
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Fornecedor não encontrado"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/estoque/fornecedores" className="text-base text-ink-secondary hover:underline">
        ← Fornecedores
      </Link>
      <PageHeader titulo={fornecedor.nome} />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Editar fornecedor</h2>
        <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-2">
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
              value={form.observacao ?? ""}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-4 sm:col-span-2">
            <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir fornecedor"}
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
