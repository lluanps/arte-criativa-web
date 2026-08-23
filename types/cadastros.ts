export interface CategoriaResponse {
  id: number;
  nome: string;
  precoMercadoMin: number | null;
  precoMercadoMax: number | null;
  precoMercadoAtualizadoEm: string | null;
  criadoEm: string;
}

export interface CategoriaRequest {
  nome: string;
}

export interface PrecoMercadoRequest {
  min: number;
  max: number;
}

/** Categoria de matéria-prima (ex: ceras, pavios, essências) — separada da categoria
 * de Produto de propósito: assuntos diferentes, e a de produto carrega preço de
 * mercado, que não faz sentido pra um insumo. */
export interface CategoriaMateriaPrimaResponse {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface CategoriaMateriaPrimaRequest {
  nome: string;
}

export interface CanalVendaResponse {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface CanalVendaRequest {
  nome: string;
}

export interface ClienteResponse {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  criadoEm: string;
}

export interface ClienteRequest {
  nome: string;
  telefone?: string | null;
  email?: string | null;
}
