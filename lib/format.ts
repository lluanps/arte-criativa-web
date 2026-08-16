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
