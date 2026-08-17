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
    <aside className="flex w-60 shrink-0 flex-col gap-6 bg-sidebar px-3.5 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-accent shadow-sm">
          <IconCandle className="h-[19px] w-[19px] text-accent-ink" />
        </div>
        <div>
          <p className="text-[1.02rem] font-extrabold leading-tight tracking-tight text-sidebar-ink">Arte Criativa</p>
          <p className="text-[0.68rem] tracking-wide text-sidebar-ink-muted">gestão do ateliê</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {links.map((link) => {
          const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                ativo
                  ? "bg-sidebar-raised text-sidebar-ink before:absolute before:-left-3.5 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-accent"
                  : "text-sidebar-ink-muted hover:bg-sidebar-raised hover:text-sidebar-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
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
