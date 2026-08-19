"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button, Input } from "@/components/ui";
import { IconX } from "@/components/Icon";

/**
 * Galeria de fotos com duas formas de adicionar: enviar arquivo (sobe direto pro
 * Vercel Blob, via /api/upload) ou colar um link já pronto. O upload só funciona
 * depois que o Blob store for conectado ao projeto na Vercel — até lá, colar link
 * continua funcionando normalmente.
 */
export function GaleriaFotos({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const [link, setLink] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  function adicionarLink() {
    if (!link.trim()) return;
    onChange([...urls, link.trim()]);
    setLink("");
  }

  function remover(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite selecionar o mesmo arquivo de novo depois, se precisar
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const blob = await upload(arquivo.name, arquivo, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange([...urls, blob.url]);
    } catch {
      setErro("Não deu pra enviar a imagem. Confira se o armazenamento (Blob) já foi ativado na Vercel.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {urls.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, index) => (
            <div
              key={url + index}
              className="group relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-hover"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL dinâmica (Blob ou link externo colado), sem domínio fixo pra configurar no next/image */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remover(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover foto"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="mb-2 text-sm text-critical">{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputArquivoRef} type="file" accept="image/*" className="hidden" onChange={aoSelecionarArquivo} />
        <Button type="button" variant="secondary" onClick={() => inputArquivoRef.current?.click()} disabled={enviando}>
          {enviando ? "Enviando..." : "📷 Enviar foto"}
        </Button>
        <Input
          placeholder="ou cole um link de imagem"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="min-w-[180px] flex-1"
        />
        <Button type="button" variant="secondary" onClick={adicionarLink}>
          Adicionar link
        </Button>
      </div>
    </div>
  );
}
