export type TipoMovimentacao = "ENTRADA" | "SAIDA";

export type MotivoMovimentacaoProduto = "PRODUCAO" | "VENDA" | "AJUSTE" | "PERDA";
export type MotivoMovimentacaoMateriaPrima = "COMPRA" | "PRODUCAO" | "AJUSTE" | "PERDA";

export interface ProdutoResponse {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fotoUrl: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProdutoRequest {
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  precoVenda: number;
  estoqueMinimo: number;
  fotoUrl?: string | null;
  ativo?: boolean;
}

export interface MateriaPrimaResponse {
  id: number;
  nome: string;
  unidadeMedida: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedor: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MateriaPrimaRequest {
  nome: string;
  unidadeMedida: string;
  custoUnitario: number;
  estoqueMinimo: number;
  fornecedor?: string | null;
}

export interface MovimentacaoResponse {
  id: number;
  tipo: TipoMovimentacao;
  motivo: string;
  quantidade: number;
  observacao: string | null;
  dataMovimentacao: string;
}

export interface MovimentacaoProdutoRequest {
  tipo: TipoMovimentacao;
  motivo: MotivoMovimentacaoProduto;
  quantidade: number;
  observacao?: string | null;
}

export interface MovimentacaoMateriaPrimaRequest {
  tipo: TipoMovimentacao;
  motivo: MotivoMovimentacaoMateriaPrima;
  quantidade: number;
  observacao?: string | null;
}
