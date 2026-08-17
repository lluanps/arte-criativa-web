"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";
import { ReceitaItemRequest, ReceitaRequest, ReceitaResponse } from "@/types/producao";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

interface LinhaItem {
  materiaPrimaId: number | "";
  quantidade: number;
}

const LINHA_VAZIA: LinhaItem = { materiaPrimaId: "", quantidade: 0 };

export default function FichasTecnicasPage() {
  const [receitas, setReceitas] = useState<ReceitaResponse[]>([]);
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [produtoId, setProdutoId] = useState<number | "">("");
  const [nome, setNome] = useState("");
  const [rendimento, setRendimento] = useState(1);
  const [itens, setItens] = useState<LinhaItem[]>([{ ...LINHA_VAZIA }]);
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [r, p, mp] = await Promise.all([
        api.get<ReceitaResponse[]>("/receitas"),
        api.get<ProdutoResponse[]>("/produtos"),
        api.get<MateriaPrimaResponse[]>("/materias-primas"),
      ]);
      setReceitas(r);
      setProdutos(p);
      setMateriasPrimas(mp);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar fichas técnicas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarLinha(index: number, patch: Partial<LinhaItem>) {
    setItens((atual) => atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha)));
  }

  function resetarForm() {
    setProdutoId("");
    setNome("");
    setRendimento(1);
    setItens([{ ...LINHA_VAZIA }]);
    setMostrarForm(false);
    setErrosCampos({});
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    const itensValidos: ReceitaItemRequest[] = itens
      .filter((l): l is { materiaPrimaId: number; quantidade: number } => l.materiaPrimaId !== "" && l.quantidade > 0)
      .map((l) => ({ materiaPrimaId: l.materiaPrimaId, quantidade: l.quantidade }));

    if (produtoId === "" || itensValidos.length === 0) {
      setErro("Selecione o produto e adicione ao menos um item com matéria-prima e quantidade válidas.");
      return;
    }

    const request: ReceitaRequest = { produtoId, nome, rendimento, itens: itensValidos };

    setSalvando(true);
    try {
      await api.post("/receitas", request);
      resetarForm();
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar ficha técnica");
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/receitas" className="text-sm text-ink-secondary hover:underline">
        ← Receitas / Produção
      </Link>
      <PageHeader
        titulo="Fichas técnicas"
        descricao="Quanto de cada matéria-prima é consumido pra produzir cada produto."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Nova ficha técnica"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="produtoId">Produto *</Label>
                <Select
                  id="produtoId"
                  required
                  value={produtoId}
                  onChange={(e) => setProdutoId(Number(e.target.value))}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </Select>
                {errosCampos.produtoId && <p className="mt-1 text-xs text-critical">{errosCampos.produtoId}</p>}
              </div>
              <div>
                <Label htmlFor="nome">Nome da ficha *</Label>
                <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                {errosCampos.nome && <p className="mt-1 text-xs text-critical">{errosCampos.nome}</p>}
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
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-ink-secondary">Matéria-prima</span>}
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
                    </div>
                    <div>
                      {index === 0 && <span className="mb-1 block text-xs text-ink-secondary">Quantidade</span>}
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={linha.quantidade}
                        onChange={(e) => atualizarLinha(index, { quantidade: Number(e.target.value) })}
                      />
                    </div>
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
              <Button type="button" variant="secondary" className="mt-2" onClick={() => setItens((a) => [...a, { ...LINHA_VAZIA }])}>
                + Adicionar item
              </Button>
            </div>

            <div>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar ficha técnica"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-sm text-ink-secondary">Carregando...</p>
      ) : receitas.length === 0 ? (
        <EmptyState mensagem="Nenhuma ficha técnica cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-hairline bg-surface-hover text-left text-xs uppercase text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Rendimento</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((r) => (
                <tr key={r.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    <Link href={`/receitas/fichas/${r.id}`} className="hover:underline">
                      {r.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{r.produtoNome}</td>
                  <td className="px-4 py-3 text-ink-secondary">{r.rendimento}</td>
                  <td className="px-4 py-3 text-ink-secondary">{r.itens.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/receitas/fichas/${r.id}`} className="text-ink-secondary hover:underline">
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
