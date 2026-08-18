const STORAGE_KEY = "arte-criativa-auth";

export interface Sessao {
  token: string;
  id: number;
  nome: string;
  email: string;
}

export function salvarSessao(sessao: Sessao) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
}

/** Retorna `null` no server (sem `window`) ou se não houver sessão salva/válida. */
export function obterSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Sessao;
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(STORAGE_KEY);
}
