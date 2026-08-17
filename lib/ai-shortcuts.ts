import { formatarMoeda } from "@/lib/format";

interface DadosProduto {
  nome: string;
  categoriaNome?: string | null;
  volumeMl?: number | null;
  precoVenda: number;
}

/**
 * Atalhos que abrem o ChatGPT/Canva numa aba nova, já com um prompt/contexto pronto
 * a partir dos dados do produto que já estão no formulário — sem chamar nenhuma API
 * (zero custo, zero dependência nova no backend). O cliente continua usando as
 * ferramentas do jeito que já usa, só sem precisar digitar tudo de novo.
 */

function linhasContexto(produto: DadosProduto): string {
  const linhas = [`- Nome: ${produto.nome || "(sem nome ainda)"}`];
  if (produto.categoriaNome) linhas.push(`- Categoria: ${produto.categoriaNome}`);
  if (produto.volumeMl) linhas.push(`- Volume: ${produto.volumeMl}ml`);
  if (produto.precoVenda > 0) linhas.push(`- Preço: ${formatarMoeda(produto.precoVenda)}`);
  return linhas.join("\n");
}

function abrirChatGPT(prompt: string) {
  const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function gerarDescricaoComChatGPT(produto: DadosProduto) {
  const prompt = `Escreva 3 opções curtas de descrição de venda para este produto artesanal (pra usar como legenda de rede social e ficha de produto):

${linhasContexto(produto)}

Tom caloroso e direto, sem exagero, destacando que é feito à mão. No máximo 2-3 frases por opção.`;
  abrirChatGPT(prompt);
}

export function gerarImagemComChatGPT(produto: DadosProduto) {
  const prompt = `Gere uma imagem de divulgação para este produto artesanal:

${linhasContexto(produto)}

Estilo: fotografia de produto profissional, fundo neutro claro, boa iluminação, foco total no produto, sem texto sobreposto na imagem.`;
  abrirChatGPT(prompt);
}

export function criarArteNoCanva() {
  // Categoria de template pensada pra divulgação de produto (post de rede social).
  // Sem integração registrada no Canva Developers não dá pra pré-preencher o nome do
  // produto como texto dentro do design — só abrir já na categoria certa.
  window.open("https://www.canva.com/create/instagram-posts/", "_blank", "noopener,noreferrer");
}
