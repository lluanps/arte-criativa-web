"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { IdeiaRequest, IdeiaResponse, StatusIdeia } from "@/types/ideias";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from "@/components/ui";
import { IconStar } from "@/components/Icon";

const LABEL_STATUS: Record<StatusIdeia, string> = {
  IDEIA_SOLTA: "Ideia solta",
  EM_TESTE: "Em teste",
  VIROU_PRODUTO: "Virou produto",
  DESCARTADA: "Descartada",
};

const TOM_STATUS: Record<StatusIdeia, "default" | "success" | "danger" | "warning"> = {
  IDEIA_SOLTA: "default",
  EM_TESTE: "warning",
  VIROU_PRODUTO: "success",
  DESCARTADA: "danger",
};

const ABAS: (StatusIdeia | "TODAS")[] = ["TODAS", "IDEIA_SOLTA", "EM_TESTE", "VIROU_PRODUTO", "DESCARTADA"];

function resumo(corpo: string | null): string {
  if (!corpo) return "";
  // Tira a marcação de markdown mais comum só pra mostrar um trecho legível no card.
  const semMarkdown = corpo.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim();
  return semMarkdown.length > 140 ? `${semMarkdown.slice(0, 140)}…` : semMarkdown;
}

export default function IdeiasPage() {
  const [ideias, setIdeias] = useState<IdeiaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [aba, setAba] = useState<StatusIdeia | "TODAS">("TODAS");
  const [buscaTag, setBuscaTag] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [tituloNovo, setTituloNovo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setIdeias(await api.get<IdeiaResponse[]>("/ideias"));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar ideias");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!tituloNovo.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const request: IdeiaRequest = { titulo: tituloNovo.trim() };
      await api.post("/ideias", request);
      setTituloNovo("");
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao criar ideia");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarFavorita(ideia: IdeiaResponse) {
    try {
      const request: IdeiaRequest = { ...ideia, favorita: !ideia.favorita };
      await api.put(`/ideias/${ideia.id}`, request);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao atualizar ideia");
    }
  }

  const ideiasFiltradas = useMemo(() => {
    const tagBusca = buscaTag.trim().toLowerCase();
    return ideias.filter((ideia) => {
      if (aba !== "TODAS" && ideia.status !== aba) return false;
      if (tagBusca && !ideia.tags.some((t) => t.toLowerCase().includes(tagBusca))) return false;
      return true;
    });
  }, [ideias, aba, buscaTag]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Ideias"
        descricao="Caderno de inspiração — anote, junte fotos e transforme em produto quando fizer sentido."
        acao={
          <Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "+ Nova ideia"}</Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="flex flex-wrap gap-3">
            <Input
              autoFocus
              placeholder="Título da ideia — ex: Vela de cera de soja com essência de baunilha"
              value={tituloNovo}
              onChange={(e) => setTituloNovo(e.target.value)}
              className="flex-1 min-w-[240px]"
            />
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Anotar ideia"}
            </Button>
          </form>
          <p className="mt-2 text-sm text-ink-faint">Capture rápido — fotos, tags e detalhes você adiciona na tela da ideia.</p>
        </Card>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ABAS.map((status) => (
            <button
              key={status}
              onClick={() => setAba(status)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                aba === status ? "bg-accent text-accent-ink" : "border border-hairline text-ink-secondary hover:bg-surface-hover"
              }`}
            >
              {status === "TODAS" ? "Todas" : LABEL_STATUS[status]}
            </button>
          ))}
        </div>
        <Input
          placeholder="Filtrar por tag..."
          value={buscaTag}
          onChange={(e) => setBuscaTag(e.target.value)}
          className="ml-auto w-full sm:w-56"
        />
      </div>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : ideiasFiltradas.length === 0 ? (
        <EmptyState
          mensagem={ideias.length === 0 ? "Nenhuma ideia anotada ainda." : "Nenhuma ideia bate com esse filtro."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideiasFiltradas.map((ideia) => (
            <Card key={ideia.id} className="flex flex-col p-0 overflow-hidden">
              {ideia.fotosUrls[0] && (
                // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica (Blob ou link externo)
                <img src={ideia.fotosUrls[0]} alt="" className="h-36 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link href={`/ideias/${ideia.id}`} className="font-semibold text-ink hover:underline">
                    {ideia.titulo}
                  </Link>
                  <button
                    onClick={() => alternarFavorita(ideia)}
                    aria-label={ideia.favorita ? "Desmarcar favorita" : "Marcar como favorita"}
                    className={`shrink-0 ${ideia.favorita ? "text-warning" : "text-ink-faint hover:text-ink-secondary"}`}
                  >
                    <IconStar className="h-5 w-5" fill={ideia.favorita ? "currentColor" : "none"} />
                  </button>
                </div>
                {resumo(ideia.corpo) && <p className="mb-3 text-sm text-ink-secondary">{resumo(ideia.corpo)}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                  <Badge tone={TOM_STATUS[ideia.status]}>{LABEL_STATUS[ideia.status]}</Badge>
                  {ideia.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
