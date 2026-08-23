"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { ContaParceladaRequest, ContaRequest, ContaResponse, StatusConta, TipoConta } from "@/types/financeiro";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmProvider";

const CORES_STATUS: Record<StatusConta, "default" | "success" | "danger" | "warning"> = {
  PENDENTE: "warning",
  PAGO: "success",
  ATRASADO: "danger",
};

const LABEL_STATUS: Record<StatusConta, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
};

export default function ContasPage() {
  const perguntar = useConfirm();
  const [contas, setContas] = useState<ContaResponse[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | "">("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoConta>("PAGAR");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState(dataLocalISO());
  const [parcelado, setParcelado] = useState(false);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(2);
  const [salvando, setSalvando] = useState(false);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  async function carregar(tipoFiltro = filtroTipo) {
    setCarregando(true);
    setErro(null);
    try {
      const query = tipoFiltro ? `?tipo=${tipoFiltro}` : "";
      const dados = await api.get<ContaResponse[]>(`/contas${query}`);
      setContas(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar contas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mudarFiltro(novoTipo: TipoConta | "") {
    setFiltroTipo(novoTipo);
    carregar(novoTipo);
  }

  function resetarForm() {
    setTipo("PAGAR");
    setDescricao("");
    setValor(0);
    setVencimento(dataLocalISO());
    setParcelado(false);
    setQuantidadeParcelas(2);
    setMostrarForm(false);
    setEditandoId(null);
    setErrosCampos({});
  }

  function iniciarEdicao(conta: ContaResponse) {
    setEditandoId(conta.id);
    setTipo(conta.tipo);
    setDescricao(conta.descricao);
    setValor(conta.valor);
    setVencimento(conta.vencimento);
    setParcelado(false);
    setMostrarForm(true);
    setErrosCampos({});
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});
    setSalvando(true);
    try {
      if (editandoId !== null) {
        const request: ContaRequest = { tipo, descricao, valor, vencimento };
        await api.put(`/contas/${editandoId}`, request);
      } else if (parcelado) {
        const request: ContaParceladaRequest = {
          tipo,
          descricao,
          valorTotal: valor,
          quantidadeParcelas,
          primeiroVencimento: vencimento,
        };
        await api.post("/contas/parceladas", request);
      } else {
        const request: ContaRequest = { tipo, descricao, valor, vencimento };
        await api.post("/contas", request);
      }
      resetarForm();
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro(editandoId !== null ? "Erro ao salvar conta" : "Erro ao criar conta");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoPaga(conta: ContaResponse) {
    setErro(null);
    try {
      await api.post(`/contas/${conta.id}/pagar`, {});
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao marcar conta como paga");
    }
  }

  async function excluir(conta: ContaResponse) {
    const confirmacao = await perguntar({
      titulo: `Excluir a conta "${conta.descricao}"?`,
      tone: "danger",
      acoes: [
        { id: "cancelar", label: "Cancelar", variant: "secondary" },
        { id: "excluir", label: "Excluir", variant: "danger" },
      ],
    });
    if (confirmacao !== "excluir") return;

    setErro(null);
    try {
      await api.del(`/contas/${conta.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir conta");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/financeiro" className="text-base text-ink-secondary hover:underline">
        ← Financeiro
      </Link>
      <PageHeader
        titulo="Contas a pagar / receber"
        acao={
          <Button onClick={() => (mostrarForm ? resetarForm() : setMostrarForm(true))}>
            {mostrarForm ? "Cancelar" : "Nova conta"}
          </Button>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">{editandoId !== null ? "Editar conta" : "Nova conta"}</h2>
          <form onSubmit={salvar} className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoConta)}>
                <option value="PAGAR">A pagar</option>
                <option value="RECEBER">A receber</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input id="descricao" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              {errosCampos.descricao && <p className="mt-1 text-sm text-critical">{errosCampos.descricao}</p>}
              {parcelado && (
                <p className="mt-1 text-sm text-ink-secondary">
                  Cada parcela recebe automaticamente "(parcela X/{quantidadeParcelas})" no final da descrição.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="valor">{parcelado ? "Valor total *" : "Valor *"}</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
              {errosCampos.valor && <p className="mt-1 text-sm text-critical">{errosCampos.valor}</p>}
              {errosCampos.valorTotal && <p className="mt-1 text-sm text-critical">{errosCampos.valorTotal}</p>}
              {parcelado && quantidadeParcelas > 0 && valor > 0 && (
                <p className="mt-1 text-sm text-ink-secondary">
                  ≈ {formatarMoeda(valor / quantidadeParcelas)} por parcela.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="vencimento">{parcelado ? "Vencimento da 1ª parcela *" : "Vencimento *"}</Label>
              <Input id="vencimento" type="date" required value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
              {parcelado && (
                <p className="mt-1 text-sm text-ink-secondary">As demais vencem no mesmo dia, um mês depois cada.</p>
              )}
            </div>
            {editandoId === null && (
              <div className={parcelado ? undefined : "sm:col-span-2"}>
                <label className="flex h-[46px] items-center gap-2 text-base text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={parcelado}
                    onChange={(e) => setParcelado(e.target.checked)}
                    className="h-4 w-4 rounded border-hairline"
                  />
                  Parcelado
                </label>
              </div>
            )}
            {parcelado && editandoId === null && (
              <div>
                <Label htmlFor="quantidadeParcelas">Quantidade de parcelas *</Label>
                <Input
                  id="quantidadeParcelas"
                  type="number"
                  step="1"
                  min="2"
                  required
                  value={quantidadeParcelas}
                  onChange={(e) => setQuantidadeParcelas(Number(e.target.value))}
                />
                {errosCampos.quantidadeParcelas && (
                  <p className="mt-1 text-sm text-critical">{errosCampos.quantidadeParcelas}</p>
                )}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando
                  ? "Salvando..."
                  : editandoId !== null
                    ? "Salvar alterações"
                    : parcelado
                      ? `Salvar em ${quantidadeParcelas}x`
                      : "Salvar conta"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex gap-2">
        {(["", "PAGAR", "RECEBER"] as const).map((opcao) => (
          <button
            key={opcao || "todas"}
            onClick={() => mudarFiltro(opcao)}
            className={`rounded-md px-4 py-2 text-base font-medium ${
              filtroTipo === opcao ? "bg-accent text-accent-ink" : "border border-hairline text-ink-secondary hover:bg-surface-hover"
            }`}
          >
            {opcao === "" ? "Todas" : opcao === "PAGAR" ? "A pagar" : "A receber"}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : contas.length === 0 ? (
        <EmptyState mensagem="Nenhuma conta cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Vencimento</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Descrição</th>
                <th className="px-5 py-4">Valor</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarData(c.vencimento)}</td>
                  <td className="px-5 py-4 text-ink-secondary">{c.tipo === "PAGAR" ? "A pagar" : "A receber"}</td>
                  <td className="px-5 py-4 font-medium text-ink">
                    {c.descricao}
                    {c.totalParcelas !== null && (
                      <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-sm font-normal text-ink-secondary">
                        {c.numeroParcela}/{c.totalParcelas}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{formatarMoeda(c.valor)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={CORES_STATUS[c.status]}>{LABEL_STATUS[c.status]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {c.status !== "PAGO" && (
                      <button onClick={() => marcarComoPaga(c)} className="mr-3 text-ink-secondary hover:underline">
                        Marcar como paga
                      </button>
                    )}
                    <button onClick={() => iniciarEdicao(c)} className="mr-3 text-ink-secondary hover:underline">
                      Editar
                    </button>
                    <button onClick={() => excluir(c)} className="text-critical hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
