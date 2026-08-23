"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import {
  arredondarQuantidade,
  MateriaPrimaAtualizacaoRequest,
  MateriaPrimaResponse,
  MotivoMovimentacaoMateriaPrima,
  MovimentacaoMateriaPrimaRequest,
  MovimentacaoResponse,
  stepQuantidade,
  TipoMovimentacao,
  UNIDADES_MEDIDA,
} from "@/types/estoque";
import { CategoriaMateriaPrimaResponse } from "@/types/cadastros";
import { Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";
import { SelectComCriacao } from "@/components/SelectComCriacao";

const MOTIVOS: MotivoMovimentacaoMateriaPrima[] = ["COMPRA", "PRODUCAO", "AJUSTE", "PERDA"];

export default function MateriaPrimaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const perguntar = useConfirm();

  const [materiaPrima, setMateriaPrima] = useState<MateriaPrimaResponse | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMateriaPrimaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<MateriaPrimaAtualizacaoRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [movForm, setMovForm] = useState<MovimentacaoMateriaPrimaRequest>({
    tipo: "ENTRADA",
    motivo: "COMPRA",
    quantidade: 0,
    valorPago: null,
    observacao: "",
  });
  const [registrandoMov, setRegistrandoMov] = useState(false);
  const [erroMov, setErroMov] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [mp, movs, cats] = await Promise.all([
        api.get<MateriaPrimaResponse>(`/materias-primas/${id}`),
        api.get<MovimentacaoResponse[]>(`/materias-primas/${id}/movimentacoes`),
        api.get<CategoriaMateriaPrimaResponse[]>("/categorias-materia-prima"),
      ]);
      setMateriaPrima(mp);
      setForm({
        nome: mp.nome,
        categoriaId: mp.categoriaId,
        unidadeMedida: mp.unidadeMedida,
        estoqueMinimo: mp.estoqueMinimo,
        fornecedor: mp.fornecedor ?? "",
      });
      setMovimentacoes(movs);
      setCategorias(cats);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar matéria-prima");
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
    setErrosCampos({});
    try {
      const atualizado = await api.put<MateriaPrimaResponse>(`/materias-primas/${id}`, form);
      setMateriaPrima(atualizado);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao salvar matéria-prima");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!materiaPrima) return;
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

    setExcluindo(true);
    try {
      await api.del(`/materias-primas/${materiaPrima.id}`);
      router.push("/estoque/materias-primas");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        await perguntar({
          titulo: "Não é possível excluir",
          descricao: e.message,
          tone: "warning",
          acoes: [{ id: "entendi", label: "Entendi", variant: "primary" }],
        });
      } else {
        setErro(e instanceof ApiError ? e.message : "Erro ao excluir matéria-prima");
      }
      setExcluindo(false);
    }
  }

  async function registrarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    setRegistrandoMov(true);
    setErroMov(null);
    try {
      await api.post(`/materias-primas/${id}/movimentacoes`, movForm);
      setMovForm({ tipo: "ENTRADA", motivo: "COMPRA", quantidade: 0, valorPago: null, observacao: "" });
      await carregar();
    } catch (e) {
      setErroMov(e instanceof ApiError ? e.message : "Erro ao registrar movimentação");
    } finally {
      setRegistrandoMov(false);
    }
  }

  if (carregando) return <main className="mx-auto max-w-6xl px-6 py-10 text-base text-ink-secondary">Carregando...</main>;
  if (!materiaPrima || !form)
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ErrorBanner mensagem={erro ?? "Matéria-prima não encontrada"} />
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/estoque/materias-primas" className="text-base text-ink-secondary hover:underline">
        ← Matérias-primas
      </Link>
      <PageHeader
        titulo={materiaPrima.nome}
        descricao={`Estoque atual: ${materiaPrima.estoqueAtual} ${materiaPrima.unidadeMedida} · Custo unitário: ${formatarMoeda(materiaPrima.custoUnitario)}`}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Editar matéria-prima</h2>
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
                A ficha técnica converte automaticamente se a receita usar uma unidade diferente.
              </p>
            </div>
            <div>
              <Label htmlFor="custoUnitario">Custo unitário</Label>
              <Input id="custoUnitario" value={formatarMoeda(materiaPrima.custoUnitario)} disabled className="opacity-70" />
              <p className="mt-1 text-sm text-ink-secondary">
                Só muda via "Registrar movimentação" (Entrada com valor pago), ao lado — assim toda mudança de custo
                fica rastreada e vira despesa no Financeiro.
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
              <Input id="fornecedor" value={form.fornecedor ?? ""} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div className="flex items-center justify-between border-t border-hairline pt-4 sm:col-span-2">
              <Button type="button" variant="danger" onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Excluir matéria-prima"}
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
                  onChange={(e) => {
                    const tipo = e.target.value as TipoMovimentacao;
                    setMovForm({ ...movForm, tipo, valorPago: tipo === "ENTRADA" ? movForm.valorPago : null });
                  }}
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
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value as MotivoMovimentacaoMateriaPrima })}
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
                step={stepQuantidade(materiaPrima.unidadeMedida)}
                min="0"
                required
                value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: arredondarQuantidade(Number(e.target.value), materiaPrima.unidadeMedida) })}
              />
            </div>
            {movForm.tipo === "ENTRADA" && (
              <div>
                <Label htmlFor="valorPago">Valor pago no total (opcional)</Label>
                <Input
                  id="valorPago"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ex: 100,00 por 3kg"
                  value={movForm.valorPago ?? ""}
                  onChange={(e) =>
                    setMovForm({ ...movForm, valorPago: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
                <p className="mt-1 text-sm text-ink-secondary">
                  {movForm.valorPago && movForm.quantidade > 0
                    ? `≈ ${formatarMoeda(movForm.valorPago / movForm.quantidade)} por ${materiaPrima.unidadeMedida} — vira o novo custo unitário (média ponderada com o estoque atual) e uma despesa em Financeiro.`
                    : "Preenche pra o sistema calcular o custo unitário sozinho (valor ÷ quantidade) em vez de você editar \"Custo unitário\" na mão. Sem preencher aqui, essa entrada NÃO aparece como despesa no Financeiro — só entra no estoque."}
                </p>
              </div>
            )}
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
                <th className="px-5 py-4">Valor pago</th>
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
                  <td className="px-5 py-4 text-ink-secondary">
                    {mov.valorPago !== null
                      ? `${formatarMoeda(mov.valorPago)} (${formatarMoeda(mov.custoUnitarioApurado ?? 0)}/${materiaPrima.unidadeMedida})`
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
