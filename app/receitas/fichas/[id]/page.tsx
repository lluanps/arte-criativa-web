"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";
import { ReceitaItemRequest, ReceitaRequest, ReceitaResponse } from "@/types/producao";
import { Button, Card, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

interface LinhaItem {
  materiaPrimaId: number | "";
  quantidade: number;
}

export default function FichaTecnicaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [produtoId, setProdutoId] = useState<number | "">("");
  const [nome, setNome] = useState("");
  const [rendimento, setRendimento] = useState(1);
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [receita, p, mp] = await Promise.all([
        api.get<ReceitaResponse>(`/receitas/${id}`),
        api.get<ProdutoResponse[]>("/produtos"),
        api.get<MateriaPrimaResponse[]>("/materias-primas"),
      ]);
      setProdutos(p);
      setMateriasPrimas(mp);
      setProdutoId(receita.produtoId);
      setNome(receita.nome);
      setRendimento(receita.rendimento);
      setItens(receita.itens.map((i) => ({ materiaPrimaId: i.materiaPrimaId, quantidade: i.quantidade })));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar ficha técnica");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function atualizarLinha(index: number, patch: Partial<LinhaItem>) {
    setItens((atual) => atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha)));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    const itensValidos: ReceitaItemRequest[] = itens
      .filter((l): l is { materiaPrimaId: number; quantidade: number } => l.materiaPrimaId !== "" && l.quantidade > 0)
      .map((l) => ({ materiaPrimaId: l.materiaPrimaId, quantidade: l.quantidade }));

    if (produtoId === "" || itensValidos.length === 0) {
      setErro("Selecione o produto e mantenha ao menos um item válido.");
      return;
    }

    const request: ReceitaRequest = { produtoId, nome, rendimento, itens: itensValidos };

    setSalvando(true);
    try {
      await api.put(`/receitas/${id}`, request);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao salvar ficha técnica");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir essa ficha técnica? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    setErro(null);
    try {
      await api.del(`/receitas/${id}`);
      router.push("/receitas/fichas");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir ficha técnica");
      setExcluindo(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-5xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/receitas/fichas" className="text-base text-ink-secondary hover:underline">
        ← Fichas técnicas
      </Link>
      <PageHeader titulo={nome || "Ficha técnica"} />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card>
        <form onSubmit={salvar} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
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
              {errosCampos.produtoId && <p className="mt-1 text-sm text-critical">{errosCampos.produtoId}</p>}
            </div>
            <div>
              <Label htmlFor="nome">Nome da ficha *</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
              {errosCampos.nome && <p className="mt-1 text-sm text-critical">{errosCampos.nome}</p>}
            </div>
            <div>
              <Label htmlFor="rendimento">Rendimento (un.)</Label>
              <Input
                id="rendimento"
                type="number"
                step="0.001"
                min="0"
                value={rendimento}
                onChange={(e) => setRendimento(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>Matérias-primas *</Label>
            <div className="grid gap-2">
              {itens.map((linha, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_auto] items-end gap-2">
                  <Select
                    value={linha.materiaPrimaId}
                    onChange={(e) => atualizarLinha(index, { materiaPrimaId: Number(e.target.value) })}
                  >
                    <option value="">Selecione...</option>
                    {materiasPrimas.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.nome} ({mp.unidadeMedida})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={linha.quantidade}
                    onChange={(e) => atualizarLinha(index, { quantidade: Number(e.target.value) })}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setItens((atual) => atual.filter((_, i) => i !== index))}
                    disabled={itens.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={() => setItens((a) => [...a, { materiaPrimaId: "", quantidade: 0 }])}
            >
              + Adicionar item
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir ficha técnica"}
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
