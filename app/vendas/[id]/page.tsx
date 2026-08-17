"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import { VendaResponse } from "@/types/vendas";
import { Card, ErrorBanner, PageHeader } from "@/components/ui";

export default function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [venda, setVenda] = useState<VendaResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    api
      .get<VendaResponse>(`/vendas/${id}`)
      .then(setVenda)
      .catch((e) => setErro(e instanceof ApiError ? e.message : "Erro ao carregar venda"))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-ink-secondary">Carregando...</main>;
  if (!venda)
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Venda não encontrada"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/vendas" className="text-sm text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo={`Venda #${venda.id}`}
        descricao={`${formatarDataHora(venda.dataVenda)} · ${venda.clienteNome ?? "Cliente não informado"}${venda.canal ? ` · ${venda.canal}` : ""}`}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-hairline bg-surface-hover text-left text-xs uppercase text-ink-secondary">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Preço unitário</th>
              <th className="px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item) => (
              <tr key={item.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{item.produtoNome}</td>
                <td className="px-4 py-3 text-ink-secondary">{item.quantidade}</td>
                <td className="px-4 py-3 text-ink-secondary">{formatarMoeda(item.precoUnitario)}</td>
                <td className="px-4 py-3 text-ink-secondary">{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline bg-surface-hover">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-ink-secondary">
                Total
              </td>
              <td className="px-4 py-3 font-semibold text-ink">{formatarMoeda(venda.valorTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </main>
  );
}
