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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-ink">Arte Criativa</h1>
      <p className="mt-2 text-ink-secondary">
        Sistema de gestão para vendas de produtos artesanais.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.nome}
            href={modulo.href}
            className="flex items-start gap-3.5 rounded-2xl border border-hairline bg-surface p-4 shadow-sm transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-good-soft text-good">
              <modulo.Icon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2 className="font-semibold text-ink">{modulo.nome}</h2>
              <p className="mt-1 text-sm text-ink-secondary">{modulo.descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
