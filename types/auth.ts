export interface LoginRequest {
  email: string;
  senha: string;
}

/** Cadastro público de empresa nova (`POST /api/auth/registrar-empresa`) — cria a
 * empresa e o primeiro usuário dela numa tacada só, devolve token já logado. Demais
 * campos de empresa (telefone, CNPJ, endereço, logo) ficam pra completar depois via
 * `PUT /api/empresa`, já autenticado. */
export interface RegistroEmpresaRequest {
  nomeEmpresa: string;
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  nome: string;
  email: string;
}

export interface EsqueciSenhaRequest {
  email: string;
}

export interface RedefinirSenhaRequest {
  token: string;
  novaSenha: string;
}
