"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarMoeda } from "@/lib/format";
import { useDebounced } from "@/lib/useDebounced";
import { MateriaPrimaRequest, MateriaPrimaResponse } from "@/types/estoque";
import { PaginaResponse } from "@/types/common";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Paginacao } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";
import { IconAlertTriangle, IconSearch } from "@/components/Icon";
import { alternarOrdenacao, Ordenacao } from "@/lib/ordenar";

const TAMANHO_PAGINA = 20;

type CampoOrdenacao = "nome" | "unidadeMedida" | "custoUnitario" | "estoqueAtual";

const MATERIA_PRIMA_VAZIA: MateriaPrimaRequest = {
  nome: "",
  unidadeMedida: "",
  custoUnitario: 0,
  estoqueMinimo: 0,
  volumeMl: null,
  fornecedor: "",
};

export default function MateriasPrimasPage() {
  const perguntar = useConfirm();
  const [resultado, setResultado] = useState<PaginaResponse<MateriaPrimaResponse> | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<MateriaPrimaRequest>(MATERIA_PRIMA_VAZIA);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca);
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);
  const [ordenacao, setOrdenacao] = useState<Ordenacao<CampoOrdenacao> | null>(null);

  const materiasPrimas = resultado?.conteudo ?? [];
  const filtroAtivo = buscaDebounced.trim() !== "" || apenasEstoqueBaixo;

  /** Busca uma página específica com os filtros/ordenação atuais — usada tanto pelo
   * efeito que refaz a busca quando algum filtro muda (sempre a partir da página 0)
   * quanto pelos botões de "Anterior"/"Próxima" (que pedem uma página específica). */
  async function buscar(pagina: number) {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (buscaDebounced.trim()) params.set("busca", buscaDebounced.trim());
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
  }, [buscaDebounced, apenasEstoqueBaixo, ordenacao]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      await api.post("/materias-primas", form);
      setForm(MATERIA_PRIMA_VAZIA);
      setMostrarForm(false);
      await buscar(0);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar matéria-prima");
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Matérias-primas"
        descricao="Insumos usados na produção dos produtos."
        acao={
          <Button onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "Nova matéria-prima"}
          </Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              {errosCampos.nome && <p className="mt-1 text-sm text-critical">{errosCampos.nome}</p>}
            </div>
            <div>
              <Label htmlFor="unidadeMedida">Unidade de medida *</Label>
              <Input
                id="unidadeMedida"
                list="unidades-medida-sugeridas"
                placeholder="g, kg, ml, l, cm, m, un..."
                required
                value={form.unidadeMedida}
                onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}
              />
              {errosCampos.unidadeMedida && <p className="mt-1 text-sm text-critical">{errosCampos.unidadeMedida}</p>}
              <p className="mt-1 text-sm text-ink-secondary">
                Usando g, kg, ml, l, cm, m ou un a ficha técnica converte automaticamente se a receita usar uma
                unidade diferente (ex: comprar em kg e usar em g).
              </p>
            </div>
            <div>
              <Label htmlFor="custoUnitario">Custo unitário *</Label>
              <Input
                id="custoUnitario"
                type="number"
                step="0.0001"
                min="0"
                required
                value={form.custoUnitario}
                onChange={(e) => setForm({ ...form, custoUnitario: Number(e.target.value) })}
              />
              {errosCampos.custoUnitario && <p className="mt-1 text-sm text-critical">{errosCampos.custoUnitario}</p>}
            </div>
            <div>
              <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="0.001"
                min="0"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="volumeMl">Volume (ml)</Label>
              <Input
                id="volumeMl"
                type="number"
                step="1"
                min="0"
                value={form.volumeMl ?? ""}
                onChange={(e) => setForm({ ...form, volumeMl: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" value={form.fornecedor ?? ""} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar matéria-prima"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <datalist id="unidades-medida-sugeridas">
        <option value="g" />
        <option value="kg" />
        <option value="ml" />
        <option value="l" />
        <option value="cm" />
        <option value="m" />
        <option value="un" />
      </datalist>

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
