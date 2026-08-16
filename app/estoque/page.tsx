import { PageHeader } from "@/components/ui";
import Link from "next/link";

const secoes = [
  { nome: "Produtos", href: "/estoque/produtos", descricao: "Produtos finais, preço de venda e estoque atual" },
  { nome: "Matérias-primas", href: "/estoque/materias-primas", descricao: "Insumos usados na produção, custo e estoque" },
];

export default function EstoquePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader titulo="Estoque" descricao="Produtos finais e matérias-primas, com histórico de movimentações." />
      <div className="grid gap-4 sm:grid-cols-2">
        {secoes.map((secao) => (
          <Link
            key={secao.href}
            href={secao.href}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-colors hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <h2 className="font-semibold">{secao.nome}</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{secao.descricao}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
