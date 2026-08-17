export interface VendaItemRequest {
  produtoId: number;
  quantidade: number;
  precoUnitario?: number | null;
}

export interface VendaRequest {
  clienteId?: number | null;
  canalId?: number | null;
  itens: VendaItemRequest[];
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
}
