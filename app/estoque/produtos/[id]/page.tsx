"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { criarArteNoCanva, gerarDescricaoComChatGPT, gerarImagemComChatGPT } from "@/lib/ai-shortcuts";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import {
  MotivoMovimentacaoProduto,
  MovimentacaoProdutoRequest,
  MovimentacaoResponse,
  ProdutoRequest,
  ProdutoResponse,
  TipoMovimentacao,
} from "@/types/estoque";
import { CategoriaResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { SelectComCriacao } from "@/components/SelectComCriacao";
import { GaleriaFotos } from "@/components/GaleriaFotos";
import { EtiquetaProduto } from "@/components/EtiquetaProduto";
import { IconImage, IconPalette, IconPrinter, IconSparkles } from "@/components/Icon";
import { useConfirm } from "@/components/ConfirmProvider";

const MOTIVOS: MotivoMovimentacaoProduto[] = ["PRODUCAO", "VENDA", "AJUSTE", "PERDA"];
const MAX_FOTOS = 5;

export default function ProdutoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [produto, setProduto] = useState<ProdutoResponse | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([]);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroConflito, setErroConflito] = useState(false);

  const [form, setForm] = useState<ProdutoRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [movForm, setMovForm] = useState<MovimentacaoProdutoRequest>({
    tipo: "ENTRADA",
    motivo: "AJUSTE",
    quantidade: 0,
    observacao: "",
  });
  const [registrandoMov, setRegistrandoMov] = useState(false);
  const [erroMov, setErroMov] = useState<string | null>(null);

  const [etiquetaAberta, setEtiquetaAberta] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [p, movs, dadosCategorias] = await Promise.all([
        api.get<ProdutoResponse>(`/produtos/${id}`),
        api.get<MovimentacaoResponse[]>(`/produtos/${id}/movimentacoes`),
        api.get<CategoriaResponse[]>("/categorias"),
      ]);
      setProduto(p);
      setForm({
        nome: p.nome,
        descricao: p.descricao ?? "",
        categoriaId: p.categoriaId,
        volumeMl: p.volumeMl,
        precoVenda: p.precoVenda,
        margemDesejadaPercentual: p.margemDesejadaPercentual,
        estoqueMinimo: p.estoqueMinimo,
        fotosUrls: p.fotosUrls,
        ativo: p.ativo,
      });
      setMovimentacoes(movs);
      setCategorias(dadosCategorias);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar produto");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErro(null);
    setErroConflito(false);
    setErrosCampos({});
    try {
      const atualizado = await api.put<ProdutoResponse>(`/produtos/${id}`, form);
      setProduto(atualizado);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
        // 409 = alguém mais salvou esse produto entre você abrir a tela e clicar em
        // salvar (lock otimista via @Version) — sobrescrever cegamente perderia a
        // mudança da outra pessoa, então oferece recarregar em vez de só reclamar.
        setErroConflito(e.status === 409);
      } else {
        setErro("Erro ao salvar produto");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function desativar() {
    if (!produto) return;
    try {
      await api.put(`/produtos/${produto.id}`, { ...produto, ativo: false });
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao desativar produto");
    }
  }

  async function oferecerDesativar(motivo: string) {
    const escolha = await perguntar({
      titulo: "Desativar em vez de excluir?",
      descricao: `${motivo}\n\nUm produto desativado some da tela de vendas e do contador de "produtos ativos", sem apagar o histórico.`,
      tone: "warning",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "desativar", label: "Desativar produto", variant: "primary" },
      ],
    });
    if (escolha === "desativar") await desativar();
  }

  async function excluir() {
    if (!produto) return;
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

    setExcluindo(true);
    let motivoBloqueio: string;
    try {
      await api.del(`/produtos/${produto.id}`);
      router.push("/estoque/produtos");
      return;
    } catch (e) {
      if (!(e instanceof ApiError) || (e.status !== 422 && e.status !== 409)) {
        setErro(e instanceof ApiError ? e.message : "Erro ao excluir produto");
        setExcluindo(false);
        return;
      }
      motivoBloqueio = e.message;
    }

    const escolha = await perguntar({
      titulo: "Não é possível excluir",
      descricao: `${motivoBloqueio}\n\nFoi um cadastro por engano, sem venda de verdade? Nesse caso dá pra excluir tudo de vez.`,
      tone: "warning",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "desativar", label: "Desativar produto", variant: "secondary" },
        { id: "definitivo", label: "Excluir tudo (foi engano)", variant: "danger" },
      ],
    });

    if (escolha === "desativar") {
      await desativar();
      setExcluindo(false);
      return;
    }
    if (escolha !== "definitivo") {
      setExcluindo(false);
      return;
    }

    try {
      await api.del(`/produtos/${produto.id}/definitivo`);
      router.push("/estoque/produtos");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 422 || e.status === 409)) {
        await oferecerDesativar(e.message);
      } else {
        setErro(e instanceof ApiError ? e.message : "Erro ao excluir definitivamente");
      }
      setExcluindo(false);
    }
  }

  async function registrarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    setRegistrandoMov(true);
    setErroMov(null);
    try {
      await api.post(`/produtos/${id}/movimentacoes`, movForm);
      setMovForm({ tipo: "ENTRADA", motivo: "AJUSTE", quantidade: 0, observacao: "" });
      await carregar();
    } catch (e) {
      setErroMov(e instanceof ApiError ? e.message : "Erro ao registrar movimentação");
    } finally {
      setRegistrandoMov(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-6xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (!produto || !form) return <main className="mx-auto max-w-6xl px-6 py-10"><ErrorBanner mensagem={erro ?? "Produto não encontrado"} /></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/estoque/produtos" className="text-base text-ink-secondary hover:underline">
        ← Produtos
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          titulo={produto.nome}
          descricao={`Estoque atual: ${produto.estoqueAtual} · Preço: ${formatarMoeda(produto.precoVenda)}`}
        />
        <Button variant="secondary" onClick={() => setEtiquetaAberta(true)} className="inline-flex items-center gap-1.5">
          <IconPrinter className="h-4 w-4" /> Imprimir etiqueta
        </Button>
      </div>

      {erro && (
        <ErrorBanner mensagem={erro} acao={erroConflito ? { label: "Recarregar dados", onClick: carregar } : undefined} />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Editar produto</h2>
          <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-2">
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
              <Label htmlFor="margemDesejadaPercentual">Margem desejada (%)</Label>
              <Input
                id="margemDesejadaPercentual"
                type="number"
                step="1"
                min="0"
                placeholder="200 (padrão)"
                value={form.margemDesejadaPercentual ?? ""}
                onChange={(e) =>
                  setForm({ ...form, margemDesejadaPercentual: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
              <p className="mt-1 text-sm text-ink-faint">
                Usada pra calcular o preço sugerido na ficha técnica. Em branco = usa o padrão do sistema (200%).
              </p>
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
                className="mb-1.5 inline-flex items-center gap-1 text-sm font-medium text-ink-secondary hover:underline"
              >
                <IconSparkles className="h-3.5 w-3.5" /> Gerar com ChatGPT
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
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <IconImage className="h-3.5 w-3.5" /> Gerar imagem com ChatGPT
                </button>
                <button type="button" onClick={criarArteNoCanva} className="inline-flex items-center gap-1 hover:underline">
                  <IconPalette className="h-3.5 w-3.5" /> Criar arte no Canva
                </button>
              </div>
              <GaleriaFotos
                urls={form.fotosUrls ?? []}
                onChange={(fotosUrls) => setForm({ ...form, fotosUrls })}
                max={MAX_FOTOS}
              />
            </div>
            <label className="flex items-center gap-2 text-base text-ink-secondary sm:col-span-2">
              <input
                type="checkbox"
                checked={form.ativo ?? true}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Ativo
            </label>
            <div className="flex items-center justify-between border-t border-hairline pt-4 sm:col-span-2">
              <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Excluir produto"}
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Registrar movimentação</h2>
          {erroMov && <ErrorBanner mensagem={erroMov} />}
          <form onSubmit={registrarMovimentacao} className="grid gap-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={movForm.tipo}
                  onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as TipoMovimentacao })}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Select
                  id="motivo"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value as MotivoMovimentacaoProduto })}
                >
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="1"
                min="0"
                required
                value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={movForm.observacao ?? ""}
                onChange={(e) => setMovForm({ ...movForm, observacao: e.target.value })}
              />
            </div>
            <div>
              <Button type="submit" disabled={registrandoMov}>
                {registrandoMov ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-semibold">Histórico de movimentações</h2>
      {movimentacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma movimentação registrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Motivo</th>
                <th className="px-5 py-4">Quantidade</th>
                <th className="px-5 py-4">Observação</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov) => (
                <tr key={mov.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarDataHora(mov.dataMovimentacao)}</td>
                  <td className={`px-5 py-4 font-medium ${mov.tipo === "ENTRADA" ? "text-good" : "text-critical"}`}>
                    {mov.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{mov.motivo}</td>
                  <td className="px-5 py-4 text-ink-secondary">{mov.quantidade}</td>
                  <td className="px-5 py-4 text-ink-secondary">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <EtiquetaProduto
        produtoId={produto.id}
        nome={produto.nome}
        precoVenda={produto.precoVenda}
        aberto={etiquetaAberta}
        onFechar={() => setEtiquetaAberta(false)}
      />
    </main>
  );
}
