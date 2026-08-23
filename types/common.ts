/** Espelha PaginaResponse<T> da API — usado pelos endpoints de busca paginada (ex:
 * GET /produtos/busca, GET /materias-primas/busca). Os endpoints de listagem simples
 * (GET /produtos, GET /materias-primas) continuam devolvendo array puro. */
export interface PaginaResponse<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}
