"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import { VendaResponse } from "@/types/vendas";
import { Button, Card, ErrorBanner, PageHeader } from "@/components/ui";

export default function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [venda, setVenda] = useState<VendaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    api
      .get<VendaResponse>(`/vendas/${id}`)
      .then(setVenda)
      .catch((e) => setErro(e instanceof ApiError ? e.message : "Erro ao carregar venda"))
      .finally(() => setCarregando(false));
  }, [id]);

  async function excluir() {
    if (
      !confirm(
        "Excluir esta venda? A quantidade de cada item volta pro estoque e o lançamento financeiro " +
          "de receita gerado por ela é removido. Essa ação não pode ser desfeita."
      )
    )
      return;
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
        acao={
          <Button variant="danger" onClick={excluir} disabled={excluindo}>
            {excluindo ? "Excluindo..." : "Excluir venda"}
          </Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

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
    </main>
  );
}
