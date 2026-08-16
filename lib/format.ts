export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Formata uma data pura (LocalDate da API, "yyyy-MM-dd", sem horário/timezone) como
 * dd/mm/aaaa. Não passa por `Date` de propósito: `new Date("2026-08-01")` é
 * interpretado como UTC meia-noite, e formatar isso num fuso atrás de UTC (ex: Brasil)
 * exibe o dia anterior. Pra datas com horário (Instant), use formatarDataHora.
 */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

/**
 * Data local (não UTC) em "yyyy-MM-dd", pra usar como valor de <input type="date">
 * ou enviar como LocalDate pra API. `Date#toISOString()` converte pra UTC antes de
 * formatar, o que muda o dia perto da meia-noite dependendo do fuso — este helper usa
 * os componentes locais diretamente.
 */
export function dataLocalISO(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Converte uma data pura ("yyyy-MM-dd") num `Date` à meia-noite LOCAL — pra fazer
 * aritmética de dias (diferença, iteração) sem cair no mesmo problema de fuso que
 * `formatarData`/`dataLocalISO` evitam. Nunca use `new Date(iso)` diretamente com uma
 * string de data pura.
 */
export function parseDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Valor monetário compacto pra eixos/rótulos de gráfico: R$ 1,2 mil / R$ 3,4 mi. */
export function formatarMoedaCompacta(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(valor / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(valor).toLocaleString("pt-BR")}`;
}
