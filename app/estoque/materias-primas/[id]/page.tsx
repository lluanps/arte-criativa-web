"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import {
  MateriaPrimaRequest,
  MateriaPrimaResponse,
  MotivoMovimentacaoMateriaPrima,
  MovimentacaoMateriaPrimaRequest,
  MovimentacaoResponse,
  TipoMovimentacao,
} from "@/types/estoque";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

const MOTIVOS: MotivoMovimentacaoMateriaPrima[] = ["COMPRA", "PRODUCAO", "AJUSTE", "PERDA"];

export default function MateriaPrimaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [materiaPrima, setMateriaPrima] = useState<MateriaPrimaResponse | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<MateriaPrimaRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [movForm, setMovForm] = useState<MovimentacaoMateriaPrimaRequest>({
    tipo: "ENTRADA",
    motivo: "COMPRA",
    quantidade: 0,
    observacao: "",
  });
  const [registrandoMov, setRegistrandoMov] = useState(false);
  const [erroMov, setErroMov] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [mp, movs] = await Promise.all([
        api.get<MateriaPrimaResponse>(`/materias-primas/${id}`),
        api.get<MovimentacaoResponse[]>(`/materias-primas/${id}/movimentacoes`),
      ]);
      setMateriaPrima(mp);
      setForm({
        nome: mp.nome,
        unidadeMedida: mp.unidadeMedida,
        custoUnitario: mp.custoUnitario,
        estoqueMinimo: mp.estoqueMinimo,
        fornecedor: mp.fornecedor ?? "",
      });
      setMovimentacoes(movs);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar matéria-prima");
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
    setErrosCampos({});
    try {
      const atualizado = await api.put<MateriaPrimaResponse>(`/materias-primas/${id}`, form);
      setMateriaPrima(atualizado);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao salvar matéria-prima");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function registrarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    setRegistrandoMov(true);
    setErroMov(null);
    try {
      await api.post(`/materias-primas/${id}/movimentacoes`, movForm);
      setMovForm({ tipo: "ENTRADA", motivo: "COMPRA", quantidade: 0, observacao: "" });
      await carregar();
    } catch (e) {
      setErroMov(e instanceof ApiError ? e.message : "Erro ao registrar movimentação");
    } finally {
      setRegistrandoMov(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-4xl px-6 py-10 text-sm text-neutral-500">Carregando...</main>;
  if (!materiaPrima || !form)
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Matéria-prima não encontrada"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/estoque/materias-primas" className="text-sm text-neutral-500 hover:underline">
        ← Matérias-primas
      </Link>
      <PageHeader
        titulo={materiaPrima.nome}
        descricao={`Estoque atual: ${materiaPrima.estoqueAtual} ${materiaPrima.unidadeMedida} · Custo unitário: ${formatarMoeda(materiaPrima.custoUnitario)}`}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Editar matéria-prima</h2>
          <form onSubmit={salvar} className="grid gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              {errosCampos.nome && <p className="mt-1 text-xs text-red-600">{errosCampos.nome}</p>}
            </div>
            <div>
              <Label htmlFor="unidadeMedida">Unidade de medida *</Label>
              <Input
                id="unidadeMedida"
                required
                value={form.unidadeMedida}
                onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}
              />
              {errosCampos.unidadeMedida && <p className="mt-1 text-xs text-red-600">{errosCampos.unidadeMedida}</p>}
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
              {errosCampos.custoUnitario && <p className="mt-1 text-xs text-red-600">{errosCampos.custoUnitario}</p>}
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
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" value={form.fornecedor ?? ""} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Registrar movimentação</h2>
          {erroMov && <ErrorBanner mensagem={erroMov} />}
          <form onSubmit={registrarMovimentacao} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={movForm.tipo}
                  onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as TipoMovimentacao })}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Select
                  id="motivo"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value as MotivoMovimentacaoMateriaPrima })}
                >
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.001"
                min="0"
                required
                value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={movForm.observacao ?? ""}
                onChange={(e) => setMovForm({ ...movForm, observacao: e.target.value })}
              />
            </div>
            <div>
              <Button type="submit" disabled={registrandoMov}>
                {registrandoMov ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <h2 className="mb-4 mt-8 font-semibold">Histórico de movimentações</h2>
      {movimentacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma movimentação registrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Observação</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov) => (
                <tr key={mov.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-600">{formatarDataHora(mov.dataMovimentacao)}</td>
                  <td className={`px-4 py-3 font-medium ${mov.tipo === "ENTRADA" ? "text-green-700" : "text-red-700"}`}>
                    {mov.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{mov.motivo}</td>
                  <td className="px-4 py-3 text-neutral-600">{mov.quantidade}</td>
                  <td className="px-4 py-3 text-neutral-600">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
