import { PageHeader } from "@/components/ui";
import Link from "next/link";

const secoes = [
  { nome: "Produtos", href: "/estoque/produtos", descricao: "Produtos finais, preço de venda e estoque atual" },
  { nome: "Matérias-primas", href: "/estoque/materias-primas", descricao: "Insumos usados na produção, custo e estoque" },
];

export default function EstoquePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader titulo="Estoque" descricao="Produtos finais e matérias-primas, com histórico de movimentações." />
      <div className="grid gap-5 sm:grid-cols-2">
        {secoes.map((secao) => (
          <Link
            key={secao.href}
            href={secao.href}
            className="rounded-lg border border-hairline bg-surface p-4 shadow-sm transition-colors hover:bg-surface-hover hover:bg-surface-hover"
          >
            <h2 className="font-semibold">{secao.nome}</h2>
            <p className="mt-1 text-base text-ink-secondary">{secao.descricao}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
