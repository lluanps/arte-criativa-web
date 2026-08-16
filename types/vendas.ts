export interface VendaItemRequest {
  produtoId: number;
  quantidade: number;
  precoUnitario?: number | null;
}

export interface VendaRequest {
  clienteNome?: string | null;
  canal?: string | null;
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
  clienteNome: string | null;
  canal: string | null;
  valorTotal: number;
  itens: VendaItemResponse[];
  dataVenda: string;
  criadoEm: string;
}
