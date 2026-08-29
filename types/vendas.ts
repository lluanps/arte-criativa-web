export interface VendaItemRequest {
  produtoId: number;
  quantidade: number;
  precoUnitario?: number | null;
}

export type StatusVenda = "PENDENTE" | "EM_PRODUCAO" | "PRONTO" | "ENTREGUE";

export interface VendaRequest {
  clienteId?: number | null;
  canalId?: number | null;
  itens: VendaItemRequest[];
  /** Preenchida = encomenda (nasce PENDENTE); ausente/null = venda de balcão. */
  dataEntregaPrevista?: string | null;
  /** Só aplicável junto de dataEntregaPrevista. */
  valorSinal?: number | null;
}

export interface VendaItemResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface VendaResponse {
  id: number;
  clienteId: number | null;
  clienteNome: string | null;
  canalId: number | null;
  canalNome: string | null;
  valorTotal: number;
  itens: VendaItemResponse[];
  dataVenda: string;
  criadoEm: string;
  dataEntregaPrevista: string | null;
  status: StatusVenda;
  valorSinal: number;
  valorSaldo: number;
  entregaAtrasada: boolean;
}

export interface ReagendarEntregaRequest {
  novaDataEntrega: string;
}
