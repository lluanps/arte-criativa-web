export type StatusIdeia = "IDEIA_SOLTA" | "EM_TESTE" | "VIROU_PRODUTO" | "DESCARTADA";

export interface IdeiaResponse {
  id: number;
  titulo: string;
  corpo: string | null;
  status: StatusIdeia;
  favorita: boolean;
  produtoRelacionadoId: number | null;
  produtoRelacionadoNome: string | null;
  tags: string[];
  fotosUrls: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface IdeiaRequest {
  titulo: string;
  corpo?: string | null;
  status?: StatusIdeia;
  favorita?: boolean;
  produtoRelacionadoId?: number | null;
  tags?: string[];
  fotosUrls?: string[];
}
