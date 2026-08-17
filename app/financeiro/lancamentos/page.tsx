"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { LancamentoFinanceiroRequest, LancamentoFinanceiroResponse, TipoLancamento } from "@/types/financeiro";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiroResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState<TipoLancamento>("DESPESA");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [dataLancamento, setDataLancamento] = useState(dataLocalISO());
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.get<LancamentoFinanceiroResponse[]>("/lancamentos-financeiros");
      setLancamentos(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar lançamentos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function resetarForm() {
    setTipo("DESPESA");
    setCategoria("");
    setValor(0);
    setDescricao("");
    setDataLancamento(dataLocalISO());
    setMostrarForm(false);
    setErrosCampos({});
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});
    const request: LancamentoFinanceiroRequest = { tipo, categoria, valor, descricao: descricao || null, dataLancamento };
    setSalvando(true);
    try {
      await api.post("/lancamentos-financeiros", request);
      resetarForm();
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar lançamento");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(lancamento: LancamentoFinanceiroResponse) {
    if (!confirm(`Excluir o lançamento "${lancamento.categoria}"?`)) return;
    setErro(null);
    try {
      await api.del(`/lancamentos-financeiros/${lancamento.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir lançamento");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/financeiro" className="text-base text-ink-secondary hover:underline">
        ← Financeiro
      </Link>
      <PageHeader
        titulo="Lançamentos"
        descricao="Receitas e despesas. Os gerados automaticamente (ex: por uma venda) não podem ser editados aqui."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Novo lançamento"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoLancamento)}>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Input id="categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value)} />
              {errosCampos.categoria && <p className="mt-1 text-sm text-critical">{errosCampos.categoria}</p>}
            </div>
            <div>
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
              {errosCampos.valor && <p className="mt-1 text-sm text-critical">{errosCampos.valor}</p>}
            </div>
            <div>
              <Label htmlFor="dataLancamento">Data *</Label>
              <Input
                id="dataLancamento"
                type="date"
                required
                value={dataLancamento}
                onChange={(e) => setDataLancamento(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar lançamento"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : lancamentos.length === 0 ? (
        <EmptyState mensagem="Nenhum lançamento registrado ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Categoria</th>
                <th className="px-5 py-4">Descrição</th>
                <th className="px-5 py-4">Valor</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarData(l.dataLancamento)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={l.tipo === "RECEITA" ? "success" : "danger"}>{l.tipo === "RECEITA" ? "Receita" : "Despesa"}</Badge>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{l.categoria}</td>
                  <td className="px-5 py-4 text-ink-secondary">{l.descricao ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(l.valor)}</td>
                  <td className="px-5 py-4 text-right">
                    {l.origem === "MANUAL" ? (
                      <button onClick={() => excluir(l)} className="text-critical hover:underline">
                        Excluir
                      </button>
                    ) : (
                      <Badge>gerado por {l.origem.toLowerCase()}</Badge>
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
