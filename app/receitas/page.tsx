import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { IconCheckCircle, IconClipboard } from "@/components/Icon";

const secoes = [
  { nome: "Fichas técnicas", href: "/receitas/fichas", descricao: "Consumo de matéria-prima por produto", Icon: IconClipboard },
  { nome: "Produção", href: "/receitas/producoes", descricao: "Registrar produção e ver custo calculado", Icon: IconCheckCircle },
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
