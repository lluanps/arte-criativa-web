"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { EsqueciSenhaRequest } from "@/types/auth";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import { IconCandle, IconCheckCircle } from "@/components/Icon";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.post<void>("/auth/esqueci-senha", { email } satisfies EsqueciSenhaRequest);
      // Sempre mostra sucesso, exista ou não o e-mail — mesma lógica de não vazar
      // informação que já vale no back (ver AuthService.esqueciSenha).
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-sm">
            <IconCandle className="h-8 w-8 text-accent-ink" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-ink">Esqueci minha senha</p>
            <p className="text-sm text-ink-secondary">Enviamos um link pra redefinir</p>
          </div>
        </div>

        <Card>
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <IconCheckCircle className="h-9 w-9 text-good" />
              <p className="text-base text-ink">
                Se <strong>{email}</strong> estiver cadastrado, você vai receber um e-mail com o link pra
                criar uma senha nova em instantes.
              </p>
              <Link href="/login" className="mt-2 text-sm font-semibold text-accent hover:underline">
                Voltar pro login
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="flex flex-col gap-4">
              {erro && <ErrorBanner mensagem={erro} />}

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={enviando} className="mt-2 w-full">
                {enviando ? "Enviando..." : "Enviar link"}
              </Button>

              <Link href="/login" className="text-center text-sm font-medium text-ink-secondary hover:text-ink">
                Voltar pro login
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
