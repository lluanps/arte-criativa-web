import Link from "next/link";
import { IconBag, IconBook, IconBox, IconClipboard, IconWallet } from "@/components/Icon";

const modulos = [
  { nome: "Estoque", href: "/estoque", descricao: "Produtos, matérias-primas e movimentações", Icon: IconBox },
  { nome: "Receitas", href: "/receitas", descricao: "Fichas técnicas e registro de produção", Icon: IconClipboard },
  { nome: "Vendas", href: "/vendas", descricao: "Pedidos e vendas realizadas", Icon: IconBag },
  { nome: "Financeiro", href: "/financeiro", descricao: "Lançamentos, contas a pagar e a receber", Icon: IconWallet },
  { nome: "Tutoriais", href: "/tutoriais", descricao: "Passo a passo de produção", Icon: IconBook },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-ink">Arte Criativa</h1>
      <p className="mt-2 text-ink-secondary">
        Sistema de gestão para vendas de produtos artesanais.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.nome}
            href={modulo.href}
            className="flex items-start gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-sm transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good">
              <modulo.Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{modulo.nome}</h2>
              <p className="mt-1 text-base text-ink-secondary">{modulo.descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
