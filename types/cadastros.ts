export interface CategoriaResponse {
  id: number;
  nome: string;
  criadoEm: string;
}

export interface CategoriaRequest {
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
