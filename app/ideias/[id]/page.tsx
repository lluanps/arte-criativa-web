"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { api, ApiError } from "@/lib/api";
import { estimarMateriasPrimasComChatGPT, sugerirNomeComChatGPT, sugerirVariacoesComChatGPT } from "@/lib/ai-shortcuts";
import { formatarDataHora } from "@/lib/format";
import { IdeiaRequest, IdeiaResponse, StatusIdeia } from "@/types/ideias";
import { ProdutoResponse } from "@/types/estoque";
import { Badge, Button, Card, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { GaleriaFotos } from "@/components/GaleriaFotos";
import { useConfirm } from "@/components/ConfirmProvider";
import { IconStar, IconX } from "@/components/Icon";

const LABEL_STATUS: Record<StatusIdeia, string> = {
  IDEIA_SOLTA: "Ideia solta",
  EM_TESTE: "Em teste",
  VIROU_PRODUTO: "Virou produto",
  DESCARTADA: "Descartada",
};

export default function IdeiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [status, setStatus] = useState<StatusIdeia>("IDEIA_SOLTA");
  const [favorita, setFavorita] = useState(false);
  const [produtoRelacionadoId, setProdutoRelacionadoId] = useState<number | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState("");
  const [fotosUrls, setFotosUrls] = useState<string[]>([]);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [ideia, dadosProdutos] = await Promise.all([
        api.get<IdeiaResponse>(`/ideias/${id}`),
        api.get<ProdutoResponse[]>("/produtos"),
      ]);
      setTitulo(ideia.titulo);
      setCorpo(ideia.corpo ?? "");
      setStatus(ideia.status);
      setFavorita(ideia.favorita);
      setProdutoRelacionadoId(ideia.produtoRelacionadoId ?? "");
      setTags(ideia.tags);
      setFotosUrls(ideia.fotosUrls);
      setAtualizadoEm(ideia.atualizadoEm);
      setProdutos(dadosProdutos);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar ideia");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function adicionarTag() {
    const limpa = novaTag.trim();
    if (!limpa || tags.some((t) => t.toLowerCase() === limpa.toLowerCase())) {
      setNovaTag("");
      return;
    }
    setTags([...tags, limpa]);
    setNovaTag("");
  }

  function removerTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const request: IdeiaRequest = {
        titulo,
        corpo: corpo || null,
        status,
        favorita,
        produtoRelacionadoId: produtoRelacionadoId || null,
        tags,
        fotosUrls,
      };
      const atualizada = await api.put<IdeiaResponse>(`/ideias/${id}`, request);
      setAtualizadoEm(atualizada.atualizadoEm);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar ideia");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const confirmacao = await perguntar({
      titulo: "Excluir essa ideia?",
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
      await api.del(`/ideias/${id}`);
      router.push("/ideias");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir ideia");
      setExcluindo(false);
    }
  }

  function transformarEmProduto() {
    const params = new URLSearchParams({ novaIdeia: "1", nome: titulo });
    if (corpo) params.set("descricao", corpo);
    if (fotosUrls[0]) params.set("fotoUrl", fotosUrls[0]);
    router.push(`/estoque/produtos?${params.toString()}`);
  }

  if (carregando) return <main className="mx-auto max-w-4xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (erro && !titulo)
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <ErrorBanner mensagem={erro} />
      </main>
    );

  const dadosIdeia = { titulo, corpo, tags };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/ideias" className="text-base text-ink-secondary hover:underline">
        ← Ideias
      </Link>
      <PageHeader
        titulo={titulo || "Ideia"}
        descricao={atualizadoEm ? `Atualizada em ${formatarDataHora(atualizadoEm)}` : undefined}
        acao={
          <button
            type="button"
            onClick={() => setFavorita((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-semibold ${favorita ? "text-warning" : "text-ink-secondary hover:text-ink"}`}
          >
            <IconStar className="h-5 w-5" fill={favorita ? "currentColor" : "none"} />
            {favorita ? "Favorita" : "Marcar como favorita"}
          </button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card className="mb-6">
        <form onSubmit={salvar} className="grid gap-5">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusIdeia)}>
                {(Object.keys(LABEL_STATUS) as StatusIdeia[]).map((s) => (
                  <option key={s} value={s}>
                    {LABEL_STATUS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="produtoRelacionadoId">Produto relacionado</Label>
              <Select
                id="produtoRelacionadoId"
                value={produtoRelacionadoId}
                onChange={(e) => setProdutoRelacionadoId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Nenhum</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-base font-medium text-ink-secondary">Anotações</span>
              <button
                type="button"
                onClick={() => setMostrarPreview((v) => !v)}
                className="text-sm font-medium text-ink-secondary hover:underline"
              >
                {mostrarPreview ? "Editar" : "Prévia"}
              </button>
            </div>
            {mostrarPreview ? (
              <div className="markdown-basico min-h-[160px] rounded-lg border border-hairline bg-surface px-4 py-3 text-base">
                {corpo ? (
                  <ReactMarkdown>{corpo}</ReactMarkdown>
                ) : (
                  <p className="text-ink-faint">Nada escrito ainda.</p>
                )}
              </div>
            ) : (
              <textarea
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                rows={7}
                placeholder="Anote os detalhes da ideia... aceita markdown básico (# título, **negrito**, - lista)"
                className="w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            )}
          </div>

          <div>
            <Label>Tags</Label>
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-sm font-medium text-ink-secondary">
                    {tag}
                    <button type="button" onClick={() => removerTag(tag)} aria-label={`Remover tag ${tag}`}>
                      <IconX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag e apertar Enter"
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={adicionarTag}>
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <Label>Fotos</Label>
            <GaleriaFotos urls={fotosUrls} onChange={setFotosUrls} />
          </div>

          <div>
            <p className="mb-2 text-base font-medium text-ink-secondary">✨ Ajuda da IA (abre o ChatGPT com o contexto já pronto)</p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-ink-secondary">
              <button type="button" onClick={() => sugerirVariacoesComChatGPT(dadosIdeia)} className="hover:underline">
                Sugerir variações
              </button>
              <button type="button" onClick={() => estimarMateriasPrimasComChatGPT(dadosIdeia)} className="hover:underline">
                Estimar matérias-primas
              </button>
              <button type="button" onClick={() => sugerirNomeComChatGPT(dadosIdeia)} className="hover:underline">
                Sugerir nome
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <div className="flex items-center gap-3">
              <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Excluir"}
              </Button>
              <Button type="button" variant="secondary" onClick={transformarEmProduto} disabled={!titulo.trim()}>
                Transformar em produto →
              </Button>
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Card>

      {status === "VIROU_PRODUTO" && (
        <p className="text-sm text-ink-faint">
          <Badge tone="success">Virou produto</Badge> Se ainda não cadastrou, use “Transformar em produto” acima.
        </p>
      )}
    </main>
  );
}
