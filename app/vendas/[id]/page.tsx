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

  if (carregando) return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-neutral-500 dark:text-neutral-400">Carregando...</main>;
  if (!venda)
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Venda não encontrada"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/vendas" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo={`Venda #${venda.id}`}
        descricao={`${formatarDataHora(venda.dataVenda)} · ${venda.clienteNome ?? "Cliente não informado"}${venda.canal ? ` · ${venda.canal}` : ""}`}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Preço unitário</th>
              <th className="px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{item.produtoNome}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{item.quantidade}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatarMoeda(item.precoUnitario)}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Total
              </td>
              <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{formatarMoeda(venda.valorTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </main>
  );
}
