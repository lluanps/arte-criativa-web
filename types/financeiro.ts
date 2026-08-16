export type TipoLancamento = "RECEITA" | "DESPESA";
export type OrigemLancamento = "VENDA" | "COMPRA" | "MANUAL";
export type TipoConta = "PAGAR" | "RECEBER";
export type StatusConta = "PENDENTE" | "PAGO" | "ATRASADO";

export interface LancamentoFinanceiroRequest {
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  descricao?: string | null;
  dataLancamento: string;
}

export interface LancamentoFinanceiroResponse {
  id: number;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  descricao: string | null;
  origem: OrigemLancamento;
  origemId: number | null;
  dataLancamento: string;
  criadoEm: string;
}

export interface ContaRequest {
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
}

export interface ContaResponse {
  id: number;
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
  status: StatusConta;
  pagoEm: string | null;
  criadoEm: string;
}

export interface DashboardFinanceiroResponse {
  periodoInicio: string;
  periodoFim: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalContasPagarPendentes: number;
  totalContasReceberPendentes: number;
  contasAtrasadas: number;
}
