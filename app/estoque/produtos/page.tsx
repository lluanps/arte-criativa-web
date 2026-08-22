"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { criarArteNoCanva, gerarDescricaoComChatGPT, gerarImagemComChatGPT } from "@/lib/ai-shortcuts";
import { formatarMoeda } from "@/lib/format";
import { ProdutoRequest, ProdutoResponse } from "@/types/estoque";
import { VendaResponse } from "@/types/vendas";
import { CategoriaResponse } from "@/types/cadastros";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { SelectComCriacao } from "@/components/SelectComCriacao";
import { GaleriaFotos } from "@/components/GaleriaFotos";
import { useConfirm } from "@/components/ConfirmProvider";
import { IconAlertTriangle, IconArrowRight, IconBox, IconCandle, IconCup, IconSearch } from "@/components/Icon";
import { alternarOrdenacao, compararValores, Ordenacao } from "@/lib/ordenar";

const MAX_FOTOS = 5;

type CampoOrdenacao = "nome" | "categoriaNome" | "volumeMl" | "precoVenda" | "estoqueAtual";

const PRODUTO_VAZIO: ProdutoRequest = {
  nome: "",
  descricao: "",
  categoriaId: null,
  volumeMl: null,
  precoVenda: 0,
  estoqueMinimo: 0,
  fotosUrls: [],
};

function iconeDoProduto(categoria: string | null) {
  const c = (categoria ?? "").toLowerCase();
  if (c.includes("vela")) return IconCandle;
  if (c.includes("xícara") || c.includes("xicara") || c.includes("cerâmica") || c.includes("ceramica")) return IconCup;
  return IconBox;
}

export default function ProdutosPage() {
  const perguntar = useConfirm();
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<ProdutoRequest>(PRODUTO_VAZIO);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | "">("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);
  const [ordenacao, setOrdenacao] = useState<Ordenacao<CampoOrdenacao> | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [dadosProdutos, dadosVendas, dadosCategorias] = await Promise.all([
        api.get<ProdutoResponse[]>("/produtos"),
        api.get<VendaResponse[]>("/vendas"),
        api.get<CategoriaResponse[]>("/categorias"),
      ]);
      setProdutos(dadosProdutos);
      setVendas(dadosVendas);
      setCategorias(dadosCategorias);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar produtos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();

    // Vem de "Transformar em produto" numa ideia (app/ideias/[id]) — pré-preenche o
    // formulário e já abre. Lido direto da URL (não useSearchParams) pra não precisar
    // de Suspense boundary só pra isso.
    const params = new URLSearchParams(window.location.search);
    if (params.get("novaIdeia") === "1") {
      const fotoDaIdeia = params.get("fotoUrl");
      setForm({
        ...PRODUTO_VAZIO,
        nome: params.get("nome") ?? "",
        descricao: params.get("descricao") ?? "",
        fotosUrls: fotoDaIdeia ? [fotoDaIdeia] : [],
      });
      setMostrarForm(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      await api.post("/produtos", form);
      setForm(PRODUTO_VAZIO);
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar produto");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(produto: ProdutoResponse) {
    try {
      await api.put(`/produtos/${produto.id}`, { ...produto, ativo: false });
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao desativar produto");
    }
  }

  async function oferecerDesativar(produto: ProdutoResponse, motivo: string) {
    const escolha = await perguntar({
      titulo: "Desativar em vez de excluir?",
      descricao: `${motivo}\n\nUm produto desativado some da tela de vendas e do contador de "produtos ativos", sem apagar o histórico.`,
      tone: "warning",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "desativar", label: "Desativar produto", variant: "primary" },
      ],
    });
    if (escolha === "desativar") await desativar(produto);
  }

  async function excluir(produto: ProdutoResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir "${produto.nome}"?`,
      descricao: "Essa ação não pode ser desfeita.",
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    let motivoBloqueio: string;
    try {
      await api.del(`/produtos/${produto.id}`);
      await carregar();
      return;
    } catch (e) {
      // 422 = bloqueio já detectado pela API antes de tentar excluir (o caso normal,
      // com a lista específica do que está vinculado). 409 fica como rede de segurança
      // pra uma violação de FK que a checagem não previu.
      if (!(e instanceof ApiError) || (e.status !== 422 && e.status !== 409)) {
        setErro(e instanceof ApiError ? e.message : "Erro ao excluir produto");
        return;
      }
      motivoBloqueio = e.message;
    }

    // Bloqueado por vínculo (movimentações/vendas/receita/tutorial). Se foi cadastro
    // por engano, sem venda de verdade, oferece excluir tudo em cascata; senão,
    // desativar é a única alternativa segura (protege histórico de faturamento).
    const escolha = await perguntar({
      titulo: "Não é possível excluir",
      descricao:
        `${motivoBloqueio}\n\n` +
        "Foi um cadastro por engano, sem venda de verdade? Nesse caso dá pra excluir tudo de vez.",
      tone: "warning",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "desativar", label: "Desativar produto", variant: "secondary" },
        { id: "definitivo", label: "Excluir tudo (foi engano)", variant: "danger" },
      ],
    });

    if (escolha === "desativar") {
      await desativar(produto);
      return;
    }
    if (escolha !== "definitivo") return;

    try {
      await api.del(`/produtos/${produto.id}/definitivo`);
      await carregar();
    } catch (e) {
      // 422 = IllegalStateException (tinha venda de verdade); 409 fica como rede de
      // segurança pra uma violação de FK não prevista pela checagem.
      if (e instanceof ApiError && (e.status === 422 || e.status === 409)) {
        await oferecerDesativar(produto, e.message);
      } else {
        setErro(e instanceof ApiError ? e.message : "Erro ao excluir definitivamente");
      }
    }
  }

  const hoje = new Date();
  const vendasDoMes = vendas.filter((v) => {
    const data = new Date(v.dataVenda);
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  });
  const vendidoNoMes = vendasDoMes.reduce((soma, v) => soma + v.valorTotal, 0);
  const ticketMedio = vendasDoMes.length > 0 ? vendidoNoMes / vendasDoMes.length : 0;
  const estoqueBaixoCount = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo).length;

  const buscaNormalizada = busca.trim().toLowerCase();
  const produtosFiltrados = produtos.filter((p) => {
    if (buscaNormalizada && !p.nome.toLowerCase().includes(buscaNormalizada)) return false;
    if (filtroCategoria !== "" && p.categoriaId !== filtroCategoria) return false;
    if (filtroStatus === "ativos" && !p.ativo) return false;
    if (filtroStatus === "inativos" && p.ativo) return false;
    if (apenasEstoqueBaixo && p.estoqueAtual > p.estoqueMinimo) return false;
    return true;
  });
  const produtosOrdenados = ordenacao
    ? [...produtosFiltrados].sort((a, b) => compararValores(a[ordenacao.campo], b[ordenacao.campo], ordenacao.direcao))
    : produtosFiltrados;
  const filtroAtivo = buscaNormalizada !== "" || filtroCategoria !== "" || filtroStatus !== "todos" || apenasEstoqueBaixo;

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setFiltroStatus("todos");
    setApenasEstoqueBaixo(false);
  }

  function cabecalho(campo: CampoOrdenacao, rotulo: string) {
    const ativo = ordenacao?.campo === campo;
    return (
      <th
        className="cursor-pointer select-none px-5 py-4 font-bold hover:text-ink"
        onClick={() => setOrdenacao((atual) => (atual ? alternarOrdenacao(atual, campo) : { campo, direcao: "asc" }))}
      >
        {rotulo} <span className={ativo ? "text-ink" : "text-transparent"}>{ativo && ordenacao?.direcao === "desc" ? "▼" : "▲"}</span>
      </th>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Produtos"
        descricao="Produtos finais vendidos — velas, xícaras e mais."
        acao={
          <Button onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Novo produto"}
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
              <Label htmlFor="categoriaId">Categoria</Label>
              <SelectComCriacao
                id="categoriaId"
                itens={categorias}
                value={form.categoriaId ?? ""}
                onChange={(id) => setForm({ ...form, categoriaId: id === "" ? null : id })}
                onCriar={(nome) => api.post<CategoriaResponse>("/categorias", { nome })}
                onCriado={(item) => setCategorias((atual) => [...atual, item])}
                novoPlaceholder="Nome da categoria"
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
            <div>
              <Label htmlFor="precoVenda">Preço de venda *</Label>
              <Input
                id="precoVenda"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.precoVenda}
                onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })}
              />
              {errosCampos.precoVenda && <p className="mt-1 text-sm text-critical">{errosCampos.precoVenda}</p>}
            </div>
            <div>
              <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="1"
                min="0"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <button
                type="button"
                onClick={() =>
                  gerarDescricaoComChatGPT({
                    nome: form.nome,
                    categoriaNome: categorias.find((c) => c.id === form.categoriaId)?.nome,
                    volumeMl: form.volumeMl,
                    precoVenda: form.precoVenda,
                  })
                }
                className="mb-1.5 block text-sm font-medium text-ink-secondary hover:underline"
              >
                ✨ Gerar com ChatGPT
              </button>
              <Input id="descricao" value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Fotos (até {MAX_FOTOS})</Label>
              <div className="mb-1.5 flex gap-3 text-sm font-medium text-ink-secondary">
                <button
                  type="button"
                  onClick={() =>
                    gerarImagemComChatGPT({
                      nome: form.nome,
                      categoriaNome: categorias.find((c) => c.id === form.categoriaId)?.nome,
                      volumeMl: form.volumeMl,
                      precoVenda: form.precoVenda,
                    })
                  }
                  className="hover:underline"
                >
                  🖼️ Gerar imagem com ChatGPT
                </button>
                <button type="button" onClick={criarArteNoCanva} className="hover:underline">
                  🎨 Criar arte no Canva
                </button>
              </div>
              <GaleriaFotos
                urls={form.fotosUrls ?? []}
                onChange={(fotosUrls) => setForm({ ...form, fotosUrls })}
                max={MAX_FOTOS}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar produto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Produtos ativos</p>
              <p className="mt-1.5 text-3xl font-extrabold tabular-figures text-ink">{produtos.filter((p) => p.ativo).length}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Estoque baixo</p>
              <p className={`mt-1.5 text-3xl font-extrabold tabular-figures ${estoqueBaixoCount > 0 ? "text-warning" : "text-ink"}`}>
                {estoqueBaixoCount}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Vendido no mês</p>
              <p className="mt-1.5 text-3xl font-extrabold tabular-figures text-good">{formatarMoeda(vendidoNoMes)}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">Ticket médio</p>
              <p className="mt-1.5 text-3xl font-extrabold tabular-figures text-ink">{formatarMoeda(ticketMedio)}</p>
            </Card>
          </div>

          {produtos.length > 0 && (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Label htmlFor="busca">Buscar</Label>
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <Input
                    id="busca"
                    placeholder="Nome do produto..."
                    className="pl-9"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-40">
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
              <div className="w-36">
                <Label htmlFor="filtroStatus">Status</Label>
                <Select id="filtroStatus" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}>
                  <option value="todos">Todos</option>
                  <option value="ativos">Ativos</option>
                  <option value="inativos">Inativos</option>
                </Select>
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

          {produtos.length === 0 ? (
            <EmptyState mensagem="Nenhum produto cadastrado ainda." />
          ) : produtosFiltrados.length === 0 ? (
            <EmptyState mensagem="Nenhum produto encontrado com esse filtro." />
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-base">
                <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-faint">
                  <tr>
                    {cabecalho("nome", "Produto")}
                    {cabecalho("categoriaNome", "Categoria")}
                    {cabecalho("volumeMl", "Volume")}
                    {cabecalho("precoVenda", "Preço")}
                    {cabecalho("estoqueAtual", "Estoque")}
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {produtosOrdenados.map((produto) => {
                    const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo;
                    const referencia = Math.max(produto.estoqueMinimo * 3, 1);
                    const pctBarra = Math.max(6, Math.min(100, (produto.estoqueAtual / referencia) * 100));
                    const Icone = iconeDoProduto(produto.categoriaNome);
                    return (
                      <tr key={produto.id} className="border-b border-hairline last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            {produto.fotosUrls[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica (Blob ou link externo)
                              <img
                                src={produto.fotosUrls[0]}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  estoqueBaixo ? "bg-warning-soft text-warning" : "bg-good-soft text-good"
                                }`}
                              >
                                <Icone className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <Link href={`/estoque/produtos/${produto.id}`} className="font-semibold text-ink hover:underline">
                                {produto.nome}
                              </Link>
                              {!produto.ativo && <span className="ml-2 text-sm text-ink-faint">(inativo)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink-secondary">{produto.categoriaNome ?? "—"}</td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">{produto.volumeMl ? `${produto.volumeMl}ml` : "—"}</td>
                        <td className="px-5 py-4 text-ink-secondary tabular-figures">{formatarMoeda(produto.precoVenda)}</td>
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
                            <span className="text-sm text-ink-secondary tabular-figures">{produto.estoqueAtual} un.</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/estoque/produtos/${produto.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-ink-secondary hover:text-accent"
                          >
                            Ver <IconArrowRight className="h-4 w-4" strokeWidth={2.4} />
                          </Link>
                          <button
                            onClick={() => excluir(produto)}
                            className="ml-3 text-sm text-critical hover:underline"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
