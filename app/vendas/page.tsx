"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import { ProdutoResponse } from "@/types/estoque";
import { VendaRequest, VendaResponse } from "@/types/vendas";
import { CanalVendaResponse, ClienteResponse } from "@/types/cadastros";
import { ReceitaResponse } from "@/types/producao";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, PageHeader, Select } from "@/components/ui";
import { SelectComCriacao } from "@/components/SelectComCriacao";
import { IconEye, IconEyeOff } from "@/components/Icon";

interface LinhaItem {
  produtoId: number | "";
  quantidade: number;
  precoUnitario: number;
}

const LINHA_VAZIA: LinhaItem = { produtoId: "", quantidade: 1, precoUnitario: 0 };

/**
 * Mesma faixa usada nas fichas técnicas (ver app/receitas/fichas) — abaixo de 15% mal
 * cobre imprevisto, 15-40% é sustentável mas apertado, acima de 40% é saudável. Reaproveitada
 * aqui pra avisar (sem bloquear) quando um desconto empurra a margem de uma linha pra baixo.
 */
function tomDaMargem(percentual: number | null): "default" | "success" | "warning" | "danger" {
  if (percentual === null) return "default";
  if (percentual < 15) return "danger";
  if (percentual < 40) return "warning";
  return "success";
}

/** Cor de texto pras mesmas 3 faixas de tomDaMargem — usado onde a margem aparece só
 * como texto colorido (sem o número/badge), pra manter o alerta visual de 3 níveis. */
function corDoTexto(tom: ReturnType<typeof tomDaMargem>): string {
  return { default: "text-ink-secondary", success: "text-good", warning: "text-warning", danger: "text-critical" }[tom];
}

function arredondar2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [canais, setCanais] = useState<CanalVendaResponse[]>([]);
  /** custo (ficha técnica) por unidade, por produtoId — produto sem ficha técnica não
   * entra aqui, então nenhuma margem é estimada pra ele (não dá pra saber o custo). */
  const [custosPorProduto, setCustosPorProduto] = useState<Record<number, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [canalId, setCanalId] = useState<number | "">("");
  const [itens, setItens] = useState<LinhaItem[]>([{ ...LINHA_VAZIA }]);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [salvando, setSalvando] = useState(false);
  /** Lucro/custo/margem são informação sensível (não é pra cliente ver na tela durante
   * a negociação) — por isso vêm escondidos por padrão, nunca persistido (sempre volta
   * a esconder ao recarregar a página), só revelados por esse toggle explícito. */
  const [mostrarLucro, setMostrarLucro] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [dadosVendas, dadosProdutos, dadosClientes, dadosCanais, dadosReceitas] = await Promise.all([
        api.get<VendaResponse[]>("/vendas"),
        api.get<ProdutoResponse[]>("/produtos"),
        api.get<ClienteResponse[]>("/clientes"),
        api.get<CanalVendaResponse[]>("/canais-venda"),
        api.get<ReceitaResponse[]>("/receitas"),
      ]);
      setVendas(dadosVendas);
      setProdutos(dadosProdutos.filter((p) => p.ativo));
      setClientes(dadosClientes);
      setCanais(dadosCanais);
      setCustosPorProduto(Object.fromEntries(dadosReceitas.map((r) => [r.produtoId, r.custoTotal])));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar vendas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarLinha(index: number, patch: Partial<LinhaItem>) {
    setItens((atual) => atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha)));
  }

  function selecionarProduto(index: number, produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    atualizarLinha(index, { produtoId, precoUnitario: produto?.precoVenda ?? 0 });
  }

  function adicionarLinha() {
    setItens((atual) => [...atual, { ...LINHA_VAZIA }]);
  }

  function removerLinha(index: number) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  const totalEstimado = itens.reduce((soma, linha) => soma + linha.quantidade * linha.precoUnitario, 0);

  /** Preço de tabela do produto da linha (0 se nenhum produto selecionado) — referência
   * pra mostrar quanto de desconto o preço unitário editado representa. */
  function precoTabela(linha: LinhaItem): number {
    return produtos.find((p) => p.id === linha.produtoId)?.precoVenda ?? 0;
  }

  /** Aplica o desconto geral ao preço de tabela de cada linha com produto selecionado,
   * sobrescrevendo o preço unitário atual. Depois disso o usuário pode ajustar o preço
   * de uma linha específica na mão sem afetar as outras — é um "aplicar uma vez", não
   * uma fórmula amarrada, então não atrapalha ajuste manual por item. */
  function aplicarDescontoGeral() {
    setItens((atual) =>
      atual.map((linha) =>
        linha.produtoId === "" ? linha : { ...linha, precoUnitario: arredondar2(precoTabela(linha) * (1 - descontoGeral / 100)) }
      )
    );
  }

  /** Custo unitário conhecido da linha (via ficha técnica), ou null se o produto não
   * tiver ficha técnica cadastrada — não dá pra estimar custo/lucro nesse caso. */
  function custoUnitarioLinha(linha: LinhaItem): number | null {
    if (linha.produtoId === "") return null;
    return custosPorProduto[linha.produtoId] ?? null;
  }

  /** Margem percentual da linha com o preço unitário atual, ou null se custo desconhecido. */
  function margemPercentualLinha(linha: LinhaItem): number | null {
    const custo = custoUnitarioLinha(linha);
    if (custo === null || linha.precoUnitario <= 0) return null;
    return Math.round(((linha.precoUnitario - custo) / linha.precoUnitario) * 1000) / 10;
  }

  /** Custo, lucro e margem % do pedido inteiro, só somando linhas com custo conhecido
   * (produto sem ficha técnica não entra na conta) — null se nenhuma linha tem custo
   * conhecido, pra não fingir uma estimativa que não existe. Não usado no texto do
   * orçamento (ver textoOrcamento) — essa informação nunca vai pro cliente. */
  const resumoPedido = (() => {
    let receita = 0;
    let custo = 0;
    let algumaComCusto = false;
    for (const linha of itens) {
      const custoLinha = custoUnitarioLinha(linha);
      if (custoLinha === null) continue;
      algumaComCusto = true;
      receita += linha.quantidade * linha.precoUnitario;
      custo += linha.quantidade * custoLinha;
    }
    if (!algumaComCusto) return null;
    const lucro = arredondar2(receita - custo);
    const percentual = receita > 0 ? Math.round((lucro / receita) * 1000) / 10 : null;
    return { custo: arredondar2(custo), lucro, percentual };
  })();

  function nomeProduto(linha: LinhaItem): string {
    return produtos.find((p) => p.id === linha.produtoId)?.nome ?? "Produto";
  }

  function textoOrcamento(): string {
    const linhas = itens.filter((l) => l.produtoId !== "" && l.quantidade > 0);
    const partes: string[] = [`Orçamento${clienteId ? " – " + (clientes.find((c) => c.id === clienteId)?.nome ?? "") : ""}`, ""];
    for (const linha of linhas) {
      const tabela = precoTabela(linha);
      const subtotal = linha.quantidade * linha.precoUnitario;
      const comDesconto = tabela > 0 && linha.precoUnitario < tabela;
      const descontoPct = comDesconto ? Math.round((1 - linha.precoUnitario / tabela) * 100) : 0;
      partes.push(
        `- ${linha.quantidade}x ${nomeProduto(linha)} — ${formatarMoeda(linha.precoUnitario)} cada` +
          (comDesconto ? ` (de ${formatarMoeda(tabela)}, -${descontoPct}%)` : "") +
          ` = ${formatarMoeda(subtotal)}`
      );
    }
    partes.push("", `Total: ${formatarMoeda(totalEstimado)}`);
    return partes.join("\n");
  }

  /** Telefone do cliente (se tiver) normalizado pro formato que o WhatsApp espera —
   * só dígitos, com DDI 55 na frente quando o número não tiver DDI (11 dígitos ou
   * menos = DDD + número, sem código de país). */
  function telefoneWhatsApp(): string | null {
    const cliente = clientes.find((c) => c.id === clienteId);
    const digitos = cliente?.telefone?.replace(/\D/g, "") ?? "";
    if (digitos === "") return null;
    return digitos.length <= 11 ? `55${digitos}` : digitos;
  }

  /** Abre o WhatsApp com o texto do orçamento pré-preenchido — pro número do cliente
   * quando cadastrado, ou deixando o usuário escolher o contato quando não. O texto
   * usado aqui (textoOrcamento) nunca inclui custo/lucro/margem — só o que o cliente
   * já veria numa negociação normal (produto, quantidade, preço, total). Também copia
   * pro clipboard como reforço silencioso, caso o pré-preenchimento falhe no navegador. */
  function enviarOrcamentoNoWhatsApp() {
    const texto = textoOrcamento();
    navigator.clipboard.writeText(texto).catch(() => {});
    const telefone = telefoneWhatsApp();
    const url = telefone
      ? `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function resetarForm() {
    setClienteId("");
    setCanalId("");
    setItens([{ ...LINHA_VAZIA }]);
    setDescontoGeral(0);
    setMostrarForm(false);
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const itensValidos = itens.filter((linha) => linha.produtoId !== "" && linha.quantidade > 0);
    if (itensValidos.length === 0) {
      setErro("Adicione ao menos um item com produto e quantidade válidos.");
      return;
    }

    const request: VendaRequest = {
      clienteId: clienteId || null,
      canalId: canalId || null,
      itens: itensValidos.map((linha) => ({
        produtoId: linha.produtoId as number,
        quantidade: linha.quantidade,
        precoUnitario: linha.precoUnitario,
      })),
    };

    setSalvando(true);
    try {
      await api.post("/vendas", request);
      resetarForm();
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao registrar venda");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        titulo="Vendas"
        descricao="Pedidos que dão baixa no estoque e geram lançamento financeiro."
        acao={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/vendas/clientes" className="text-base font-semibold text-ink-secondary hover:underline">
              Clientes
            </Link>
            <Link href="/vendas/canais" className="text-base font-semibold text-ink-secondary hover:underline">
              Canais
            </Link>
            <Link href="/vendas/relatorio" className="text-base font-semibold text-ink-secondary hover:underline">
              Relatório
            </Link>
            <Button onClick={() => setMostrarForm((v) => !v)}>{mostrarForm ? "Cancelar" : "Nova venda"}</Button>
          </div>
        }
      />

      {erro && <ErrorBanner mensagem={erro} />}

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={registrar} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="clienteId">Cliente</Label>
                <SelectComCriacao
                  id="clienteId"
                  itens={clientes}
                  value={clienteId}
                  onChange={setClienteId}
                  onCriar={(nome) => api.post<ClienteResponse>("/clientes", { nome })}
                  onCriado={(item) => setClientes((atual) => [...atual, item])}
                  novoPlaceholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="canalId">Canal</Label>
                <SelectComCriacao
                  id="canalId"
                  itens={canais}
                  value={canalId}
                  onChange={setCanalId}
                  onCriar={(nome) => api.post<CanalVendaResponse>("/canais-venda", { nome })}
                  onCriado={(item) => setCanais((atual) => [...atual, item])}
                  novoPlaceholder="Instagram, loja física..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descontoGeral">Desconto geral (%)</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="descontoGeral"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className="max-w-[120px]"
                  value={descontoGeral}
                  onChange={(e) => setDescontoGeral(Number(e.target.value))}
                />
                <Button type="button" variant="secondary" onClick={aplicarDescontoGeral}>
                  Aplicar a todos os itens
                </Button>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">
                Aplica esse % em cima do preço de tabela de cada item já adicionado — depois disso, ajuste o preço de
                um item específico na mão se precisar de um desconto diferente só pra ele. Pedidos grandes (100+
                unidades) funcionam igual, só aumente a quantidade.
              </p>
            </div>

            <div>
              <Label>Itens *</Label>
              <div className="grid gap-2">
                {itens.map((linha, index) => {
                  const tabela = precoTabela(linha);
                  const comDesconto = tabela > 0 && linha.precoUnitario < tabela;
                  const margem = margemPercentualLinha(linha);
                  const custoUnitario = custoUnitarioLinha(linha);
                  return (
                    <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_100px_120px_auto] sm:items-end">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="mb-1 block text-sm text-ink-secondary">Produto</span>
                        <Select
                          value={linha.produtoId}
                          onChange={(e) => selecionarProduto(index, Number(e.target.value))}
                        >
                          <option value="">Selecione...</option>
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} (estoque: {p.estoqueAtual})
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <span className="mb-1 block text-sm text-ink-secondary">Qtd.</span>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={linha.quantidade}
                          onChange={(e) => atualizarLinha(index, { quantidade: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-sm text-ink-secondary">Preço unit.</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={linha.precoUnitario}
                          onChange={(e) => atualizarLinha(index, { precoUnitario: Number(e.target.value) })}
                        />
                        {(comDesconto || (mostrarLucro && margem !== null)) && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {comDesconto && (
                              <span className="text-sm text-ink-secondary">
                                -{Math.round((1 - linha.precoUnitario / tabela) * 100)}% da tabela
                              </span>
                            )}
                            {mostrarLucro && margem !== null && custoUnitario !== null && (
                              <span
                                className={`text-sm ${corDoTexto(tomDaMargem(margem))} ${
                                  tomDaMargem(margem) !== "success" ? "font-medium" : ""
                                }`}
                              >
                                custo {formatarMoeda(custoUnitario)} · lucro {formatarMoeda(linha.precoUnitario - custoUnitario)}/un
                                {margem < 0 && " (abaixo do custo)"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="col-span-2 sm:col-span-1"
                        onClick={() => removerLinha(index)}
                        disabled={itens.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button type="button" variant="secondary" className="mt-2" onClick={adicionarLinha}>
                + Adicionar item
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-base text-ink-secondary">
                  Total estimado: <strong>{formatarMoeda(totalEstimado)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarLucro((v) => !v)}
                  title={mostrarLucro ? "Ocultar lucro" : "Ver lucro (não aparece pro cliente)"}
                  className="text-ink-faint hover:text-ink-secondary"
                >
                  {mostrarLucro ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
                {mostrarLucro &&
                  (resumoPedido ? (
                    <span className="flex flex-wrap items-center gap-2 text-base text-ink-secondary">
                      Custo: <strong>{formatarMoeda(resumoPedido.custo)}</strong> · Lucro:{" "}
                      <strong className={resumoPedido.lucro < 0 ? "text-critical" : "text-good"}>
                        {formatarMoeda(resumoPedido.lucro)}
                      </strong>
                      {resumoPedido.percentual !== null && (
                        <Badge tone={tomDaMargem(resumoPedido.percentual)}>{resumoPedido.percentual}%</Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-ink-faint">Nenhum item com ficha técnica cadastrada.</span>
                  ))}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={enviarOrcamentoNoWhatsApp}>
                  Enviar no WhatsApp
                </Button>
                <Button type="submit" disabled={salvando}>
                  {salvando ? "Registrando..." : "Registrar venda"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {carregando ? (
        <p className="text-base text-ink-secondary">Carregando...</p>
      ) : vendas.length === 0 ? (
        <EmptyState mensagem="Nenhuma venda registrada ainda." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-base">
            <thead className="border-b border-hairline bg-surface-hover text-left text-sm uppercase text-ink-secondary">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Canal</th>
                <th className="px-5 py-4">Itens</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda) => (
                <tr key={venda.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-4 text-ink-secondary">{formatarDataHora(venda.dataVenda)}</td>
                  <td className="px-5 py-4 font-medium text-ink">{venda.clienteNome ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{venda.canalNome ?? "—"}</td>
                  <td className="px-5 py-4 text-ink-secondary">{venda.itens.length}</td>
                  <td className="px-5 py-4 font-medium text-ink">{formatarMoeda(venda.valorTotal)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/vendas/${venda.id}`} className="text-ink-secondary hover:underline">
                      Ver
                    </Link>
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
