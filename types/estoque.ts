export type TipoMovimentacao = "ENTRADA" | "SAIDA";

export type MotivoMovimentacaoProduto = "PRODUCAO" | "VENDA" | "AJUSTE" | "PERDA";
export type MotivoMovimentacaoMateriaPrima = "COMPRA" | "PRODUCAO" | "AJUSTE" | "PERDA";

export interface ProdutoResponse {
  id: number;
  nome: string;
  descricao: string | null;
  categoriaId: number | null;
  categoriaNome: string | null;
  volumeMl: number | null;
  precoVenda: number;
  margemDesejadaPercentual: number | null;
  estoqueAtual: number;
  estoqueMinimo: number;
  fotosUrls: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProdutoRequest {
  nome: string;
  descricao?: string | null;
  categoriaId?: number | null;
  volumeMl?: number | null;
  precoVenda: number;
  margemDesejadaPercentual?: number | null;
  estoqueMinimo: number;
  fotosUrls?: string[];
  ativo?: boolean;
}

export interface MateriaPrimaResponse {
  id: number;
  nome: string;
  unidadeMedida: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  volumeMl: number | null;
  fornecedor: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

/** Criar uma matéria-prima é sempre "registrar a primeira compra" — custo unitário não
 * é digitável direto, vem de valorPago ÷ quantidadeComprada (o backend calcula). Pra só
 * anotar um nome sem saber o preço ainda, usar MateriaPrimaDesejadaRequest em vez deste. */
export interface MateriaPrimaRequest {
  nome: string;
  unidadeMedida: string;
  quantidadeComprada: number;
  valorPago: number;
  estoqueMinimo: number;
  volumeMl?: number | null;
  fornecedor?: string | null;
}

/** Editar uma matéria-prima já cadastrada — só metadados. Custo unitário e estoque não
 * entram aqui de propósito: só mudam via "Registrar movimentação" (valor pago). */
export interface MateriaPrimaAtualizacaoRequest {
  nome: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  volumeMl?: number | null;
  fornecedor?: string | null;
}

/** "Lista de compras": matéria-prima que ainda não tem preço definido — só o nome, sem
 * nenhuma relação com MateriaPrimaResponse até a compra ser registrada de verdade. */
export interface MateriaPrimaDesejadaResponse {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface MateriaPrimaDesejadaRequest {
  nome: string;
}

export interface MovimentacaoResponse {
  id: number;
  tipo: TipoMovimentacao;
  motivo: string;
  quantidade: number;
  observacao: string | null;
  dataMovimentacao: string;
  /** Só preenchido em entrada de matéria-prima com valor pago informado. */
  valorPago: number | null;
  custoUnitarioApurado: number | null;
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
  /** Opcional — só numa ENTRADA. Quanto foi pago no TOTAL da compra; o backend calcula
   * o custo unitário sozinho (valorPago ÷ quantidade) e atualiza o custo médio. */
  valorPago?: number | null;
  observacao?: string | null;
}
