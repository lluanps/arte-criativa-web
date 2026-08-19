import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Autoriza uploads diretos do navegador pro Vercel Blob (o arquivo nunca passa por
 * este servidor, só o token de permissão). Só funciona quando o projeto tem um Blob
 * store conectado na Vercel (Storage → Create → Blob) — a variável
 * BLOB_READ_WRITE_TOKEN é injetada sozinha nesse momento, nada pra configurar aqui.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        addRandomSuffix: true,
        maximumSizeInBytes: 8 * 1024 * 1024, // 8MB
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
