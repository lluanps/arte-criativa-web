"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { ContaResponse, LancamentoFinanceiroResponse, TipoConta, TipoLancamento } from "@/types/financeiro";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, StatCard } from "@/components/ui";

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

/** Tira o "(parcela X/N)" que o backend grudou na descrição de cada parcela, pra
 * mostrar só o nome da compra original no bloco de parcelamentos. */
function descricaoBase(descricao: string): string {
  return descricao.replace(/\s*\(parcela \d+\/\d+\)\s*$/, "");
}

interface LinhaCategoria {
  tipo: TipoLancamento;
  categoria: string;
  total: number;
}

interface GrupoParcelamento {
  grupoId: string;
  tipo: TipoConta;
  descricao: string;
  parcelas: ContaResponse[];
  pagas: number;
  valorPago: number;
  valorTotal: number;
  valorRestante: number;
  proximaPendente: ContaResponse | null;
}

function agruparPorCategoria(lancamentos: LancamentoFinanceiroResponse[]): LinhaCategoria[] {
  const mapa = new Map<string, LinhaCategoria>();
  for (const l of lancamentos) {
    const chave = `${l.tipo}::${l.categoria}`;
    const atual = mapa.get(chave) ?? { tipo: l.tipo, categoria: l.categoria, total: 0 };
    atual.total += l.valor;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

/** Só grupos com parcela ainda pendente/atrasada entram aqui — um parcelamento
 * inteiramente pago já "terminou", não é mais "em andamento". */
function agruparParcelamentos(contas: ContaResponse[]): GrupoParcelamento[] {
  const mapa = new Map<string, ContaResponse[]>();
  for (const c of contas) {
    if (!c.grupoParcelamentoId) continue;
    const lista = mapa.get(c.grupoParcelamentoId) ?? [];
    lista.push(c);
    mapa.set(c.grupoParcelamentoId, lista);
  }
  const grupos: GrupoParcelamento[] = [];
  for (const [grupoId, parcelas] of mapa) {
    parcelas.sort((a, b) => (a.numeroParcela ?? 0) - (b.numeroParcela ?? 0));
    const pagas = parcelas.filter((p) => p.status === "PAGO");
    if (pagas.length === parcelas.length) continue; // já terminou, não mostra
    const pendentes = parcelas.filter((p) => p.status !== "PAGO");
    const valorPago = pagas.reduce((soma, p) => soma + p.valor, 0);
    const valorTotal = parcelas.reduce((soma, p) => soma + p.valor, 0);
    grupos.push({
      grupoId,
      tipo: parcelas[0].tipo,
      descricao: descricaoBase(parcelas[0].descricao),
      parcelas,
      pagas: pagas.length,
      valorPago,
      valorTotal,
      valorRestante: valorTotal - valorPago,
      proximaPendente: pendentes.sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] ?? null,
    });
  }
  return grupos.sort((a, b) => (a.proximaPendente?.vencimento ?? "").localeCompare(b.proximaPendente?.vencimento ?? ""));
}

/** Tudo que ainda não venceu (status PENDENTE de verdade, não ATRASADO) — o que "vai
 * entrar/sair" daqui pra frente, independente do período filtrado acima no relatório. */
function futuras(contas: ContaResponse[]): ContaResponse[] {
  const hoje = dataLocalISO();
  return contas
    .filter((c) => c.status === "PENDENTE" && c.vencimento >= hoje)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

function exportarCsv(params: {
  inicio: string;
  fim: string;
  totalReceitas: number;
  totalDespesas: number;
  despesasPorCategoria: LinhaCategoria[];
  receitasPorCategoria: LinhaCategoria[];
  maioresDespesas: LancamentoFinanceiroResponse[];
  maioresReceitas: LancamentoFinanceiroResponse[];
  lancamentos: LancamentoFinanceiroResponse[];
  parcelamentos: GrupoParcelamento[];
  futuras: ContaResponse[];
}) {
  const linhas: string[] = [];
  linhas.push(`Relatório financeiro;${formatarData(params.inicio)} até ${formatarData(params.fim)}`);
  linhas.push("");
  linhas.push("Resumo do período");
  linhas.push(`Receitas;${params.totalReceitas.toFixed(2).replace(".", ",")}`);
  linhas.push(`Despesas;${params.totalDespesas.toFixed(2).replace(".", ",")}`);
  linhas.push(`Saldo;${(params.totalReceitas - params.totalDespesas).toFixed(2).replace(".", ",")}`);
  linhas.push("");
  linhas.push("Despesas por categoria");
  linhas.push("Categoria;Total (R$);% das despesas");
  for (const c of params.despesasPorCategoria) {
    const pct = params.totalDespesas > 0 ? `${((c.total / params.totalDespesas) * 100).toFixed(1)}%` : "—";
    linhas.push(`${c.categoria};${c.total.toFixed(2).replace(".", ",")};${pct}`);
  }
  linhas.push("");
  linhas.push("Receitas por categoria");
  linhas.push("Categoria;Total (R$);% das receitas");
  for (const c of params.receitasPorCategoria) {
    const pct = params.totalReceitas > 0 ? `${((c.total / params.totalReceitas) * 100).toFixed(1)}%` : "—";
    linhas.push(`${c.categoria};${c.total.toFixed(2).replace(".", ",")};${pct}`);
  }
  linhas.push("");
  linhas.push("Maiores despesas do período");
  linhas.push("Data;Categoria;Descrição;Valor (R$)");
  for (const l of params.maioresDespesas) {
    linhas.push(`${formatarData(l.dataLancamento)};${l.categoria};${l.descricao ?? "—"};${l.valor.toFixed(2).replace(".", ",")}`);
  }
  linhas.push("");
  linhas.push("Maiores receitas do período");
  linhas.push("Data;Categoria;Descrição;Valor (R$)");
  for (const l of params.maioresReceitas) {
    linhas.push(`${formatarData(l.dataLancamento)};${l.categoria};${l.descricao ?? "—"};${l.valor.toFixed(2).replace(".", ",")}`);
  }
  linhas.push("");
  linhas.push("Lançamentos detalhados do período");
  linhas.push("Data;Tipo;Categoria;Descrição;Valor (R$)");
  for (const l of params.lancamentos) {
    linhas.push(
      `${formatarData(l.dataLancamento)};${l.tipo === "RECEITA" ? "Receita" : "Despesa"};${l.categoria};${l.descricao ?? "—"};${l.valor.toFixed(2).replace(".", ",")}`
    );
  }
  linhas.push("");
  linhas.push("Parcelamentos em andamento");
  linhas.push("Descrição;Tipo;Parcelas pagas;Valor pago (R$);Valor restante (R$);Valor total (R$);Próxima parcela");
  for (const g of params.parcelamentos) {
    linhas.push(
      `${g.descricao};${g.tipo === "PAGAR" ? "A pagar" : "A receber"};${g.pagas}/${g.parcelas.length};${g.valorPago.toFixed(2).replace(".", ",")};${g.valorRestante.toFixed(2).replace(".", ",")};${g.valorTotal.toFixed(2).replace(".", ",")};${g.proximaPendente ? formatarData(g.proximaPendente.vencimento) : "—"}`
    );
  }
  linhas.push("");
  linhas.push("Futuro (contas a vencer)");
  linhas.push("Vencimento;Tipo;Descrição;Valor (R$)");
  for (const c of params.futuras) {
    linhas.push(`${formatarData(c.vencimento)};${c.tipo === "PAGAR" ? "A pagar" : "A receber"};${c.descricao};${c.valor.toFixed(2).replace(".", ",")}`);
  }

  const conteudo = "﻿" + linhas.join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financeiro-relatorio_${params.inicio}_a_${params.fim}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportarPdf(params: {
  inicio: string;
  fim: string;
  totalReceitas: number;
  totalDespesas: number;
  despesasPorCategoria: LinhaCategoria[];
  receitasPorCategoria: LinhaCategoria[];
  maioresDespesas: LancamentoFinanceiroResponse[];
  maioresReceitas: LancamentoFinanceiroResponse[];
  lancamentos: LancamentoFinanceiroResponse[];
  parcelamentos: GrupoParcelamento[];
  futuras: ContaResponse[];
}) {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF();
  const proximaTabela = () => {
    // @ts-expect-error -- lastAutoTable é injetado pelo plugin, sem tipo próprio
    return doc.lastAutoTable.finalY + 10;
  };
  const novaSecao = (titulo: string, y: number) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(titulo, 14, y);
    return y + 4;
  };

  doc.setFontSize(16);
  doc.text("Arte Criativa", 14, 17);
  doc.setFontSize(12);
  doc.text("Relatório financeiro", 14, 25);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Período: ${formatarData(params.inicio)} até ${formatarData(params.fim)}`, 14, 31);

  const saldo = params.totalReceitas - params.totalDespesas;
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text(
    `Receitas: ${formatarMoeda(params.totalReceitas)}    Despesas: ${formatarMoeda(params.totalDespesas)}    Saldo: ${formatarMoeda(saldo)}`,
    14,
    39
  );

  let y = novaSecao("Despesas por categoria", 46);
  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Total", "% das despesas"]],
    body: params.despesasPorCategoria.map((c) => [
      c.categoria,
      formatarMoeda(c.total),
      params.totalDespesas > 0 ? `${((c.total / params.totalDespesas) * 100).toFixed(1)}%` : "—",
    ]),
    headStyles: { fillColor: [90, 74, 58] },
    margin: { top: y },
  });
  y = proximaTabela();

  if (params.receitasPorCategoria.length > 0) {
    y = novaSecao("Receitas por categoria", y);
    autoTable(doc, {
      startY: y,
      head: [["Categoria", "Total", "% das receitas"]],
      body: params.receitasPorCategoria.map((c) => [
        c.categoria,
        formatarMoeda(c.total),
        params.totalReceitas > 0 ? `${((c.total / params.totalReceitas) * 100).toFixed(1)}%` : "—",
      ]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
    y = proximaTabela();
  }

  if (params.maioresDespesas.length > 0) {
    y = novaSecao("Maiores despesas do período", y);
    autoTable(doc, {
      startY: y,
      head: [["Data", "Categoria", "Descrição", "Valor"]],
      body: params.maioresDespesas.map((l) => [formatarData(l.dataLancamento), l.categoria, l.descricao ?? "—", formatarMoeda(l.valor)]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
    y = proximaTabela();
  }

  if (params.maioresReceitas.length > 0) {
    y = novaSecao("Maiores receitas do período", y);
    autoTable(doc, {
      startY: y,
      head: [["Data", "Categoria", "Descrição", "Valor"]],
      body: params.maioresReceitas.map((l) => [formatarData(l.dataLancamento), l.categoria, l.descricao ?? "—", formatarMoeda(l.valor)]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
    y = proximaTabela();
  }

  if (params.parcelamentos.length > 0) {
    y = novaSecao("Parcelamentos em andamento", y);
    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Tipo", "Pagas", "Pago", "Restante", "Total", "Próxima"]],
      body: params.parcelamentos.map((g) => [
        g.descricao,
        g.tipo === "PAGAR" ? "A pagar" : "A receber",
        `${g.pagas}/${g.parcelas.length}`,
        formatarMoeda(g.valorPago),
        formatarMoeda(g.valorRestante),
        formatarMoeda(g.valorTotal),
        g.proximaPendente ? formatarData(g.proximaPendente.vencimento) : "—",
      ]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
    y = proximaTabela();
  }

  if (params.futuras.length > 0) {
    y = novaSecao("Futuro (contas a vencer)", y);
    autoTable(doc, {
      startY: y,
      head: [["Vencimento", "Tipo", "Descrição", "Valor"]],
      body: params.futuras.map((c) => [formatarData(c.vencimento), c.tipo === "PAGAR" ? "A pagar" : "A receber", c.descricao, formatarMoeda(c.valor)]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
    y = proximaTabela();
  }

  if (params.lancamentos.length > 0) {
    y = novaSecao("Lançamentos detalhados do período", y);
    autoTable(doc, {
      startY: y,
      head: [["Data", "Tipo", "Categoria", "Descrição", "Valor"]],
      body: params.lancamentos.map((l) => [
        formatarData(l.dataLancamento),
        l.tipo === "RECEITA" ? "Receita" : "Despesa",
        l.categoria,
        l.descricao ?? "—",
        formatarMoeda(l.valor),
      ]),
      headStyles: { fillColor: [90, 74, 58] },
      margin: { top: y },
    });
  }

  doc.save(`financeiro-relatorio_${params.inicio}_a_${params.fim}.pdf`);
}

export default function RelatorioFinanceiroPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(dataLocalISO());
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiroResponse[]>([]);
  const [contas, setContas] = useState<ContaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      // Lançamentos respeitam o período filtrado (é o "gasto desse mês" etc.); contas
      // vêm todas — parcelamentos em andamento e o bloco de futuro olham pra frente e
      // pra trás do período sem depender do filtro.
      const [dadosLancamentos, dadosContas] = await Promise.all([
        api.get<LancamentoFinanceiroResponse[]>(`/lancamentos-financeiros?inicio=${inicio}&fim=${fim}`),
        api.get<ContaResponse[]>("/contas"),
      ]);
      setLancamentos(dadosLancamentos);
      setContas(dadosContas);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar relatório");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalReceitas = useMemo(() => lancamentos.filter((l) => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0), [lancamentos]);
  const totalDespesas = useMemo(() => lancamentos.filter((l) => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0), [lancamentos]);
  const categorias = useMemo(() => agruparPorCategoria(lancamentos), [lancamentos]);
  const despesasPorCategoria = useMemo(() => categorias.filter((c) => c.tipo === "DESPESA"), [categorias]);
  const receitasPorCategoria = useMemo(() => categorias.filter((c) => c.tipo === "RECEITA"), [categorias]);
  const maioresDespesas = useMemo(
    () => [...lancamentos].filter((l) => l.tipo === "DESPESA").sort((a, b) => b.valor - a.valor).slice(0, 5),
    [lancamentos]
  );
  const maioresReceitas = useMemo(
    () => [...lancamentos].filter((l) => l.tipo === "RECEITA").sort((a, b) => b.valor - a.valor).slice(0, 5),
    [lancamentos]
  );
  const lancamentosOrdenados = useMemo(
    () => [...lancamentos].sort((a, b) => b.dataLancamento.localeCompare(a.dataLancamento)),
    [lancamentos]
  );
  const parcelamentos = useMemo(() => agruparParcelamentos(contas), [contas]);
  const contasFuturas = useMemo(() => futuras(contas), [contas]);

  const totalFuturoPagar = contasFuturas.filter((c) => c.tipo === "PAGAR").reduce((s, c) => s + c.valor, 0);
  const totalFuturoReceber = contasFuturas.filter((c) => c.tipo === "RECEBER").reduce((s, c) => s + c.valor, 0);

  const exportParams = {
    inicio,
    fim,
    totalReceitas,
    totalDespesas,
    despesasPorCategoria,
    receitasPorCategoria,
    maioresDespesas,
    maioresReceitas,
    lancamentos: lancamentosOrdenados,
    parcelamentos,
    futuras: contasFuturas,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/financeiro" className="text-base text-ink-secondary hover:underline">
        ← Financeiro
      </Link>
      <PageHeader
        titulo="Relatório financeiro"
        descricao="Gasto do período, progresso de contas parceladas e o que ainda está por vir."
        acao={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => exportarCsv(exportParams)} disabled={carregando}>
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              disabled={carregando || gerandoPdf}
              onClick={async () => {
                setGerandoPdf(true);
                try {
                  await exportarPdf(exportParams);
                } finally {
                  setGerandoPdf(false);
                }
              }}
            >
              {gerandoPdf ? "Gerando..." : "Exportar PDF"}
            </Button>
          </div>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            carregar();
          }}
          className="flex flex-wrap items-end gap-5"
        >
          <div>
            <Label htmlFor="inicio">De</Label>
            <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fim">Até</Label>
            <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <Button type="submit">Filtrar</Button>
        </form>
      </Card>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : (
        <div className="grid gap-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Resumo do período</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <StatCard label="Receitas" valor={formatarMoeda(totalReceitas)} tone="success" />
              <StatCard label="Despesas" valor={formatarMoeda(totalDespesas)} tone="danger" />
              <StatCard
                label="Saldo"
                valor={formatarMoeda(totalReceitas - totalDespesas)}
                tone={totalReceitas - totalDespesas >= 0 ? "success" : "danger"}
              />
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Despesas por categoria</h2>
              {despesasPorCategoria.length === 0 ? (
                <EmptyState mensagem="Nenhuma despesa no período selecionado." />
              ) : (
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-base">
                    <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                      <tr>
                        <th className="px-5 py-4">Categoria</th>
                        <th className="px-5 py-4">Total</th>
                        <th className="px-5 py-4">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasPorCategoria.map((c) => (
                        <tr key={c.categoria} className="border-b border-hairline last:border-0">
                          <td className="px-5 py-4 font-medium text-ink">{c.categoria}</td>
                          <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(c.total)}</td>
                          <td className="px-5 py-4 text-ink-secondary tabular-figures">
                            {totalDespesas > 0 ? `${((c.total / totalDespesas) * 100).toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Receitas por categoria</h2>
              {receitasPorCategoria.length === 0 ? (
                <EmptyState mensagem="Nenhuma receita no período selecionado." />
              ) : (
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-base">
                    <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                      <tr>
                        <th className="px-5 py-4">Categoria</th>
                        <th className="px-5 py-4">Total</th>
                        <th className="px-5 py-4">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receitasPorCategoria.map((c) => (
                        <tr key={c.categoria} className="border-b border-hairline last:border-0">
                          <td className="px-5 py-4 font-medium text-ink">{c.categoria}</td>
                          <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(c.total)}</td>
                          <td className="px-5 py-4 text-ink-secondary tabular-figures">
                            {totalReceitas > 0 ? `${((c.total / totalReceitas) * 100).toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          </section>

          {(maioresDespesas.length > 0 || maioresReceitas.length > 0) && (
            <section className="grid gap-8 lg:grid-cols-2">
              {maioresDespesas.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-ink">Maiores despesas do período</h2>
                  <Card className="overflow-x-auto p-0">
                    <table className="w-full text-base">
                      <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                        <tr>
                          <th className="px-5 py-4">Data</th>
                          <th className="px-5 py-4">Categoria</th>
                          <th className="px-5 py-4">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maioresDespesas.map((l) => (
                          <tr key={l.id} className="border-b border-hairline last:border-0">
                            <td className="px-5 py-4 text-ink-secondary">{formatarData(l.dataLancamento)}</td>
                            <td className="px-5 py-4 font-medium text-ink">{l.descricao ?? l.categoria}</td>
                            <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(l.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {maioresReceitas.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-ink">Maiores receitas do período</h2>
                  <Card className="overflow-x-auto p-0">
                    <table className="w-full text-base">
                      <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                        <tr>
                          <th className="px-5 py-4">Data</th>
                          <th className="px-5 py-4">Categoria</th>
                          <th className="px-5 py-4">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maioresReceitas.map((l) => (
                          <tr key={l.id} className="border-b border-hairline last:border-0">
                            <td className="px-5 py-4 text-ink-secondary">{formatarData(l.dataLancamento)}</td>
                            <td className="px-5 py-4 font-medium text-ink">{l.descricao ?? l.categoria}</td>
                            <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(l.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Lançamentos detalhados do período</h2>
              <Link href="/financeiro/lancamentos" className="text-sm text-ink-secondary hover:underline">
                Ver lançamentos ↗
              </Link>
            </div>
            {lancamentosOrdenados.length === 0 ? (
              <EmptyState mensagem="Nenhum lançamento no período selecionado." />
            ) : (
              <Card className="max-h-[28rem] overflow-y-auto overflow-x-auto p-0">
                <table className="w-full text-base">
                  <thead className="sticky top-0 border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                    <tr>
                      <th className="px-5 py-4">Data</th>
                      <th className="px-5 py-4">Tipo</th>
                      <th className="px-5 py-4">Categoria</th>
                      <th className="px-5 py-4">Descrição</th>
                      <th className="px-5 py-4">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentosOrdenados.map((l) => (
                      <tr key={l.id} className="border-b border-hairline last:border-0">
                        <td className="px-5 py-4 text-ink-secondary">{formatarData(l.dataLancamento)}</td>
                        <td className="px-5 py-4">
                          <Badge tone={l.tipo === "RECEITA" ? "success" : "danger"}>{l.tipo === "RECEITA" ? "Receita" : "Despesa"}</Badge>
                        </td>
                        <td className="px-5 py-4 text-ink-secondary">{l.categoria}</td>
                        <td className="px-5 py-4 font-medium text-ink">{l.descricao ?? "—"}</td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(l.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Parcelamentos em andamento</h2>
              <Link href="/financeiro/contas" className="text-sm text-ink-secondary hover:underline">
                Ver contas ↗
              </Link>
            </div>
            <p className="mb-3 text-sm text-ink-secondary">
              Independe do período acima — mostra o progresso de qualquer compra parcelada que ainda não terminou de ser paga/recebida.
            </p>
            {parcelamentos.length === 0 ? (
              <EmptyState mensagem="Nenhum parcelamento em andamento." />
            ) : (
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-base">
                  <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                    <tr>
                      <th className="px-5 py-4">Descrição</th>
                      <th className="px-5 py-4">Tipo</th>
                      <th className="px-5 py-4">Progresso</th>
                      <th className="px-5 py-4">Recebido/pago até agora</th>
                      <th className="px-5 py-4">Restante</th>
                      <th className="px-5 py-4">Próxima parcela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelamentos.map((g) => (
                      <tr key={g.grupoId} className="border-b border-hairline last:border-0">
                        <td className="px-5 py-4 font-medium text-ink">{g.descricao}</td>
                        <td className="px-5 py-4">
                          <Badge tone={g.tipo === "PAGAR" ? "danger" : "success"}>{g.tipo === "PAGAR" ? "A pagar" : "A receber"}</Badge>
                        </td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">
                          {g.pagas}/{g.parcelas.length}
                        </td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">
                          {formatarMoeda(g.valorPago)} de {formatarMoeda(g.valorTotal)}
                        </td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(g.valorRestante)}</td>
                        <td className="px-5 py-4 text-ink-secondary">
                          {g.proximaPendente ? formatarData(g.proximaPendente.vencimento) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Futuro — contas a vencer</h2>
              <Link href="/financeiro/contas" className="text-sm text-ink-secondary hover:underline">
                Ver contas ↗
              </Link>
            </div>
            {contasFuturas.length === 0 ? (
              <EmptyState mensagem="Nenhuma conta pendente com vencimento futuro." />
            ) : (
              <>
                <div className="mb-4 grid gap-5 sm:grid-cols-3">
                  <StatCard label="A pagar (futuro)" valor={formatarMoeda(totalFuturoPagar)} tone="danger" />
                  <StatCard label="A receber (futuro)" valor={formatarMoeda(totalFuturoReceber)} tone="success" />
                  <StatCard
                    label="Saldo projetado"
                    valor={formatarMoeda(totalFuturoReceber - totalFuturoPagar)}
                    tone={totalFuturoReceber - totalFuturoPagar >= 0 ? "success" : "danger"}
                  />
                </div>
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-base">
                    <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                      <tr>
                        <th className="px-5 py-4">Vencimento</th>
                        <th className="px-5 py-4">Tipo</th>
                        <th className="px-5 py-4">Descrição</th>
                        <th className="px-5 py-4">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasFuturas.map((c) => (
                        <tr key={c.id} className="border-b border-hairline last:border-0">
                          <td className="px-5 py-4 text-ink-secondary">{formatarData(c.vencimento)}</td>
                          <td className="px-5 py-4">
                            <Badge tone={c.tipo === "PAGAR" ? "danger" : "success"}>{c.tipo === "PAGAR" ? "A pagar" : "A receber"}</Badge>
                          </td>
                          <td className="px-5 py-4 font-medium text-ink">
                            {c.descricao}
                            {c.totalParcelas !== null && (
                              <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-sm font-normal text-ink-secondary">
                                {c.numeroParcela}/{c.totalParcelas}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(c.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
