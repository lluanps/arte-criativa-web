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
  /** Estoque atual desta matéria-prima, na unidade dela — mesma unidade de
   * custoUnitarioMateriaPrima. */
  estoqueAtualMateriaPrima: number;
  /** Quantas unidades do produto dá pra fazer considerando só esta matéria-prima
   * isoladamente (o "gargalo" dela). Ver ReceitaResponse.quantidadeProduzivelComEstoqueAtual
   * pro mínimo entre todos os itens, que é o que de fato limita a receita inteira. */
  unidadesProduziveisComEsteItem: number | null;
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
  /** Quantas unidades do produto dá pra produzir agora, considerando o estoque atual de
   * TODAS as matérias-primas da receita — o mínimo entre itens[].unidadesProduziveisComEsteItem
   * (a matéria-prima mais escassa manda). null só se não der pra calcular. */
  quantidadeProduzivelComEstoqueAtual: number | null;
  /** Nome da matéria-prima que é o gargalo (a que gerou o mínimo acima). */
  materiaPrimaLimitanteNome: string | null;
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
