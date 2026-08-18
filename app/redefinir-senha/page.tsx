"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { RedefinirSenhaRequest } from "@/types/auth";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import { IconLock } from "@/components/Icon";

function RedefinirSenhaForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function redefinir(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!token) {
      setErro("Link inválido — falta o token de redefinição.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    try {
      await api.post<void>("/auth/redefinir-senha", { token, novaSenha } satisfies RedefinirSenhaRequest);
      router.replace("/login?senha-redefinida=1");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-sm">
            <IconLock className="h-8 w-8 text-accent-ink" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-ink">Nova senha</p>
            <p className="text-sm text-ink-secondary">Escolha uma senha nova pra sua conta</p>
          </div>
        </div>

        <Card>
          {!token ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <ErrorBanner mensagem="Link inválido ou incompleto — peça um novo em 'Esqueci minha senha'." />
              <Link href="/esqueci-senha" className="text-sm font-semibold text-accent hover:underline">
                Pedir novo link
              </Link>
            </div>
          ) : (
            <form onSubmit={redefinir} className="flex flex-col gap-4">
              {erro && <ErrorBanner mensagem={erro} />}

              <div>
                <Label htmlFor="novaSenha">Nova senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={enviando} className="mt-2 w-full">
                {enviando ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
