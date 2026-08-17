"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ProdutoResponse } from "@/types/estoque";
import { TutorialPassoRequest, TutorialRequest, TutorialResponse } from "@/types/tutoriais";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

interface LinhaPasso {
  ordem: number;
  titulo: string;
  descricao: string;
  midiaUrl: string;
}

function passoVazio(ordem: number): LinhaPasso {
  return { ordem, titulo: "", descricao: "", midiaUrl: "" };
}

export default function TutoriaisPage() {
  const [tutoriais, setTutoriais] = useState<TutorialResponse[]>([]);
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [produtoRelacionadoId, setProdutoRelacionadoId] = useState<number | "">("");
  const [passos, setPassos] = useState<LinhaPasso[]>([passoVazio(1)]);
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [t, p] = await Promise.all([
        api.get<TutorialResponse[]>("/tutoriais"),
        api.get<ProdutoResponse[]>("/produtos"),
      ]);
      setTutoriais(t);
      setProdutos(p);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar tutoriais");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarPasso(index: number, patch: Partial<LinhaPasso>) {
    setPassos((atual) => atual.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function resetarForm() {
    setTitulo("");
    setCategoria("");
    setProdutoRelacionadoId("");
    setPassos([passoVazio(1)]);
    setMostrarForm(false);
    setErrosCampos({});
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    const passosValidos: TutorialPassoRequest[] = passos
      .filter((p) => p.titulo.trim() !== "")
      .map((p) => ({
        ordem: p.ordem,
        titulo: p.titulo,
        descricao: p.descricao || null,
        midiaUrl: p.midiaUrl || null,
      }));

    if (passosValidos.length === 0) {
      setErro("Adicione ao menos um passo com título.");
      return;
    }

    const request: TutorialRequest = {
      titulo,
      categoria: categoria || null,
      produtoRelacionadoId: produtoRelacionadoId || null,
      passos: passosValidos,
    };

    setSalvando(true);
    try {
      await api.post("/tutoriais", request);
      resetarForm();
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar tutorial");
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        titulo="Tutoriais"
        descricao="Conteúdo passo a passo de produção, opcionalmente ligado a um produto."
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Novo tutorial"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                {errosCampos.titulo && <p className="mt-1 text-xs text-critical">{errosCampos.titulo}</p>}
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
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
              <Label>Passos *</Label>
              <div className="grid gap-3">
                {passos.map((passo, index) => (
                  <div key={index} className="grid grid-cols-[70px_1fr_auto] items-start gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={passo.ordem}
                      onChange={(e) => atualizarPasso(index, { ordem: Number(e.target.value) })}
                    />
                    <div className="grid gap-2">
                      <Input
                        placeholder="Título do passo"
                        value={passo.titulo}
                        onChange={(e) => atualizarPasso(index, { titulo: e.target.value })}
                      />
                      <Input
                        placeholder="Descrição (opcional)"
                        value={passo.descricao}
                        onChange={(e) => atualizarPasso(index, { descricao: e.target.value })}
                      />
                      <Input
                        placeholder="URL de mídia (opcional)"
                        value={passo.midiaUrl}
                        onChange={(e) => atualizarPasso(index, { midiaUrl: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPassos((atual) => atual.filter((_, i) => i !== index))}
                      disabled={passos.length === 1}
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
                onClick={() => setPassos((a) => [...a, passoVazio(a.length + 1)])}
              >
                + Adicionar passo
              </Button>
            </div>

            <div>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar tutorial"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-sm text-ink-secondary">Carregando...</p>
      ) : tutoriais.length === 0 ? (
        <EmptyState mensagem="Nenhum tutorial cadastrado ainda." />
      ) : (
        <div className="grid gap-3">
          {tutoriais.map((t) => (
            <Link
              key={t.id}
              href={`/tutoriais/${t.id}`}
              className="block rounded-lg border border-hairline bg-surface p-4 shadow-sm transition-colors hover:bg-surface-hover hover:bg-surface-hover"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">{t.titulo}</h3>
                <span className="text-xs text-ink-faint">{t.passos.length} passo(s)</span>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">
                {t.categoria ?? "Sem categoria"}
                {t.produtoRelacionadoNome && ` · ${t.produtoRelacionadoNome}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
