"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarMoeda } from "@/lib/format";
import { MateriaPrimaRequest, MateriaPrimaResponse } from "@/types/estoque";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

const MATERIA_PRIMA_VAZIA: MateriaPrimaRequest = {
  nome: "",
  unidadeMedida: "",
  custoUnitario: 0,
  estoqueMinimo: 0,
  volumeMl: null,
  fornecedor: "",
};

export default function MateriasPrimasPage() {
  const perguntar = useConfirm();
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<MateriaPrimaRequest>(MATERIA_PRIMA_VAZIA);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.get<MateriaPrimaResponse[]>("/materias-primas");
      setMateriasPrimas(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar matérias-primas");
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
      await api.post("/materias-primas", form);
      setForm(MATERIA_PRIMA_VAZIA);
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar matéria-prima");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(materiaPrima: MateriaPrimaResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir "${materiaPrima.nome}"?`,
      descricao: "Essa ação não pode ser desfeita.",
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    try {
      await api.del(`/materias-primas/${materiaPrima.id}`);
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
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir matéria-prima");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Matérias-primas"
        descricao="Insumos usados na produção dos produtos."
        acao={
          <Button onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "Nova matéria-prima"}
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
              <Label htmlFor="unidadeMedida">Unidade de medida *</Label>
              <Input
                id="unidadeMedida"
                placeholder="g, ml, un..."
                required
                value={form.unidadeMedida}
                onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}
              />
              {errosCampos.unidadeMedida && <p className="mt-1 text-sm text-critical">{errosCampos.unidadeMedida}</p>}
            </div>
            <div>
              <Label htmlFor="custoUnitario">Custo unitário *</Label>
              <Input
                id="custoUnitario"
                type="number"
                step="0.0001"
                min="0"
                required
                value={form.custoUnitario}
                onChange={(e) => setForm({ ...form, custoUnitario: Number(e.target.value) })}
              />
              {errosCampos.custoUnitario && <p className="mt-1 text-sm text-critical">{errosCampos.custoUnitario}</p>}
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
              <Label htmlFor="volumeMl">Volume (ml)</Label>
              <Input
                id="volumeMl"
                type="number"
                step="1"
                min="0"
                value={form.volumeMl ?? ""}
                onChange={(e) => setForm({ ...form, volumeMl: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" value={form.fornecedor ?? ""} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar matéria-prima"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : materiasPrimas.length === 0 ? (
        <EmptyState mensagem="Nenhuma matéria-prima cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Unidade</th>
                <th className="px-5 py-4">Custo unitário</th>
                <th className="px-5 py-4">Estoque</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {materiasPrimas.map((mp) => {
                const estoqueBaixo = mp.estoqueAtual <= mp.estoqueMinimo;
                return (
                  <tr key={mp.id} className="border-b border-hairline last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">
                      <Link href={`/estoque/materias-primas/${mp.id}`} className="hover:underline">
                        {mp.nome}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary">{mp.unidadeMedida}</td>
                    <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(mp.custoUnitario)}</td>
                    <td className={`px-5 py-4 ${estoqueBaixo ? "font-medium text-critical" : "text-ink-secondary"}`}>
                      {mp.estoqueAtual}
                      {estoqueBaixo && " ⚠"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/estoque/materias-primas/${mp.id}`} className="mr-3 text-ink-secondary hover:underline">
                        Ver
                      </Link>
                      <button onClick={() => excluir(mp)} className="text-critical hover:underline">
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
