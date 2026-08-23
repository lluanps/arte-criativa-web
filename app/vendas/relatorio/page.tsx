"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda, parseDataLocal } from "@/lib/format";
import { VendaResponse } from "@/types/vendas";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";

interface LinhaRelatorio {
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  totalVendido: number;
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

/** Gera e baixa um CSV a partir das linhas do relatório — tudo no navegador, sem API. */
function exportarCsv(linhas: LinhaRelatorio[], inicio: string, fim: string) {
  const cabecalho = "Produto;Quantidade vendida;Total vendido (R$)";
  const corpo = linhas.map((l) => `${l.produtoNome};${l.quantidade};${l.totalVendido.toFixed(2).replace(".", ",")}`);
  // BOM no início pra acentuação abrir certa no Excel do Windows.
  const conteudo = "﻿" + [cabecalho, ...corpo].join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `produtos-mais-vendidos_${inicio}_a_${fim}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Gera e baixa um PDF do mesmo relatório — também tudo no navegador, sem API. jsPDF e
 * jspdf-autotable só são carregados quando o botão é clicado (import dinâmico), pra não
 * pesar no bundle de nenhuma outra tela do app.
 */
async function exportarPdf(linhas: LinhaRelatorio[], inicio: string, fim: string, totalGeral: number) {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Arte Criativa", 14, 17);
  doc.setFontSize(12);
  doc.text("Produtos mais vendidos", 14, 25);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Período: ${formatarData(inicio)} até ${formatarData(fim)}`, 14, 31);

  autoTable(doc, {
    startY: 37,
    head: [["#", "Produto", "Qtd. vendida", "Total vendido", "% do período"]],
    body: linhas.map((l, i) => [
      String(i + 1),
      l.produtoNome,
      String(l.quantidade),
      formatarMoeda(l.totalVendido),
      totalGeral > 0 ? `${((l.totalVendido / totalGeral) * 100).toFixed(1)}%` : "—",
    ]),
    foot: [["", "Total", "", formatarMoeda(totalGeral), ""]],
    headStyles: { fillColor: [90, 74, 58] },
    footStyles: { fillColor: [237, 231, 222], textColor: [40, 35, 30], fontStyle: "bold" },
  });

  doc.save(`produtos-mais-vendidos_${inicio}_a_${fim}.pdf`);
}

export default function RelatorioVendasPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(dataLocalISO());
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setVendas(await api.get<VendaResponse[]>("/vendas"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar vendas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const vendasNoPeriodo = useMemo(() => {
    const dataInicio = parseDataLocal(inicio);
    const dataFim = parseDataLocal(fim);
    dataFim.setHours(23, 59, 59, 999);
    return vendas.filter((v) => {
      const data = new Date(v.dataVenda);
      return data >= dataInicio && data <= dataFim;
    });
  }, [vendas, inicio, fim]);

  const linhas = useMemo(() => {
    const porProduto = new Map<number, LinhaRelatorio>();
    for (const venda of vendasNoPeriodo) {
      for (const item of venda.itens) {
        const atual = porProduto.get(item.produtoId) ?? {
          produtoId: item.produtoId,
          produtoNome: item.produtoNome,
          quantidade: 0,
          totalVendido: 0,
        };
        atual.quantidade += item.quantidade;
        atual.totalVendido += item.subtotal;
        porProduto.set(item.produtoId, atual);
      }
    }
    return [...porProduto.values()].sort((a, b) => b.totalVendido - a.totalVendido);
  }, [vendasNoPeriodo]);

  const totalGeral = linhas.reduce((soma, l) => soma + l.totalVendido, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/vendas" className="text-base text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo="Produtos mais vendidos"
        descricao="Ranking por valor vendido no período — útil pra decidir o que produzir mais."
        acao={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => exportarCsv(linhas, inicio, fim)} disabled={linhas.length === 0}>
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              disabled={linhas.length === 0 || gerandoPdf}
              onClick={async () => {
                setGerandoPdf(true);
                try {
                  await exportarPdf(linhas, inicio, fim, totalGeral);
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
          onSubmit={(e) => e.preventDefault()}
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
        </form>
      </Card>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : linhas.length === 0 ? (
        <EmptyState mensagem="Nenhuma venda no período selecionado." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4">Qtd. vendida</th>
                <th className="px-5 py-4">Total vendido</th>
                <th className="px-5 py-4">% do período</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, index) => (
                <tr key={linha.produtoId} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-faint tabular-figures">{index + 1}</td>
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/estoque/produtos/${linha.produtoId}`} className="hover:underline">
                      {linha.produtoNome}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary tabular-figures">{linha.quantidade}</td>
                  <td className="px-5 py-4 font-medium text-ink tabular-figures">{formatarMoeda(linha.totalVendido)}</td>
                  <td className="px-5 py-4 text-ink-secondary tabular-figures">
                    {totalGeral > 0 ? `${((linha.totalVendido / totalGeral) * 100).toFixed(1)}%` : "—"}
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
