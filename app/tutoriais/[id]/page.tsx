"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ProdutoResponse } from "@/types/estoque";
import { TutorialPassoRequest, TutorialRequest, TutorialResponse } from "@/types/tutoriais";
import { Button, Card, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

interface LinhaPasso {
  ordem: number;
  titulo: string;
  descricao: string;
  midiaUrl: string;
}

export default function TutorialDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [produtoRelacionadoId, setProdutoRelacionadoId] = useState<number | "">("");
  const [passos, setPassos] = useState<LinhaPasso[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [tutorial, p] = await Promise.all([
        api.get<TutorialResponse>(`/tutoriais/${id}`),
        api.get<ProdutoResponse[]>("/produtos"),
      ]);
      setProdutos(p);
      setTitulo(tutorial.titulo);
      setCategoria(tutorial.categoria ?? "");
      setProdutoRelacionadoId(tutorial.produtoRelacionadoId ?? "");
      setPassos(
        tutorial.passos.map((passo) => ({
          ordem: passo.ordem,
          titulo: passo.titulo,
          descricao: passo.descricao ?? "",
          midiaUrl: passo.midiaUrl ?? "",
        }))
      );
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar tutorial");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function atualizarPasso(index: number, patch: Partial<LinhaPasso>) {
    setPassos((atual) => atual.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    const passosValidos: TutorialPassoRequest[] = passos
      .filter((p) => p.titulo.trim() !== "")
      .map((p) => ({ ordem: p.ordem, titulo: p.titulo, descricao: p.descricao || null, midiaUrl: p.midiaUrl || null }));

    if (passosValidos.length === 0) {
      setErro("Mantenha ao menos um passo com título.");
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
      await api.put(`/tutoriais/${id}`, request);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao salvar tutorial");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir esse tutorial? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    setErro(null);
    try {
      await api.del(`/tutoriais/${id}`);
      router.push("/tutoriais");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir tutorial");
      setExcluindo(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-5xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/tutoriais" className="text-base text-ink-secondary hover:underline">
        ← Tutoriais
      </Link>
      <PageHeader titulo={titulo || "Tutorial"} />

      {erro && <ErrorBanner mensagem={erro} />}

      <Card>
        <form onSubmit={salvar} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              {errosCampos.titulo && <p className="mt-1 text-sm text-critical">{errosCampos.titulo}</p>}
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
              onClick={() => setPassos((a) => [...a, { ordem: a.length + 1, titulo: "", descricao: "", midiaUrl: "" }])}
            >
              + Adicionar passo
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir tutorial"}
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
