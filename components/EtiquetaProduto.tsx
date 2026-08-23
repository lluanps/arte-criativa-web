"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatarMoeda } from "@/lib/format";
import { Button } from "@/components/ui";
import { IconPrinter, IconX } from "@/components/Icon";

interface EtiquetaProdutoProps {
  produtoId: number;
  nome: string;
  precoVenda: number;
  aberto: boolean;
  onFechar: () => void;
}

/**
 * Modal de etiqueta pra impressão: nome + preço + QR opcional linkando pro produto
 * (útil pra quem já usa o app escanear e cair direto na ficha do produto — exige
 * login, então serve mais pra uso interno/estande do que pro cliente final).
 *
 * Impressão usa `window.print()` com CSS em `globals.css` que esconde tudo, exceto
 * `#etiqueta-imprimir` (`.impressao-etiqueta` no body) — assim não precisa de rota
 * separada nem duplicar layout, o app inteiro já roda dentro do AppShell.
 */
export function EtiquetaProduto({ produtoId, nome, precoVenda, aberto, onFechar }: EtiquetaProdutoProps) {
  const [incluirQr, setIncluirQr] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copias, setCopias] = useState(1);

  useEffect(() => {
    if (!aberto || !incluirQr) {
      setQrDataUrl(null);
      return;
    }
    const url = `${window.location.origin}/estoque/produtos/${produtoId}`;
    QRCode.toDataURL(url, { margin: 1, width: 200 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [aberto, incluirQr, produtoId]);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] print:hidden"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Imprimir etiqueta</h2>
          <button onClick={onFechar} className="text-ink-secondary hover:text-ink">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-3 flex items-center gap-2 text-base text-ink-secondary">
          <input type="checkbox" checked={incluirQr} onChange={(e) => setIncluirQr(e.target.checked)} />
          Incluir QR code (linka pra ficha do produto)
        </label>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-secondary" htmlFor="copias">
            Cópias
          </label>
          <input
            id="copias"
            type="number"
            min={1}
            max={50}
            value={copias}
            onChange={(e) => setCopias(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="w-24 rounded-lg border border-hairline bg-paper px-3 py-1.5 text-base"
          />
        </div>

        {/* Preview na tela — a versão impressa de verdade é a lista logo abaixo (fora de vista, só some o resto da página) */}
        <div className="mb-5 flex justify-center rounded-xl border border-dashed border-hairline bg-paper p-4">
          <Etiqueta nome={nome} preco={precoVenda} qrDataUrl={incluirQr ? qrDataUrl : null} />
        </div>

        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={() => window.print()} className="inline-flex items-center gap-1.5">
            <IconPrinter className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Área real de impressão: uma cópia da etiqueta por unidade pedida. Fica fora da tela
          normalmente (a modal cobre tudo) e só aparece quando o navegador entra em modo print. */}
      <div id="etiqueta-imprimir" className="hidden print:flex print:flex-wrap print:gap-4 print:p-4">
        {Array.from({ length: copias }).map((_, i) => (
          <Etiqueta key={i} nome={nome} preco={precoVenda} qrDataUrl={incluirQr ? qrDataUrl : null} />
        ))}
      </div>
    </div>
  );
}

function Etiqueta({ nome, preco, qrDataUrl }: { nome: string; preco: number; qrDataUrl: string | null }) {
  return (
    <div className="flex w-56 flex-col items-center gap-2 rounded-lg border border-ink/20 p-4 text-center print:break-inside-avoid">
      <p className="line-clamp-2 text-base font-semibold text-ink">{nome}</p>
      <p className="text-lg font-bold text-ink">{formatarMoeda(preco)}</p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem otimização/domínio pra configurar
        <img src={qrDataUrl} alt="" width={96} height={96} />
      )}
    </div>
  );
}
