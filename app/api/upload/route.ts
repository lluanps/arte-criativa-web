import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * Upload de foto (Ideias): o arquivo passa pelo nosso servidor (multipart/form-data)
 * e é gravado no Blob a partir daqui, com put() do SDK server-side — em vez do fluxo
 * de "client upload" (navegador → vercel.com/api/blob direto), que se mostrou instável
 * (trava sem nunca resolver em certos casos). Fotos são pequenas o bastante pra isso
 * não pesar no tempo de resposta da função.
 *
 * Só funciona quando o projeto tem um Blob store conectado na Vercel (Storage →
 * Create → Blob) — a variável BLOB_READ_WRITE_TOKEN é injetada sozinha nesse momento.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const arquivo = form.get("file");

    if (!(arquivo instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json({ error: `Tipo de arquivo não permitido: ${arquivo.type}` }, { status: 400 });
    }

    const tamanhoMaximo = 8 * 1024 * 1024; // 8MB
    if (arquivo.size > tamanhoMaximo) {
      return NextResponse.json({ error: "Imagem maior que 8MB" }, { status: 400 });
    }

    const blob = await put(arquivo.name, arquivo, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Erro ao enviar foto pro Blob:", error);
    const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
