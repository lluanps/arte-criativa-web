import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { IconBox, IconCandle, IconTag } from "@/components/Icon";

const secoes = [
  { nome: "Produtos", href: "/estoque/produtos", descricao: "Produtos finais, preço de venda e estoque atual", Icon: IconCandle },
  { nome: "Matérias-primas", href: "/estoque/materias-primas", descricao: "Insumos usados na produção, custo e estoque", Icon: IconBox },
  { nome: "Categorias", href: "/estoque/categorias", descricao: "Categorias usadas para organizar os produtos", Icon: IconTag },
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
            className="flex items-start gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-sm transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good">
              <secao.Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{secao.nome}</h2>
              <p className="mt-1 text-base text-ink-secondary">{secao.descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
