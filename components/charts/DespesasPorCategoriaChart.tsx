"use client";

import { useState } from "react";
import { formatarMoeda } from "@/lib/format";
import { FatiaCategoria } from "@/lib/charts";

// Ranking por magnitude → cor sequencial de hue único (o comprimento da barra já
// carrega o valor; a cor não precisa variar por linha). Muda de tom no escuro via
// CSS custom property (ver globals.css), cascata pura, sem re-render em JS.
const COR_BARRA = "var(--accent)";
const COR_TEXTO_MUTED = "var(--ink-faint)";
const COR_TEXTO_SECUNDARIO = "var(--ink-secondary)";

const LARGURA = 720;
const ALTURA_LINHA = 32;
const MARGEM = { top: 4, right: 88, bottom: 4, left: 152 };
const LARGURA_UTIL = LARGURA - MARGEM.left - MARGEM.right;
const ALTURA_BARRA = 20;
const RAIO_PONTA = 4;

/** Path de uma barra horizontal com cantos arredondados só na ponta (extremo do valor). */
function pathBarra(x: number, y: number, largura: number, altura: number): string {
  if (largura <= 0) return "";
  const r = Math.min(RAIO_PONTA, largura, altura / 2);
  return `M${x},${y} L${x + largura - r},${y} Q${x + largura},${y} ${x + largura},${y + r} L${x + largura},${y + altura - r} Q${x + largura},${y + altura} ${x + largura - r},${y + altura} L${x},${y + altura} Z`;
}

export function DespesasPorCategoriaChart({ fatias }: { fatias: FatiaCategoria[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (fatias.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-secondary">Sem despesas no período.</p>;
  }

  const valorMaximo = Math.max(1, ...fatias.map((f) => f.valor));
  const altura = fatias.length * ALTURA_LINHA + MARGEM.top + MARGEM.bottom;
  const x = (valor: number) => (valor / valorMaximo) * LARGURA_UTIL;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${LARGURA} ${altura}`} width={LARGURA} height={altura} role="img" aria-label="Despesas por categoria no período">
        <g transform={`translate(${MARGEM.left},${MARGEM.top})`}>
          {fatias.map((fatia, index) => {
            const yLinha = index * ALTURA_LINHA;
            const yBarra = yLinha + (ALTURA_LINHA - ALTURA_BARRA) / 2;
            const larguraBarra = x(fatia.valor);
            const emFoco = hoverIndex === null || hoverIndex === index;

            return (
              <g key={fatia.categoria}>
                <text x={-12} y={yLinha + ALTURA_LINHA / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={COR_TEXTO_SECUNDARIO}>
                  {fatia.categoria.length > 20 ? `${fatia.categoria.slice(0, 19)}…` : fatia.categoria}
                </text>
                <path d={pathBarra(0, yBarra, larguraBarra, ALTURA_BARRA)} fill={COR_BARRA} opacity={emFoco ? 1 : 0.45} />
                <text x={larguraBarra + 8} y={yLinha + ALTURA_LINHA / 2} dominantBaseline="middle" fontSize={12} fill={COR_TEXTO_MUTED}>
                  {formatarMoeda(fatia.valor)}
                </text>
                <rect
                  x={0}
                  y={yLinha}
                  width={LARGURA_UTIL + MARGEM.right}
                  height={ALTURA_LINHA}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(index)}
                  onBlur={() => setHoverIndex(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${fatia.categoria}: ${formatarMoeda(fatia.valor)}`}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
