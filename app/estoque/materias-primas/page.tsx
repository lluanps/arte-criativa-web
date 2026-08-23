"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarMoeda } from "@/lib/format";
import { useDebounced } from "@/lib/useDebounced";
import {
  arredondarQuantidade,
  MateriaPrimaDesejadaResponse,
  MateriaPrimaRequest,
  MateriaPrimaResponse,
  stepQuantidade,
  UNIDADES_MEDIDA,
} from "@/types/estoque";
import { CategoriaMateriaPrimaResponse } from "@/types/cadastros";
import { PaginaResponse } from "@/types/common";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Paginacao, Select } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";
import { SelectComCriacao } from "@/components/SelectComCriacao";
import { IconAlertTriangle, IconSearch } from "@/components/Icon";
import { alternarOrdenacao, Ordenacao } from "@/lib/ordenar";

const TAMANHO_PAGINA = 20;

type CampoOrdenacao = "nome" | "unidadeMedida" | "custoUnitario" | "estoqueAtual";

/** Estado do formulário — cobre tanto "registrar a compra de verdade" (todos os
 * campos) quanto "só anotar o nome" (só nome é lido nesse caso, ver `soAnotarNome`). */
interface FormState {
  nome: string;
  categoriaId: number | null;
  unidadeMedida: string;
  quantidadeComprada: number;
  valorPago: number;
  estoqueMinimo: number;
  fornecedor: string;
}

const FORM_VAZIO: FormState = {
  nome: "",
  categoriaId: null,
  unidadeMedida: "",
  quantidadeComprada: 0,
  valorPago: 0,
  estoqueMinimo: 0,
  fornecedor: "",
};

export default function MateriasPrimasPage() {
  const perguntar = useConfirm();
  const [resultado, setResultado] = useState<PaginaResponse<MateriaPrimaResponse> | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [soAnotarNome, setSoAnotarNome] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const [desejadas, setDesejadas] = useState<MateriaPrimaDesejadaResponse[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMateriaPrimaResponse[]>([]);

  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca);
  const [filtroCategoria, setFiltroCategoria] = useState<number | "">("");
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);
  const [ordenacao, setOrdenacao] = useState<Ordenacao<CampoOrdenacao> | null>(null);

  const materiasPrimas = resultado?.conteudo ?? [];
  const filtroAtivo = buscaDebounced.trim() !== "" || filtroCategoria !== "" || apenasEstoqueBaixo;

  async function carregarDesejadas() {
    try {
      setDesejadas(await api.get<MateriaPrimaDesejadaResponse[]>("/materias-primas/desejadas"));
    } catch {
      // Lista de compras é complementar — se falhar, a listagem principal já mostra erro.
    }
  }

  async function carregarCategorias() {
    try {
      setCategorias(await api.get<CategoriaMateriaPrimaResponse[]>("/categorias-materia-prima"));
    } catch {
      // Categorias são complementares (filtro/seletor) — se falhar, a listagem principal já mostra erro.
    }
  }

  /** Busca uma página específica com os filtros/ordenação atuais — usada tanto pelo
   * efeito que refaz a busca quando algum filtro muda (sempre a partir da página 0)
   * quanto pelos botões de "Anterior"/"Próxima" (que pedem uma página específica). */
  async function buscar(pagina: number) {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (buscaDebounced.trim()) params.set("busca", buscaDebounced.trim());
      if (filtroCategoria !== "") params.set("categoriaId", String(filtroCategoria));
      if (apenasEstoqueBaixo) params.set("estoqueBaixo", "true");
      params.set("pagina", String(pagina));
      params.set("tamanho", String(TAMANHO_PAGINA));
      if (ordenacao) {
        params.set("ordenarPor", ordenacao.campo);
        params.set("direcao", ordenacao.direcao);
      }
      const dados = await api.get<PaginaResponse<MateriaPrimaResponse>>(`/materias-primas/busca?${params.toString()}`);
      setResultado(dados);
      setPaginaAtual(pagina);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar matérias-primas");
    } finally {
      setCarregando(false);
    }
  }

  // Refaz a busca (sempre da página 0) toda vez que busca/filtro/ordenação muda —
  // inclui o carregamento inicial, já que roda uma vez no mount com os valores padrão.
  useEffect(() => {
    buscar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced, filtroCategoria, apenasEstoqueBaixo, ordenacao]);

  useEffect(() => {
    carregarDesejadas();
    carregarCategorias();
  }, []);

  function resetarForm() {
    setForm(FORM_VAZIO);
    setSoAnotarNome(false);
    setMostrarForm(false);
    setErrosCampos({});
  }

  /** Pré-preenche o nome a partir de um item da lista de compras e já abre o form de
   * compra de verdade — não marca soAnotarNome (a ideia é completar, não duplicar). */
  function completarCompra(desejada: MateriaPrimaDesejadaResponse) {
    setForm({ ...FORM_VAZIO, nome: desejada.nome });
    setSoAnotarNome(false);
    setMostrarForm(true);
    setErrosCampos({});
  }

  async function excluirDesejada(desejada: MateriaPrimaDesejadaResponse) {
    try {
      await api.del(`/materias-primas/desejadas/${desejada.id}`);
      await carregarDesejadas();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir item da lista de compras");
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      if (soAnotarNome) {
        await api.post("/materias-primas/desejadas", { nome: form.nome });
        await carregarDesejadas();
      } else {
        const request: MateriaPrimaRequest = {
          nome: form.nome,
          categoriaId: form.categoriaId,
          unidadeMedida: form.unidadeMedida,
          quantidadeComprada: form.quantidadeComprada,
          valorPago: form.valorPago,
          estoqueMinimo: form.estoqueMinimo,
          fornecedor: form.fornecedor,
        };
        await api.post("/materias-primas", request);
        // Se o nome bate com algo da lista de compras, a compra "completou" aquele
        // item — remove da lista pra não ficar duplicado.
        const desejadaCorrespondente = desejadas.find(
          (d) => d.nome.trim().toLowerCase() === form.nome.trim().toLowerCase()
        );
        if (desejadaCorrespondente) {
          await api.del(`/materias-primas/desejadas/${desejadaCorrespondente.id}`);
        }
        await Promise.all([buscar(0), carregarDesejadas()]);
      }
      resetarForm();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro(soAnotarNome ? "Erro ao anotar matéria-prima" : "Erro ao criar matéria-prima");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(materiaPrima: MateriaPrimaResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir "${materiaPrima.nome}"?`,
      descricao: "Essa ação não pode ser desfeita.",
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    try {
      await api.del(`/materias-primas/${materiaPrima.id}`);
      await buscar(paginaAtual);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        await perguntar({
          titulo: "Não é possível excluir",
          descricao: e.message,
          tone: "warning",
          acoes: [{ id: "entendi", label: "Entendi", variant: "primary" }],
        });
        return;
      }
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir matéria-prima");
    }
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setApenasEstoqueBaixo(false);
  }

  function cabecalho(campo: CampoOrdenacao, rotulo: string) {
    const ativo = ordenacao?.campo === campo;
    return (
      <th
        className="cursor-pointer select-none px-5 py-4 hover:text-ink"
        onClick={() => setOrdenacao((atual) => (atual ? alternarOrdenacao(atual, campo) : { campo, direcao: "asc" }))}
      >
        {rotulo} <span className={ativo ? "text-ink" : "text-transparent"}>{ativo && ordenacao?.direcao === "desc" ? "▼" : "▲"}</span>
      </th>
    );
  }

  const custoUnitarioPreview =
    form.quantidadeComprada > 0 && form.valorPago > 0 ? form.valorPago / form.quantidadeComprada : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Matérias-primas"
        descricao="Insumos usados na produção dos produtos."
        acao={
          <Button onClick={() => (mostrarForm ? resetarForm() : setMostrarForm(true))}>
            {mostrarForm ? "Cancelar" : "Nova matéria-prima"}
          </Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-base text-ink-secondary">
                <input
                  type="checkbox"
                  checked={soAnotarNome}
                  onChange={(e) => setSoAnotarNome(e.target.checked)}
                  className="h-4 w-4 rounded border-hairline"
                />
                Só quero anotar o nome (ainda não sei o preço)
              </label>
            </div>

            <div className={soAnotarNome ? "sm:col-span-2" : undefined}>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                list="materias-primas-desejadas"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              {errosCampos.nome && <p className="mt-1 text-sm text-critical">{errosCampos.nome}</p>}
              {!soAnotarNome && desejadas.length > 0 && (
                <p className="mt-1 text-sm text-ink-secondary">
                  Já na sua lista de compras: {desejadas.map((d) => d.nome).join(", ")}
                </p>
              )}
            </div>

            {!soAnotarNome && (
              <>
                <div>
                  <Label htmlFor="categoriaId">Categoria</Label>
                  <SelectComCriacao
                    id="categoriaId"
                    itens={categorias}
                    value={form.categoriaId ?? ""}
                    onChange={(id) => setForm({ ...form, categoriaId: id === "" ? null : id })}
                    onCriar={(nome) => api.post<CategoriaMateriaPrimaResponse>("/categorias-materia-prima", { nome })}
                    onCriado={(item) => setCategorias((atual) => [...atual, item])}
                    novoPlaceholder="Nome da categoria"
                  />
                </div>
                <div>
                  <Label htmlFor="unidadeMedida">Unidade de medida *</Label>
                  <Select
                    id="unidadeMedida"
                    required
                    value={form.unidadeMedida}
                    onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {UNIDADES_MEDIDA.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </Select>
                  {errosCampos.unidadeMedida && <p className="mt-1 text-sm text-critical">{errosCampos.unidadeMedida}</p>}
                  <p className="mt-1 text-sm text-ink-secondary">
                    A ficha técnica converte automaticamente se a receita usar uma unidade diferente (ex: comprar em
                    kg e usar em g).
                  </p>
                </div>
                <div>
                  <Label htmlFor="quantidadeComprada">Quantidade comprada *</Label>
                  <Input
                    id="quantidadeComprada"
                    type="number"
                    step={stepQuantidade(form.unidadeMedida)}
                    min="0"
                    required
                    value={form.quantidadeComprada}
                    onChange={(e) => setForm({ ...form, quantidadeComprada: arredondarQuantidade(Number(e.target.value), form.unidadeMedida) })}
                  />
                  {errosCampos.quantidadeComprada && (
                    <p className="mt-1 text-sm text-critical">{errosCampos.quantidadeComprada}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="valorPago">Valor pago no total *</Label>
                  <Input
                    id="valorPago"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.valorPago}
                    onChange={(e) => setForm({ ...form, valorPago: Number(e.target.value) })}
                  />
                  {errosCampos.valorPago && <p className="mt-1 text-sm text-critical">{errosCampos.valorPago}</p>}
                  <p className="mt-1 text-sm text-ink-secondary">
                    {custoUnitarioPreview !== null
                      ? `≈ ${formatarMoeda(custoUnitarioPreview)} por ${form.unidadeMedida || "unidade"} — vira o custo unitário e uma despesa em Financeiro.`
                      : "O sistema calcula o custo unitário sozinho (valor ÷ quantidade)."}
                  </p>
                </div>
                <div>
                  <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    step={stepQuantidade(form.unidadeMedida)}
                    min="0"
                    value={form.estoqueMinimo}
                    onChange={(e) => setForm({ ...form, estoqueMinimo: arredondarQuantidade(Number(e.target.value), form.unidadeMedida) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={form.fornecedor}
                    onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : soAnotarNome ? "Adicionar à lista de compras" : "Salvar matéria-prima"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <datalist id="materias-primas-desejadas">
        {desejadas.map((d) => (
          <option key={d.id} value={d.nome} />
        ))}
      </datalist>

      {desejadas.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Lista de compras</h2>
          <p className="mb-3 text-sm text-ink-secondary">
            Matérias-primas anotadas sem preço ainda — clique em "Comprei" quando for registrar a compra de verdade.
          </p>
          <ul className="grid gap-2">
            {desejadas.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-hairline px-4 py-2.5">
                <span className="font-medium text-ink">{d.nome}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => completarCompra(d)} className="text-sm font-semibold text-accent hover:underline">
                    Comprei
                  </button>
                  <button type="button" onClick={() => excluirDesejada(d)} className="text-sm text-critical hover:underline">
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!(!filtroAtivo && resultado?.totalElementos === 0) && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                id="busca"
                placeholder="Nome da matéria-prima..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          {categorias.length > 0 && (
            <div className="min-w-[180px]">
              <Label htmlFor="filtroCategoria">Categoria</Label>
              <Select
                id="filtroCategoria"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <label className="flex h-[46px] items-center gap-2 text-base text-ink-secondary">
            <input
              type="checkbox"
              checked={apenasEstoqueBaixo}
              onChange={(e) => setApenasEstoqueBaixo(e.target.checked)}
              className="h-4 w-4 rounded border-hairline"
            />
            Só estoque baixo
          </label>
          {filtroAtivo && (
            <button type="button" onClick={limparFiltros} className="h-[46px] text-sm text-ink-secondary hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : materiasPrimas.length === 0 ? (
        <EmptyState mensagem={filtroAtivo ? "Nenhuma matéria-prima encontrada com esse filtro." : "Nenhuma matéria-prima cadastrada ainda."} />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-base">
              <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
                <tr>
                  {cabecalho("nome", "Nome")}
                  <th className="px-5 py-4">Categoria</th>
                  {cabecalho("unidadeMedida", "Unidade")}
                  {cabecalho("custoUnitario", "Custo unitário")}
                  {cabecalho("estoqueAtual", "Estoque")}
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {materiasPrimas.map((mp) => {
                  const estoqueBaixo = mp.estoqueAtual <= mp.estoqueMinimo;
                  const referencia = Math.max(mp.estoqueMinimo * 3, 1);
                  const pctBarra = Math.max(6, Math.min(100, (mp.estoqueAtual / referencia) * 100));
                  return (
                    <tr key={mp.id} className="border-b border-hairline last:border-0">
                      <td className="px-5 py-4 font-medium text-ink">
                        <Link href={`/estoque/materias-primas/${mp.id}`} className="hover:underline">
                          {mp.nome}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-ink-secondary">{mp.categoriaNome ?? "—"}</td>
                      <td className="px-5 py-4 text-ink-secondary">{mp.unidadeMedida}</td>
                      <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(mp.custoUnitario)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-hairline">
                              <span
                                className={`block h-full rounded-full ${estoqueBaixo ? "bg-warning" : "bg-good"}`}
                                style={{ width: `${pctBarra}%` }}
                              />
                            </div>
                            {estoqueBaixo && (
                              <Badge tone="warning">
                                <span className="flex items-center gap-1">
                                  <IconAlertTriangle className="h-3 w-3" strokeWidth={2.4} />
                                  baixo
                                </span>
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-ink-secondary tabular-figures">
                            {mp.estoqueAtual} {mp.unidadeMedida}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/estoque/materias-primas/${mp.id}`} className="mr-3 text-ink-secondary hover:underline">
                          Ver
                        </Link>
                        <button onClick={() => excluir(mp)} className="text-critical hover:underline">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          {resultado && (
            <Paginacao
              pagina={resultado.pagina}
              totalPaginas={resultado.totalPaginas}
              totalElementos={resultado.totalElementos}
              tamanho={resultado.tamanho}
              onMudarPagina={buscar}
            />
          )}
        </>
      )}
    </main>
  );
}
