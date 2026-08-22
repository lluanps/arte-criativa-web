/** Estado de ordenação de uma tabela: qual campo e em qual direção. */
export interface Ordenacao<Campo extends string> {
  campo: Campo;
  direcao: "asc" | "desc";
}

/**
 * Alterna a ordenação ao clicar num cabeçalho de coluna: clicar na coluna já ativa
 * inverte a direção; clicar numa coluna diferente troca pra ela, sempre começando
 * ascendente (comportamento padrão de tabela clicável).
 */
export function alternarOrdenacao<Campo extends string>(
  atual: Ordenacao<Campo>,
  campo: Campo
): Ordenacao<Campo> {
  return atual.campo === campo ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" } : { campo, direcao: "asc" };
}

/**
 * Compara dois valores (string ou number) respeitando a direção pedida — nulo/undefined
 * sempre vai pro final da lista, independente da direção (convenção comum em tabela: em
 * vez de "nulo pula pro topo" quando inverte pra desc, ele fica sempre por último).
 */
export function compararValores(a: string | number | null | undefined, b: string | number | null | undefined, direcao: "asc" | "desc"): number {
  const aNulo = a === null || a === undefined;
  const bNulo = b === null || b === undefined;
  if (aNulo && bNulo) return 0;
  if (aNulo) return 1;
  if (bNulo) return -1;
  const comparacao = typeof a === "string" ? a.localeCompare(b as string, "pt-BR") : (a as number) - (b as number);
  return direcao === "asc" ? comparacao : -comparacao;
}
