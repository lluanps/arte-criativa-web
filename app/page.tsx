"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { buscarItensEstoqueBaixo, ItemEstoqueBaixo } from "@/lib/estoque";
import { dataLocalISO, formatarData, formatarMoeda, parseDataLocal } from "@/lib/format";
import { buscarEncomendasEmAtencao, ItemEncomendaAtencao } from "@/lib/vendas";
import { corDoStatusVenda, labelDoStatusVenda } from "@/lib/statusVenda";
import { ContaResponse, DashboardFinanceiroResponse, StatusConta } from "@/types/financeiro";
import { VendaResponse } from "@/types/vendas";
import { Badge, Card, EmptyState, ErrorBanner, StatCard } from "@/components/ui";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBag,
  IconBook,
  IconBox,
  IconClipboard,
  IconSparkles,
  IconWallet,
} from "@/components/Icon";

const modulos = [
  { nome: "Estoque", href: "/estoque", descricao: "Produtos, matérias-primas e movimentações", Icon: IconBox },
  { nome: "Receitas", href: "/receitas", descricao: "Fichas técnicas e registro de produção", Icon: IconClipboard },
  { nome: "Vendas", href: "/vendas", descricao: "Pedidos e vendas realizadas", Icon: IconBag },
  { nome: "Financeiro", href: "/financeiro", descricao: "Lançamentos, contas a pagar e a receber", Icon: IconWallet },
  { nome: "Tutoriais", href: "/tutoriais", descricao: "Passo a passo de produção", Icon: IconBook },
  { nome: "Ideias", href: "/ideias", descricao: "Caderno de inspiração e anotações", Icon: IconSparkles },
];

const DIAS_PARA_AVISAR_VENCIMENTO = 7;

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

/** Dias entre hoje e `vencimento` (negativo = já passou). */
function diasAteVencimento(vencimento: string): number {
  const umDiaMs = 24 * 60 * 60 * 1000;
  return Math.round((parseDataLocal(vencimento).getTime() - parseDataLocal(dataLocalISO()).getTime()) / umDiaMs);
}

interface ContaAtencao extends ContaResponse {
  diasAteVencimento: number;
}

const CORES_STATUS_CONTA: Record<StatusConta, "default" | "success" | "danger" | "warning"> = {
  PENDENTE: "warning",
  PAGO: "success",
  ATRASADO: "danger",
};

function rotuloUrgencia(conta: ContaAtencao): string {
  if (conta.status === "ATRASADO") return "Atrasada";
  if (conta.diasAteVencimento === 0) return "Vence hoje";
  if (conta.diasAteVencimento === 1) return "Vence amanhã";
  return `Vence em ${conta.diasAteVencimento} dias`;
}

export default function Home() {
  const [dashboardFinanceiro, setDashboardFinanceiro] = useState<DashboardFinanceiroResponse | null>(null);
  const [contasAtencao, setContasAtencao] = useState<ContaAtencao[]>([]);
  const [vendasDoMes, setVendasDoMes] = useState<VendaResponse[]>([]);
  const [itensEstoqueBaixo, setItensEstoqueBaixo] = useState<ItemEstoqueBaixo[]>([]);
  const [encomendasAtencao, setEncomendasAtencao] = useState<ItemEncomendaAtencao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const inicioMes = primeiroDiaDoMes();
        const hoje = dataLocalISO();
        const [dashboard, contas, vendas, estoqueBaixo, encomendasEmAtencao] = await Promise.all([
          api.get<DashboardFinanceiroResponse>(`/financeiro/dashboard?inicio=${inicioMes}&fim=${hoje}`),
          api.get<ContaResponse[]>("/contas"),
          api.get<VendaResponse[]>("/vendas"),
          buscarItensEstoqueBaixo(),
          buscarEncomendasEmAtencao(),
        ]);

        setDashboardFinanceiro(dashboard);

        const atencao = contas
          .filter((c) => c.status === "ATRASADO" || (c.status === "PENDENTE" && diasAteVencimento(c.vencimento) <= DIAS_PARA_AVISAR_VENCIMENTO))
          .map((c) => ({ ...c, diasAteVencimento: diasAteVencimento(c.vencimento) }))
          .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento);
        setContasAtencao(atencao);

        const inicioMesDate = parseDataLocal(inicioMes);
        setVendasDoMes(vendas.filter((v) => new Date(v.dataVenda) >= inicioMesDate));

        setItensEstoqueBaixo(estoqueBaixo);
        setEncomendasAtencao(encomendasEmAtencao);
      } catch (e) {
        setErro(e instanceof ApiError ? e.message : "Erro ao carregar o resumo");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const totalVendidoNoMes = vendasDoMes.reduce((soma, v) => soma + v.valorTotal, 0);
  const contasAtrasadas = contasAtencao.filter((c) => c.status === "ATRASADO");
  const entregasAtrasadas = encomendasAtencao.filter((e) => e.entregaAtrasada);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-ink">Arte Criativa</h1>
      <p className="mt-2 text-ink-secondary">Sistema de gestão para vendas de produtos artesanais.</p>

      {erro && (
        <div className="mt-8">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.nome}
            href={modulo.href}
            className="flex items-start gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-sm transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good">
              <modulo.Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{modulo.nome}</h2>
              <p className="mt-1 text-base text-ink-secondary">{modulo.descricao}</p>
            </div>
          </Link>
        ))}
      </div>

      {carregando && !dashboardFinanceiro ? (
        <p className="mt-10 text-base text-ink-secondary">Carregando resumo...</p>
      ) : dashboardFinanceiro ? (
        <div className="mt-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Saldo no mês"
              valor={formatarMoeda(dashboardFinanceiro.saldo)}
              tone={dashboardFinanceiro.saldo >= 0 ? "success" : "danger"}
            />
            <StatCard label="Vendido no mês" valor={formatarMoeda(totalVendidoNoMes)} />
            <StatCard
              label="Contas atrasadas"
              valor={String(contasAtrasadas.length)}
              tone={contasAtrasadas.length > 0 ? "danger" : "default"}
            />
            <StatCard
              label="Estoque baixo"
              valor={String(itensEstoqueBaixo.length)}
              tone={itensEstoqueBaixo.length > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Entregas atrasadas"
              valor={String(entregasAtrasadas.length)}
              tone={entregasAtrasadas.length > 0 ? "danger" : "default"}
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Contas que precisam de atenção</h2>
                <Link
                  href="/financeiro/contas"
                  className="flex items-center gap-1 text-sm text-ink-secondary hover:underline"
                >
                  Ver todas <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {contasAtencao.length === 0 ? (
                <EmptyState mensagem="Nenhuma conta atrasada ou vencendo nos próximos 7 dias." />
              ) : (
                <ul>
                  {contasAtencao.slice(0, 5).map((conta) => (
                    <li key={conta.id} className="flex items-center justify-between gap-3 border-t border-hairline py-2.5 first:border-0 first:pt-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{conta.descricao}</p>
                        <p className="text-sm text-ink-secondary">
                          {conta.tipo === "PAGAR" ? "A pagar" : "A receber"} · {formatarMoeda(conta.valor)} · vence em{" "}
                          {formatarData(conta.vencimento)}
                        </p>
                      </div>
                      <Badge tone={CORES_STATUS_CONTA[conta.status]}>{rotuloUrgencia(conta)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Estoque baixo</h2>
                <Link href="/estoque" className="flex items-center gap-1 text-sm text-ink-secondary hover:underline">
                  Ver estoque <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {itensEstoqueBaixo.length === 0 ? (
                <EmptyState mensagem="Nenhum produto ou matéria-prima abaixo do mínimo." />
              ) : (
                <ul>
                  {itensEstoqueBaixo.slice(0, 5).map((item) => (
                    <li key={item.chave} className="flex items-center justify-between gap-3 border-t border-hairline py-2.5 first:border-0 first:pt-0">
                      <div className="min-w-0">
                        <Link href={item.href} className="block truncate font-medium text-ink hover:underline">
                          {item.nome}
                        </Link>
                        <p className="text-sm text-ink-secondary">
                          {item.estoqueAtual} {item.unidade} · mínimo {item.estoqueMinimo} {item.unidade}
                        </p>
                      </div>
                      <IconAlertTriangle className="h-4 w-4 shrink-0 text-warning" strokeWidth={2.2} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Encomendas</h2>
                <Link href="/vendas/encomendas" className="flex items-center gap-1 text-sm text-ink-secondary hover:underline">
                  Ver todas <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {encomendasAtencao.length === 0 ? (
                <EmptyState mensagem="Nenhuma encomenda atrasada ou com entrega nos próximos dias." />
              ) : (
                <ul>
                  {encomendasAtencao.slice(0, 5).map((item) => (
                    <li key={item.chave} className="flex items-center justify-between gap-3 border-t border-hairline py-2.5 first:border-0 first:pt-0">
                      <div className="min-w-0">
                        <Link href={item.href} className="block truncate font-medium text-ink hover:underline">
                          {item.clienteNome ?? `Venda #${item.id}`}
                        </Link>
                        <p className="text-sm text-ink-secondary">
                          {formatarMoeda(item.valorSaldo)} de saldo · entrega em {formatarData(item.dataEntregaPrevista)}
                        </p>
                      </div>
                      <Badge tone={corDoStatusVenda(item)}>{labelDoStatusVenda(item)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}
