"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarDataHora, formatarMoeda } from "@/lib/format";
import { ReagendarEntregaRequest, VendaResponse } from "@/types/vendas";
import { corDoStatusVenda, labelDoStatusVenda, proximoStatusVenda } from "@/lib/statusVenda";
import { Badge, Button, Card, ErrorBanner, Input, Label, PageHeader } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

export default function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [venda, setVenda] = useState<VendaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [avancando, setAvancando] = useState(false);
  const [novaDataEntrega, setNovaDataEntrega] = useState("");
  const [reagendando, setReagendando] = useState(false);

  async function carregarVenda() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.get<VendaResponse>(`/vendas/${id}`);
      setVenda(dados);
      setNovaDataEntrega(dados.dataEntregaPrevista ?? "");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar venda");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const proximoStatus = venda ? proximoStatusVenda(venda.status) : null;

  async function avancarStatus() {
    if (!venda) return;
    if (venda.valorSaldo > 0 && proximoStatus === "ENTREGUE") {
      const confirmacao = await perguntar({
        titulo: `Avançar pra "${labelDoStatusVenda({ status: "ENTREGUE", entregaAtrasada: false })}"?`,
        descricao: `Isso vai gerar um lançamento financeiro do saldo pendente (${formatarMoeda(venda.valorSaldo)}).`,
        acoes: [
          { id: "cancelar", label: "Cancelar", variant: "secondary" },
          { id: "avancar", label: "Avançar", variant: "primary" },
        ],
      });
      if (confirmacao !== "avancar") return;
    }

    setAvancando(true);
    setErro(null);
    try {
      const atualizada = await api.post<VendaResponse>(`/vendas/${id}/avancar-status`, {});
      setVenda(atualizada);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao avançar status");
    } finally {
      setAvancando(false);
    }
  }

  async function reagendarEntrega(e: React.FormEvent) {
    e.preventDefault();
    if (!novaDataEntrega) return;

    setReagendando(true);
    setErro(null);
    try {
      const request: ReagendarEntregaRequest = { novaDataEntrega };
      const atualizada = await api.post<VendaResponse>(`/vendas/${id}/reagendar-entrega`, request);
      setVenda(atualizada);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao reagendar entrega");
    } finally {
      setReagendando(false);
    }
  }

  async function excluir() {
    const confirmacao = await perguntar({
      titulo: "Excluir esta venda?",
      descricao:
        "A quantidade de cada item volta pro estoque e o(s) lançamento(s) financeiro(s) de receita gerado(s) por ela " +
        "(sinal e/ou saldo) são removidos. Essa ação não pode ser desfeita.",
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
      await api.del(`/vendas/${id}`);
      router.push("/vendas");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir venda");
      setExcluindo(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-5xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (!venda)
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Venda não encontrada"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/vendas" className="text-base text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo={`Venda #${venda.id}`}
        descricao={`${formatarDataHora(venda.dataVenda)} · ${venda.clienteNome ?? "Cliente não informado"}${venda.canalNome ? ` · ${venda.canalNome}` : ""}`}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {venda.dataEntregaPrevista && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Encomenda</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone={corDoStatusVenda(venda)}>{labelDoStatusVenda(venda)}</Badge>
                <span className="text-base text-ink-secondary">
                  entrega combinada pra {formatarData(venda.dataEntregaPrevista)}
                </span>
              </div>
              <p className="mt-2 text-base text-ink-secondary">
                Sinal recebido: <strong className="text-ink">{formatarMoeda(venda.valorSinal)}</strong> · Saldo a
                receber:{" "}
                <strong className={venda.valorSaldo > 0 ? "text-warning" : "text-good"}>
                  {formatarMoeda(venda.valorSaldo)}
                </strong>
              </p>
            </div>
            {proximoStatus && (
              <Button onClick={avancarStatus} disabled={avancando}>
                {avancando
                  ? "Avançando..."
                  : `Avançar para ${labelDoStatusVenda({ status: proximoStatus, entregaAtrasada: false })}`}
              </Button>
            )}
          </div>

          {proximoStatus && (
            <form onSubmit={reagendarEntrega} className="mt-5 flex flex-wrap items-end gap-3 border-t border-hairline pt-4">
              <div>
                <Label htmlFor="novaDataEntrega">Reagendar entrega</Label>
                <Input
                  id="novaDataEntrega"
                  type="date"
                  min={dataLocalISO()}
                  value={novaDataEntrega}
                  onChange={(e) => setNovaDataEntrega(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={reagendando || !novaDataEntrega}>
                {reagendando ? "Salvando..." : "Salvar nova data"}
              </Button>
            </form>
          )}
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-base">
          <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
            <tr>
              <th className="px-5 py-4">Produto</th>
              <th className="px-5 py-4">Quantidade</th>
              <th className="px-5 py-4">Preço unitário</th>
              <th className="px-5 py-4">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item) => (
              <tr key={item.id} className="border-b border-hairline last:border-0">
                <td className="px-5 py-4 font-medium text-ink">{item.produtoNome}</td>
                <td className="px-5 py-4 text-ink-secondary">{item.quantidade}</td>
                <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(item.precoUnitario)}</td>
                <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline bg-surface-hover">
              <td colSpan={3} className="px-5 py-4 text-right font-semibold text-ink-secondary">
                Total
              </td>
              <td className="px-5 py-4 text-lg font-semibold text-ink">{formatarMoeda(venda.valorTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="mt-6 flex justify-end border-t border-hairline pt-4">
        <Button variant="danger" onClick={excluir} disabled={excluindo}>
          {excluindo ? "Excluindo..." : "Excluir venda"}
        </Button>
      </div>
    </main>
  );
}
