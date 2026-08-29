"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { buscarEncomendas } from "@/lib/vendas";
import { formatarData, formatarMoeda, parseDataLocal } from "@/lib/format";
import { corDoStatusVenda, labelDoStatusVenda } from "@/lib/statusVenda";
import { VendaResponse } from "@/types/vendas";
import { Badge, Card, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

/**
 * "Agenda" de encomendas — lista simples ordenada por data de entrega, não uma grade de
 * calendário: não existe componente de calendário no projeto, o volume esperado é
 * baixo, e o padrão dominante pra "coisas com prazo" (Contas atrasadas, Estoque baixo)
 * já é lista + badge de urgência, não grade visual.
 */
export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState<VendaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [somenteEmAberto, setSomenteEmAberto] = useState(true);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        setEncomendas(await buscarEncomendas());
      } catch (e) {
        setErro(e instanceof ApiError ? e.message : "Erro ao carregar encomendas");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const listadas = useMemo(() => {
    const filtradas = somenteEmAberto ? encomendas.filter((v) => v.status !== "ENTREGUE") : encomendas;
    return [...filtradas].sort(
      (a, b) => parseDataLocal(a.dataEntregaPrevista as string).getTime() - parseDataLocal(b.dataEntregaPrevista as string).getTime()
    );
  }, [encomendas, somenteEmAberto]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/vendas" className="text-base text-ink-secondary hover:underline">
        ← Vendas
      </Link>
      <PageHeader
        titulo="Encomendas"
        descricao="Pedidos com data de entrega combinada, por ordem de prazo."
        acao={
          <div className="flex overflow-hidden rounded-lg border border-hairline text-sm font-semibold">
            <button
              onClick={() => setSomenteEmAberto(true)}
              className={`px-4 py-2 transition-colors ${somenteEmAberto ? "bg-accent text-accent-ink" : "text-ink-secondary hover:bg-surface-hover"}`}
            >
              Em aberto
            </button>
            <button
              onClick={() => setSomenteEmAberto(false)}
              className={`px-4 py-2 transition-colors ${!somenteEmAberto ? "bg-accent text-accent-ink" : "text-ink-secondary hover:bg-surface-hover"}`}
            >
              Todas
            </button>
          </div>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : listadas.length === 0 ? (
        <EmptyState
          mensagem={
            somenteEmAberto ? "Nenhuma encomenda em aberto no momento." : "Nenhuma encomenda registrada ainda."
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Data de entrega</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Sinal</th>
                <th className="px-5 py-4">Saldo</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {listadas.map((venda) => (
                <tr key={venda.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">{venda.clienteNome ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarData(venda.dataEntregaPrevista as string)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={corDoStatusVenda(venda)}>{labelDoStatusVenda(venda)}</Badge>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{formatarMoeda(venda.valorTotal)}</td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(venda.valorSinal)}</td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(venda.valorSaldo)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/vendas/${venda.id}`} className="text-ink-secondary hover:underline">
                      Ver
                    </Link>
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
