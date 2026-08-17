"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { agruparDespesasPorCategoria, agruparFluxoCaixa } from "@/lib/charts";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { DashboardFinanceiroResponse, LancamentoFinanceiroResponse } from "@/types/financeiro";
import { Button, Card, ErrorBanner, Input, Label, LinkButton, PageHeader, StatCard } from "@/components/ui";
import { DespesasPorCategoriaChart } from "@/components/charts/DespesasPorCategoriaChart";
import { FluxoCaixaChart } from "@/components/charts/FluxoCaixaChart";

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

export default function FinanceiroDashboardPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(dataLocalISO());
  const [dashboard, setDashboard] = useState<DashboardFinanceiroResponse | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiroResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [dados, dadosLancamentos] = await Promise.all([
        api.get<DashboardFinanceiroResponse>(`/financeiro/dashboard?inicio=${inicio}&fim=${fim}`),
        api.get<LancamentoFinanceiroResponse[]>(`/lancamentos-financeiros?inicio=${inicio}&fim=${fim}`),
      ]);
      setDashboard(dados);
      setLancamentos(dadosLancamentos);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar dashboard");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Financeiro"
        descricao="Fluxo de caixa, lançamentos e contas a pagar/receber."
        acao={
          <div className="flex gap-2">
            <LinkButton href="/financeiro/lancamentos" variant="secondary">
              Lançamentos
            </LinkButton>
            <LinkButton href="/financeiro/contas" variant="secondary">
              Contas
            </LinkButton>
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

      {!dashboard && carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : dashboard ? (
        // Refetch (troca de período) segura o render anterior em opacidade reduzida
        // em vez de desmontar tudo — sem flash de "Carregando...", sem pulo de layout.
        <div className={carregando ? "opacity-50 transition-opacity" : "transition-opacity"}>
          <p className="mb-3 text-base text-ink-secondary">
            Período: {formatarData(dashboard.periodoInicio)} até {formatarData(dashboard.periodoFim)}
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <StatCard label="Receitas no período" valor={formatarMoeda(dashboard.totalReceitas)} tone="success" />
            <StatCard label="Despesas no período" valor={formatarMoeda(dashboard.totalDespesas)} tone="danger" />
            <StatCard
              label="Saldo no período"
              valor={formatarMoeda(dashboard.saldo)}
              tone={dashboard.saldo >= 0 ? "success" : "danger"}
            />
            <StatCard label="Contas a pagar (pendentes)" valor={formatarMoeda(dashboard.totalContasPagarPendentes)} tone="warning" />
            <StatCard label="Contas a receber (pendentes)" valor={formatarMoeda(dashboard.totalContasReceberPendentes)} />
            <StatCard
              label="Contas atrasadas"
              valor={String(dashboard.contasAtrasadas)}
              tone={dashboard.contasAtrasadas > 0 ? "danger" : "default"}
            />
          </div>

          <div className="mt-6 grid gap-8">
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Fluxo de caixa no período</h2>
                <Link href="/financeiro/lancamentos" className="text-sm text-ink-secondary hover:underline">
                  Ver lançamentos ↗
                </Link>
              </div>
              <FluxoCaixaChart pontos={agruparFluxoCaixa(lancamentos, dashboard.periodoInicio, dashboard.periodoFim)} />
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Despesas por categoria</h2>
                <Link href="/financeiro/lancamentos" className="text-sm text-ink-secondary hover:underline">
                  Ver lançamentos ↗
                </Link>
              </div>
              <DespesasPorCategoriaChart fatias={agruparDespesasPorCategoria(lancamentos)} />
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}
