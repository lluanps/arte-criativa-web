import Link from "next/link";
import { PageHeader } from "@/components/ui";

const secoes = [
  { nome: "Fichas técnicas", href: "/receitas/fichas", descricao: "Consumo de matéria-prima por produto" },
  { nome: "Produção", href: "/receitas/producoes", descricao: "Registrar produção e ver custo calculado" },
];

export default function ReceitasPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader titulo="Receitas / Produção" descricao="Ficha técnica por produto e registro de produção com baixa automática de matéria-prima." />
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
