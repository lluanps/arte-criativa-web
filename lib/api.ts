const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/**
 * Espelha o ErroResposta do GlobalExceptionHandler da API: mensagem sempre presente,
 * `campos` só vem preenchido em erro de validação (400).
 */
export class ApiError extends Error {
  status: number;
  campos?: Record<string, string>;

  constructor(status: number, message: string, campos?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.campos = campos;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Ela está rodando?");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const mensagem = data?.mensagem ?? `Erro inesperado (HTTP ${res.status})`;
    throw new ApiError(res.status, mensagem, data?.campos ?? undefined);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: "DELETE" }),
};
