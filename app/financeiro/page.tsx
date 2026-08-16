"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { DashboardFinanceiroResponse } from "@/types/financeiro";
import { Button, Card, ErrorBanner, Input, Label, LinkButton, PageHeader, StatCard } from "@/components/ui";

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

export default function FinanceiroDashboardPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(dataLocalISO());
  const [dashboard, setDashboard] = useState<DashboardFinanceiroResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.get<DashboardFinanceiroResponse>(
        `/financeiro/dashboard?inicio=${inicio}&fim=${fim}`
      );
      setDashboard(dados);
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
    <main className="mx-auto max-w-4xl px-6 py-10">
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
          className="flex flex-wrap items-end gap-4"
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

      {carregando || !dashboard ? (
        <p className="text-sm text-neutral-500">Carregando...</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-neutral-500">
            Período: {formatarData(dashboard.periodoInicio)} até {formatarData(dashboard.periodoFim)}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
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
        </>
      )}
    </main>
  );
}
