export interface TutorialPassoRequest {
  ordem: number;
  titulo: string;
  descricao?: string | null;
  midiaUrl?: string | null;
}

export interface TutorialRequest {
  titulo: string;
  categoria?: string | null;
  produtoRelacionadoId?: number | null;
  passos: TutorialPassoRequest[];
}

export interface TutorialPassoResponse {
  id: number;
  ordem: number;
  titulo: string;
  descricao: string | null;
  midiaUrl: string | null;
}

export interface TutorialResponse {
  id: number;
  titulo: string;
  categoria: string | null;
  produtoRelacionadoId: number | null;
  produtoRelacionadoNome: string | null;
  passos: TutorialPassoResponse[];
  criadoEm: string;
  atualizadoEm: string;
}
