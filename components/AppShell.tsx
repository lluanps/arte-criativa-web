"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { obterSessao } from "@/lib/auth";

const ROTAS_PUBLICAS = ["/login", "/esqueci-senha", "/redefinir-senha"];

/**
 * Decide o "esqueleto" da página com base na rota: nas rotas públicas de auth, não
 * mostra o Nav (não faz sentido antes de logar) e libera direto. Nas demais, exige
 * sessão salva — sem ela, redireciona pra /login antes de renderizar qualquer coisa
 * protegida (evita o "flash" de conteúdo que some logo em seguida).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));
  const [autorizado, setAutorizado] = useState(publica);

  useEffect(() => {
    if (publica) {
      setAutorizado(true);
      return;
    }
    if (!obterSessao()) {
      router.replace("/login");
      return;
    }
    setAutorizado(true);
  }, [pathname, publica, router]);

  if (publica) {
    return <div className="min-w-0 flex-1">{children}</div>;
  }

  if (!autorizado) {
    return null;
  }

  return (
    <>
      <Nav />
      <div className="min-w-0 flex-1">{children}</div>
    </>
  );
}
