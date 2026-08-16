"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { dataLocalISO, formatarData, formatarMoeda } from "@/lib/format";
import { ContaRequest, ContaResponse, StatusConta, TipoConta } from "@/types/financeiro";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";

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
  const [contas, setContas] = useState<ContaResponse[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | "">("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState<TipoConta>("PAGAR");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState(dataLocalISO());
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
    setMostrarForm(false);
    setErrosCampos({});
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});
    const request: ContaRequest = { tipo, descricao, valor, vencimento };
    setSalvando(true);
    try {
      await api.post("/contas", request);
      resetarForm();
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro ao criar conta");
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
    if (!confirm(`Excluir a conta "${conta.descricao}"?`)) return;
    setErro(null);
    try {
      await api.del(`/contas/${conta.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir conta");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/financeiro" className="text-sm text-neutral-500 hover:underline">
        ← Financeiro
      </Link>
      <PageHeader
        titulo="Contas a pagar / receber"
        acao={<Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Nova conta"}</Button>}
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={criar} className="grid gap-4 sm:grid-cols-2">
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
              {errosCampos.descricao && <p className="mt-1 text-xs text-red-600">{errosCampos.descricao}</p>}
            </div>
            <div>
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
              {errosCampos.valor && <p className="mt-1 text-xs text-red-600">{errosCampos.valor}</p>}
            </div>
            <div>
              <Label htmlFor="vencimento">Vencimento *</Label>
              <Input id="vencimento" type="date" required value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar conta"}
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
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filtroTipo === opcao ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {opcao === "" ? "Todas" : opcao === "PAGAR" ? "A pagar" : "A receber"}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando...</p>
      ) : contas.length === 0 ? (
        <EmptyState mensagem="Nenhuma conta cadastrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-600">{formatarData(c.vencimento)}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.tipo === "PAGAR" ? "A pagar" : "A receber"}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{c.descricao}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatarMoeda(c.valor)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={CORES_STATUS[c.status]}>{LABEL_STATUS[c.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status !== "PAGO" && (
                      <button onClick={() => marcarComoPaga(c)} className="mr-3 text-neutral-600 hover:underline">
                        Marcar como paga
                      </button>
                    )}
                    <button onClick={() => excluir(c)} className="text-red-600 hover:underline">
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
