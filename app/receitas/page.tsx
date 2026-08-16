import Link from "next/link";
import { PageHeader } from "@/components/ui";

const secoes = [
  { nome: "Fichas técnicas", href: "/receitas/fichas", descricao: "Consumo de matéria-prima por produto" },
  { nome: "Produção", href: "/receitas/producoes", descricao: "Registrar produção e ver custo calculado" },
];

export default function ReceitasPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader titulo="Receitas / Produção" descricao="Ficha técnica por produto e registro de produção com baixa automática de matéria-prima." />
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
