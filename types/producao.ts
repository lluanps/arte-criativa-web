export interface ReceitaItemRequest {
  materiaPrimaId: number;
  quantidade: number;
  /** Opcional — quando omitida, usa a mesma unidade cadastrada na matéria-prima (sem
   * conversão). Só preencha se quiser escrever a quantidade numa unidade diferente da
   * cadastrada (ex: "g" numa matéria-prima em "kg") — precisa ser uma unidade
   * reconhecida (g, kg, ml, l, cm, m, un) da mesma grandeza. */
  unidadeMedida?: string | null;
}

export interface ReceitaRequest {
  produtoId: number;
  nome: string;
  rendimento: number;
  itens: ReceitaItemRequest[];
  /** Opcionais (default 0), por unidade produzida — somados ao custo de insumo pra
   * formar o custo real da ficha técnica. */
  custoMaoDeObra?: number;
  custoEmbalagemOutros?: number;
}

export interface ReceitaItemResponse {
  id: number;
  materiaPrimaId: number;
  materiaPrimaNome: string;
  unidadeMedida: string;
  quantidade: number;
  /** Custo unitário da matéria-prima, na unidade dela (pode ser diferente da unidade
   * deste item). */
  custoUnitarioMateriaPrima: number;
  unidadeMedidaMateriaPrima: string;
  /** quantidade (convertida) × custoUnitarioMateriaPrima. */
  subtotalCusto: number;
}

export interface ReceitaResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  nome: string;
  rendimento: number;
  itens: ReceitaItemResponse[];
  /** Só matéria-prima (insumo), por unidade — ver custoTotal pro custo real. */
  custoProducao: number;
  custoMaoDeObra: number;
  custoEmbalagemOutros: number;
  /** custoProducao + custoMaoDeObra + custoEmbalagemOutros — é este valor (não
   * custoProducao) que embasa margemLucro/margemPercentual/precoSugerido abaixo. */
  custoTotal: number;
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
