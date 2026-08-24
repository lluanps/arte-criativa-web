"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarData, formatarMoeda } from "@/lib/format";
import { agruparMateriaPrimaPorCategoria, arredondarQuantidade, MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";
import { ReceitaItemRequest, ReceitaRequest, ReceitaResponse } from "@/types/producao";
import { Badge, Button, Card, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

interface LinhaItem {
  materiaPrimaId: number | "";
  quantidade: number;
  /** "" = usa a mesma unidade cadastrada na matéria-prima (sem conversão). */
  unidadeMedida: string;
}

function tomDaMargem(percentual: number | null): "default" | "success" | "warning" | "danger" {
  if (percentual === null) return "default";
  if (percentual < 15) return "danger";
  if (percentual < 40) return "warning";
  return "success";
}

export default function FichaTecnicaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [receita, setReceita] = useState<ReceitaResponse | null>(null);
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [produtoId, setProdutoId] = useState<number | "">("");
  const [nome, setNome] = useState("");
  const [rendimento, setRendimento] = useState(1);
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(0);
  const [custoEmbalagemOutros, setCustoEmbalagemOutros] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const materiasPrimasAgrupadas = useMemo(() => agruparMateriaPrimaPorCategoria(materiasPrimas), [materiasPrimas]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [receitaCarregada, p, mp] = await Promise.all([
        api.get<ReceitaResponse>(`/receitas/${id}`),
        api.get<ProdutoResponse[]>("/produtos"),
        api.get<MateriaPrimaResponse[]>("/materias-primas"),
      ]);
      setReceita(receitaCarregada);
      setProdutos(p);
      setMateriasPrimas(mp);
      setProdutoId(receitaCarregada.produtoId);
      setNome(receitaCarregada.nome);
      setRendimento(receitaCarregada.rendimento);
      setItens(
        receitaCarregada.itens.map((i) => ({
          materiaPrimaId: i.materiaPrimaId,
          quantidade: i.quantidade,
          unidadeMedida: i.unidadeMedida,
        }))
      );
      setCustoMaoDeObra(receitaCarregada.custoMaoDeObra);
      setCustoEmbalagemOutros(receitaCarregada.custoEmbalagemOutros);
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
      .filter((l): l is LinhaItem & { materiaPrimaId: number } => l.materiaPrimaId !== "" && l.quantidade > 0)
      .map((l) => ({
        materiaPrimaId: l.materiaPrimaId,
        quantidade: l.quantidade,
        unidadeMedida: l.unidadeMedida.trim() === "" ? undefined : l.unidadeMedida.trim(),
      }));

    if (produtoId === "" || itensValidos.length === 0) {
      setErro("Selecione o produto e mantenha ao menos um item válido.");
      return;
    }

    const request: ReceitaRequest = { produtoId, nome, rendimento, itens: itensValidos, custoMaoDeObra, custoEmbalagemOutros };

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
    const confirmacao = await perguntar({
      titulo: "Excluir essa ficha técnica?",
      descricao: "Essa ação não pode ser desfeita.",
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

      {receita && (
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Custo total</p>
            <p className="mt-1.5 text-2xl font-extrabold tabular-figures text-ink">{formatarMoeda(receita.custoTotal)}</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Insumo {formatarMoeda(receita.custoProducao)} + mão de obra {formatarMoeda(receita.custoMaoDeObra)} + outros{" "}
              {formatarMoeda(receita.custoEmbalagemOutros)}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Preço de venda</p>
            <p className="mt-1.5 text-2xl font-extrabold tabular-figures text-ink">
              {formatarMoeda(produtos.find((p) => p.id === receita.produtoId)?.precoVenda ?? 0)}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Margem de lucro</p>
            <p className={`mt-1.5 text-2xl font-extrabold tabular-figures ${receita.margemLucro < 0 ? "text-critical" : "text-good"}`}>
              {formatarMoeda(receita.margemLucro)}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Margem</p>
            <p className="mt-1.5">
              <Badge tone={tomDaMargem(receita.margemPercentual)}>
                {receita.margemPercentual !== null ? `${receita.margemPercentual}%` : "—"}
              </Badge>
            </p>
          </Card>
        </div>
      )}

      {receita && (
        <Card className="mb-8 overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-3">Matéria-prima</th>
                <th className="px-5 py-3">Quantidade</th>
                <th className="px-5 py-3">Custo unitário</th>
                <th className="px-5 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receita.itens.map((item) => (
                <tr key={item.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{item.materiaPrimaNome}</td>
                  <td className="px-5 py-3 text-ink-secondary">
                    {item.quantidade} {item.unidadeMedida}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">
                    {formatarMoeda(item.custoUnitarioMateriaPrima)}/{item.unidadeMedidaMateriaPrima}
                  </td>
                  <td className="px-5 py-3 font-medium tabular-figures text-ink">{formatarMoeda(item.subtotalCusto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {receita && (
        <Card className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Preço sugerido</p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-figures text-ink">{formatarMoeda(receita.precoSugerido)}</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Custo total × margem desejada de {receita.margemDesejadaPercentual}%
            {" "}
            <Link href={`/estoque/produtos/${receita.produtoId}`} className="text-accent hover:underline">
              (ajustar margem)
            </Link>
          </p>

          {receita.precoMercadoMin !== null && receita.precoMercadoMax !== null ? (
            <p className="mt-3 text-sm text-ink-secondary">
              Referência de mercado: <strong className="text-ink">{formatarMoeda(receita.precoMercadoMin)} – {formatarMoeda(receita.precoMercadoMax)}</strong>
              {receita.precoMercadoAtualizadoEm && ` (atualizado em ${formatarData(receita.precoMercadoAtualizadoEm.slice(0, 10))})`}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">Sem referência de mercado cadastrada pra essa categoria ainda.</p>
          )}
        </Card>
      )}

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
                const unidadeEfetiva = linha.unidadeMedida.trim() || materiaPrima?.unidadeMedida;
                return (
                  <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_90px_auto] sm:items-end">
                    <div className="col-span-2 sm:col-span-1">
                      <Select
                        value={linha.materiaPrimaId}
                        onChange={(e) => atualizarLinha(index, { materiaPrimaId: Number(e.target.value) })}
                      >
                        <option value="">Selecione...</option>
                        {materiasPrimasAgrupadas.map((grupo) => (
                          <optgroup key={grupo.categoriaNome} label={grupo.categoriaNome}>
                            {grupo.itens.map((mp) => (
                              <option key={mp.id} value={mp.id}>
                                {mp.nome} ({mp.unidadeMedida})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </div>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={linha.quantidade}
                      onChange={(e) => atualizarLinha(index, { quantidade: arredondarQuantidade(Number(e.target.value), unidadeEfetiva) })}
                    />
                    <Input
                      list="unidades-medida-sugeridas"
                      placeholder={materiaPrima?.unidadeMedida ?? "unidade"}
                      value={linha.unidadeMedida}
                      onChange={(e) => atualizarLinha(index, { unidadeMedida: e.target.value })}
                    />
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
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={() => setItens((a) => [...a, { materiaPrimaId: "", quantidade: 0, unidadeMedida: "" }])}
            >
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
