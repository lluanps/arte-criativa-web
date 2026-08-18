export interface ReceitaItemRequest {
  materiaPrimaId: number;
  quantidade: number;
}

export interface ReceitaRequest {
  produtoId: number;
  nome: string;
  rendimento: number;
  itens: ReceitaItemRequest[];
}

export interface ReceitaItemResponse {
  id: number;
  materiaPrimaId: number;
  materiaPrimaNome: string;
  unidadeMedida: string;
  quantidade: number;
}

export interface ReceitaResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  nome: string;
  rendimento: number;
  itens: ReceitaItemResponse[];
  custoProducao: number;
  margemLucro: number;
  margemPercentual: number | null;
  margemDesejadaPercentual: number;
  precoSugerido: number;
  precoMercadoMin: number | null;
  precoMercadoMax: number | null;
  precoMercadoAtualizadoEm: string | null;
  criadoEm: string;
}

export interface ProducaoRequest {
  produtoId: number;
  quantidadeProduzida: number;
  observacao?: string | null;
}

export interface ProducaoResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidadeProduzida: number;
  custoTotal: number;
  observacao: string | null;
  dataProducao: string;
}
