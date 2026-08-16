"use client";

import { useState } from "react";
import { formatarMoeda, formatarMoedaCompacta } from "@/lib/format";
import { PontoFluxoCaixa } from "@/lib/charts";

// Cores de status fixas (nunca seguem tema categórico): receita = "good",
// despesa = "critical" — mesmo par usado nos Badge/StatCard do módulo Financeiro.
const COR_RECEITA = "#0ca30c";
const COR_DESPESA = "#d03b3b";
const COR_GRADE = "#e1e0d9";
const COR_EIXO = "#c3c2b7";
const COR_TEXTO_MUTED = "#898781";

const LARGURA = 720;
const ALTURA = 280;
const MARGEM = { top: 16, right: 16, bottom: 32, left: 56 };
const LARGURA_UTIL = LARGURA - MARGEM.left - MARGEM.right;
const ALTURA_UTIL = ALTURA - MARGEM.top - MARGEM.bottom;
const LARGURA_MAX_BARRA = 24;
const ESPACO_ENTRE_BARRAS = 2;
const RAIO_TOPO = 4;

function gerarTicks(max: number, contagem = 4): number[] {
  if (max <= 0) return [0];
  const passoBruto = max / contagem;
  const magnitude = 10 ** Math.floor(Math.log10(passoBruto));
  const residuo = passoBruto / magnitude;
  const passoNormalizado = residuo >= 5 ? 10 : residuo >= 2 ? 5 : residuo >= 1 ? 2 : 1;
  const passo = passoNormalizado * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max + passo * 0.001; v += passo) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Path de uma barra com cantos arredondados só no topo — quadrada na base (baseline). */
function pathBarra(x: number, yTopo: number, largura: number, altura: number): string {
  if (altura <= 0) return "";
  const r = Math.min(RAIO_TOPO, largura / 2, altura);
  const yBase = yTopo + altura;
  return `M${x},${yBase} L${x},${yTopo + r} Q${x},${yTopo} ${x + r},${yTopo} L${x + largura - r},${yTopo} Q${x + largura},${yTopo} ${x + largura},${yTopo + r} L${x + largura},${yBase} Z`;
}

export function FluxoCaixaChart({ pontos }: { pontos: PontoFluxoCaixa[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const valorMaximo = Math.max(1, ...pontos.flatMap((p) => [p.receitas, p.despesas]));
  const ticks = gerarTicks(valorMaximo);
  const escalaMaxima = ticks[ticks.length - 1];
  const y = (valor: number) => ALTURA_UTIL - (valor / escalaMaxima) * ALTURA_UTIL;

  const larguraBanda = pontos.length > 0 ? LARGURA_UTIL / pontos.length : 0;
  const larguraBarra = Math.min(LARGURA_MAX_BARRA, (larguraBanda - ESPACO_ENTRE_BARRAS - 8) / 2);

  // Mostra só parte dos rótulos do eixo X pra não amontoar quando há muitos pontos.
  const passoRotulo = Math.max(1, Math.ceil(pontos.length / 12));

  const hover = hoverIndex !== null ? pontos[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? MARGEM.left + hoverIndex * larguraBanda + larguraBanda / 2 : 0;

  if (pontos.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sem lançamentos no período.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COR_RECEITA }} />
          Receita
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COR_DESPESA }} />
          Despesa
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} width={LARGURA} height={ALTURA} role="img" aria-label="Fluxo de caixa por período: receitas e despesas">
          <g transform={`translate(${MARGEM.left},${MARGEM.top})`}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={0} x2={LARGURA_UTIL} y1={y(tick)} y2={y(tick)} stroke={COR_GRADE} strokeWidth={1} />
                <text x={-8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={COR_TEXTO_MUTED}>
                  {formatarMoedaCompacta(tick)}
                </text>
              </g>
            ))}
            <line x1={0} x2={LARGURA_UTIL} y1={ALTURA_UTIL} y2={ALTURA_UTIL} stroke={COR_EIXO} strokeWidth={1} />

            {pontos.map((ponto, index) => {
              const xBanda = index * larguraBanda;
              const xReceita = xBanda + larguraBanda / 2 - larguraBarra - ESPACO_ENTRE_BARRAS / 2;
              const xDespesa = xBanda + larguraBanda / 2 + ESPACO_ENTRE_BARRAS / 2;
              const alturaReceita = ALTURA_UTIL - y(ponto.receitas);
              const alturaDespesa = ALTURA_UTIL - y(ponto.despesas);
              const mostrarRotulo = index % passoRotulo === 0;

              return (
                <g key={ponto.chave}>
                  <path d={pathBarra(xReceita, y(ponto.receitas), larguraBarra, alturaReceita)} fill={COR_RECEITA} opacity={hoverIndex === null || hoverIndex === index ? 1 : 0.45} />
                  <path d={pathBarra(xDespesa, y(ponto.despesas), larguraBarra, alturaDespesa)} fill={COR_DESPESA} opacity={hoverIndex === null || hoverIndex === index ? 1 : 0.45} />
                  {mostrarRotulo && (
                    <text x={xBanda + larguraBanda / 2} y={ALTURA_UTIL + 16} textAnchor="middle" fontSize={11} fill={COR_TEXTO_MUTED}>
                      {ponto.rotulo}
                    </text>
                  )}
                  {/* hit area do grupo inteiro (as duas barras + folga) — mark é o alvo de hover, sem crosshair */}
                  <rect
                    x={xBanda}
                    y={0}
                    width={larguraBanda}
                    height={ALTURA_UTIL}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onFocus={() => setHoverIndex(index)}
                    onBlur={() => setHoverIndex(null)}
                    tabIndex={0}
                    role="img"
                    aria-label={`${ponto.rotulo}: receita ${formatarMoeda(ponto.receitas)}, despesa ${formatarMoeda(ponto.despesas)}`}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{ left: hoverX, top: MARGEM.top }}
          >
            <p className="mb-1 font-medium text-neutral-900">{hover.rotulo}</p>
            <p className="flex items-center gap-1.5 text-neutral-700">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: COR_RECEITA }} />
              Receita <strong className="ml-auto text-neutral-900">{formatarMoeda(hover.receitas)}</strong>
            </p>
            <p className="flex items-center gap-1.5 text-neutral-700">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: COR_DESPESA }} />
              Despesa <strong className="ml-auto text-neutral-900">{formatarMoeda(hover.despesas)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
