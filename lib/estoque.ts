import { api } from "@/lib/api";
import { MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";

export interface ItemEstoqueBaixo {
  chave: string;
  tipo: "produto" | "materia-prima";
  id: number;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  href: string;
}

/**
 * Produtos ativos e matérias-primas com estoque igual ou abaixo do mínimo cadastrado.
 * Fonte única da regra — usada tanto pelo alerta flutuante (AlertaEstoqueBaixo) quanto
 * pelo resumo da Home, pra não ter duas definições de "estoque baixo" divergindo.
 */
export async function buscarItensEstoqueBaixo(): Promise<ItemEstoqueBaixo[]> {
  const [produtos, materiasPrimas] = await Promise.all([
    api.get<ProdutoResponse[]>("/produtos"),
    api.get<MateriaPrimaResponse[]>("/materias-primas"),
  ]);

  return [
    ...produtos
      .filter((p) => p.ativo && p.estoqueAtual <= p.estoqueMinimo)
      .map((p) => ({
        chave: `produto:${p.id}`,
        tipo: "produto" as const,
        id: p.id,
        nome: p.nome,
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
        unidade: "un.",
        href: `/estoque/produtos/${p.id}`,
      })),
    ...materiasPrimas
      .filter((mp) => mp.estoqueAtual <= mp.estoqueMinimo)
      .map((mp) => ({
        chave: `materia-prima:${mp.id}`,
        tipo: "materia-prima" as const,
        id: mp.id,
        nome: mp.nome,
        estoqueAtual: mp.estoqueAtual,
        estoqueMinimo: mp.estoqueMinimo,
        unidade: mp.unidadeMedida,
        href: `/estoque/materias-primas/${mp.id}`,
      })),
  ];
}
