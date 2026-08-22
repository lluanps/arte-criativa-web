"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarMoeda } from "@/lib/format";
import { MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";
import { ReceitaItemRequest, ReceitaRequest, ReceitaResponse } from "@/types/producao";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

/**
 * Faixas de saúde de margem pra artesanato: abaixo de 15% mal cobre imprevisto,
 * 15-40% é sustentável mas apertado, acima de 40% é saudável pro tipo de negócio.
 */
function tomDaMargem(percentual: number | null): "default" | "success" | "warning" | "danger" {
  if (percentual === null) return "default";
  if (percentual < 15) return "danger";
  if (percentual < 40) return "warning";
  return "success";
}

interface LinhaItem {
  materiaPrimaId: number | "";
  quantidade: number;
  /** "" = usa a mesma unidade cadastrada na matéria-prima (sem conversão). */
  unidadeMedida: string;
}

const LINHA_VAZIA: LinhaItem = { materiaPrimaId: "", quantidade: 0, unidadeMedida: "" };

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
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(0);
  const [custoEmbalagemOutros, setCustoEmbalagemOutros] = useState(0);
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
    setCustoMaoDeObra(0);
    setCustoEmbalagemOutros(0);
    setMostrarForm(false);
    setErrosCampos({});
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    const itensValidos: ReceitaItemRequest[] = itens
      .filter((l): l is LinhaItem & { materiaPrimaId: number } => l.materiaPrimaId !== "" && l.quantidade > 0)
      .map((l) => ({
        materiaPrimaId: l.materiaPrimaId,
        quantidade: l.quantidade,
        unidadeMedida: l.unidadeMedida.trim() === "" ? undefined : l.unidadeMedida.trim(),
      }));

    if (produtoId === "" || itensValidos.length === 0) {
      setErro("Selecione o produto e adicione ao menos um item com matéria-prima e quantidade válidas.");
      return;
    }

    const request: ReceitaRequest = { produtoId, nome, rendimento, itens: itensValidos, custoMaoDeObra, custoEmbalagemOutros };

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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/receitas" className="text-base text-ink-secondary hover:underline">
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
          <form onSubmit={criar} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-3">
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
                  step="1"
                  min="0"
                  value={rendimento}
                  onChange={(e) => setRendimento(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Matérias-primas *</Label>
              <div className="grid gap-2">
                {itens.map((linha, index) => {
                  const materiaPrima = materiasPrimas.find((mp) => mp.id === linha.materiaPrimaId);
                  return (
                    <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_90px_auto] sm:items-end">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="mb-1 block text-sm text-ink-secondary">Matéria-prima</span>
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
                        <span className="mb-1 block text-sm text-ink-secondary">Quantidade</span>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={linha.quantidade}
                          onChange={(e) => atualizarLinha(index, { quantidade: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-sm text-ink-secondary">Unidade</span>
                        <Input
                          list="unidades-medida-sugeridas"
                          placeholder={materiaPrima?.unidadeMedida ?? "unidade"}
                          value={linha.unidadeMedida}
                          onChange={(e) => atualizarLinha(index, { unidadeMedida: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="col-span-2 sm:col-span-1"
                        onClick={() => setItens((atual) => atual.filter((_, i) => i !== index))}
                        disabled={itens.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-sm text-ink-secondary">
                Deixe a unidade em branco pra usar a mesma da matéria-prima. Só preencha se quiser escrever a
                quantidade numa unidade diferente (ex: g numa matéria-prima cadastrada em kg) — o sistema converte
                sozinho.
              </p>
              <datalist id="unidades-medida-sugeridas">
                <option value="g" />
                <option value="kg" />
                <option value="ml" />
                <option value="l" />
                <option value="cm" />
                <option value="m" />
                <option value="un" />
              </datalist>
              <Button type="button" variant="secondary" className="mt-2" onClick={() => setItens((a) => [...a, { ...LINHA_VAZIA }])}>
                + Adicionar item
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="custoMaoDeObra">Custo de mão de obra (por unidade)</Label>
                <Input
                  id="custoMaoDeObra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoMaoDeObra}
                  onChange={(e) => setCustoMaoDeObra(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="custoEmbalagemOutros">Embalagem/outros custos (por unidade)</Label>
                <Input
                  id="custoEmbalagemOutros"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoEmbalagemOutros}
                  onChange={(e) => setCustoEmbalagemOutros(Number(e.target.value))}
                />
              </div>
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
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : receitas.length === 0 ? (
        <EmptyState mensagem="Nenhuma ficha técnica cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4">Rendimento</th>
                <th className="px-5 py-4">Custo total/un.</th>
                <th className="px-5 py-4">Margem</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((r) => (
                <tr key={r.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/receitas/fichas/${r.id}`} className="hover:underline">
                      {r.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{r.produtoNome}</td>
                  <td className="px-5 py-4 text-ink-secondary">{r.rendimento}</td>
                  <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(r.custoTotal)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={tomDaMargem(r.margemPercentual)}>
                      {r.margemPercentual !== null ? `${r.margemPercentual}%` : "—"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
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
