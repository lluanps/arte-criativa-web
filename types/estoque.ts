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
  categoriaId: number | null;
  categoriaNome: string | null;
  unidadeMedida: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedor: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface GrupoMateriaPrimaPorCategoria {
  categoriaNome: string;
  itens: MateriaPrimaResponse[];
}

/** Agrupa matérias-primas por categoria (nome) — usado pra montar `<optgroup>` no
 * seletor de matéria-prima da Ficha técnica, que pode listar dezenas de itens. Sem
 * categoria vai pro grupo "Sem categoria", sempre por último; os demais em ordem
 * alfabética. */
export function agruparMateriaPrimaPorCategoria(materiasPrimas: MateriaPrimaResponse[]): GrupoMateriaPrimaPorCategoria[] {
  const mapa = new Map<string, MateriaPrimaResponse[]>();
  for (const mp of materiasPrimas) {
    const chave = mp.categoriaNome ?? "Sem categoria";
    const lista = mapa.get(chave) ?? [];
    lista.push(mp);
    mapa.set(chave, lista);
  }
  return [...mapa.entries()]
    .map(([categoriaNome, itens]) => ({ categoriaNome, itens }))
    .sort((a, b) => {
      if (a.categoriaNome === "Sem categoria") return 1;
      if (b.categoriaNome === "Sem categoria") return -1;
      return a.categoriaNome.localeCompare(b.categoriaNome);
    });
}

/** Criar uma matéria-prima é sempre "registrar a primeira compra" — custo unitário não
 * é digitável direto, vem de valorPago ÷ quantidadeComprada (o backend calcula). Pra só
 * anotar um nome sem saber o preço ainda, usar MateriaPrimaDesejadaRequest em vez deste. */
export interface MateriaPrimaRequest {
  nome: string;
  categoriaId?: number | null;
  unidadeMedida: string;
  quantidadeComprada: number;
  valorPago: number;
  estoqueMinimo: number;
  fornecedor?: string | null;
}

/** Editar uma matéria-prima já cadastrada — só metadados. Custo unitário e estoque não
 * entram aqui de propósito: só mudam via "Registrar movimentação" (valor pago). */
export interface MateriaPrimaAtualizacaoRequest {
  nome: string;
  categoriaId?: number | null;
  unidadeMedida: string;
  estoqueMinimo: number;
  fornecedor?: string | null;
}

/** Unidades reconhecidas pelo backend (UnidadeMedida.deTexto) pra conversão automática
 * entre a unidade da matéria-prima e a de um item de receita — select fixo (em vez de
 * texto livre) pra não deixar cadastrar uma grafia que o backend não reconhece. */
export const UNIDADES_MEDIDA = [
  { value: "g", label: "g (grama)" },
  { value: "kg", label: "kg (quilograma)" },
  { value: "ml", label: "ml (mililitro)" },
  { value: "l", label: "l (litro)" },
  { value: "cm", label: "cm (centímetro)" },
  { value: "m", label: "m (metro)" },
  { value: "un", label: "un (unidade)" },
] as const;

/** "un" é contagem — não faz sentido ter casas decimais (2,5 un). As demais
 * (peso/volume/comprimento) fazem. Usado em todo campo de quantidade atrelado a uma
 * unidade de medida, pra restringir o `step` do input e arredondar o valor digitado. */
export function quantidadeEhInteira(unidadeMedida: string | null | undefined): boolean {
  return unidadeMedida === "un";
}

export function stepQuantidade(unidadeMedida: string | null | undefined): string {
  return quantidadeEhInteira(unidadeMedida) ? "1" : "0.001";
}

/** Arredonda pra inteiro quando a unidade é "un" — usado no onChange do campo de
 * quantidade, além do `step`, porque o `step` sozinho não impede digitar "2,5" na
 * maioria dos browsers. */
export function arredondarQuantidade(quantidade: number, unidadeMedida: string | null | undefined): number {
  return quantidadeEhInteira(unidadeMedida) ? Math.round(quantidade) : quantidade;
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
