"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import { ProdutoResponse } from "@/types/estoque";
import { ProducaoRequest, ProducaoResponse } from "@/types/producao";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

export default function ProducoesPage() {
  const [producoes, setProducoes] = useState<ProducaoResponse[]>([]);
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [produtoId, setProdutoId] = useState<number | "">("");
  const [quantidadeProduzida, setQuantidadeProduzida] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [prod, dadosProdutos] = await Promise.all([
        api.get<ProducaoResponse[]>("/producoes"),
        api.get<ProdutoResponse[]>("/produtos"),
      ]);
      setProducoes(prod.sort((a, b) => (a.dataProducao < b.dataProducao ? 1 : -1)));
      setProdutos(dadosProdutos);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar produções");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function resetarForm() {
    setProdutoId("");
    setQuantidadeProduzida(0);
    setObservacao("");
    setMostrarForm(false);
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (produtoId === "" || quantidadeProduzida <= 0) {
      setErro("Selecione o produto e informe uma quantidade produzida maior que zero.");
      return;
    }

    const request: ProducaoRequest = { produtoId, quantidadeProduzida, observacao: observacao || null };

    setSalvando(true);
    try {
      await api.post("/producoes", request);
      resetarForm();
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao registrar produção");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/receitas" className="text-base text-ink-secondary hover:underline">
        ← Receitas / Produção
      </Link>
      <PageHeader
        titulo="Produção"
        descricao="Registrar produção dá baixa na matéria-prima (conforme a ficha técnica) e entrada no estoque do produto."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Registrar produção"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={registrar} className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="produtoId">Produto *</Label>
              <Select id="produtoId" required value={produtoId} onChange={(e) => setProdutoId(Number(e.target.value))}>
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidadeProduzida">Quantidade produzida *</Label>
              <Input
                id="quantidadeProduzida"
                type="number"
                step="0.001"
                min="0"
                required
                value={quantidadeProduzida}
                onChange={(e) => setQuantidadeProduzida(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="observacao">Observação</Label>
              <Input id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Registrando..." : "Registrar produção"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : producoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma produção registrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4">Quantidade</th>
                <th className="px-5 py-4">Custo total</th>
                <th className="px-5 py-4">Observação</th>
              </tr>
            </thead>
            <tbody>
              {producoes.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarDataHora(p.dataProducao)}</td>
                  <td className="px-5 py-4 font-medium text-ink">{p.produtoNome}</td>
                  <td className="px-5 py-4 text-ink-secondary">{p.quantidadeProduzida}</td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(p.custoTotal)}</td>
                  <td className="px-5 py-4 text-ink-secondary">{p.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
