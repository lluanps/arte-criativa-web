"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconBag, IconBook, IconBox, IconCandle, IconClipboard, IconHome, IconWallet } from "@/components/Icon";

const links = [
  { href: "/", label: "Início", Icon: IconHome },
  { href: "/estoque", label: "Estoque", Icon: IconBox },
  { href: "/receitas", label: "Receitas", Icon: IconClipboard },
  { href: "/vendas", label: "Vendas", Icon: IconBag },
  { href: "/financeiro", label: "Financeiro", Icon: IconWallet },
  { href: "/tutoriais", label: "Tutoriais", Icon: IconBook },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-8 bg-sidebar px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-sm">
          <IconCandle className="h-6 w-6 text-accent-ink" />
        </div>
        <div>
          <p className="text-lg font-extrabold leading-tight tracking-tight text-sidebar-ink">Arte Criativa</p>
          <p className="text-sm tracking-wide text-sidebar-ink-muted">gestão do ateliê</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors ${
                ativo
                  ? "bg-sidebar-raised text-sidebar-ink before:absolute before:-left-4 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-full before:bg-accent"
                  : "text-sidebar-ink-muted hover:bg-sidebar-raised hover:text-sidebar-ink"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
}
