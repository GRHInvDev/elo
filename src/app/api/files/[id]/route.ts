import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 });
    }

    const file = await db.storedFile.findFirst({
      where: {
        OR: [
          { id: id },
          { fileHash: id },
        ],
        isActive: true,
      },
      select: {
        id: true,
        mimeType: true,
        fileSize: true,
        fileHash: true,
        base64Data: true,
        fileName: true,
      },
    });

    if (!file?.base64Data) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    const clientEtag = request.headers.get("if-none-match");
    if (clientEtag && clientEtag === `"${file.fileHash}"`) {
      return new NextResponse(null, { status: 304 });
    }

    let base64Content = file.base64Data;
    if (base64Content.includes(",")) {
      base64Content = base64Content.split(",")[1] ?? "";
    }

    const buffer = Buffer.from(base64Content, "base64");

    const headers = new Headers();
    headers.set("Content-Type", file.mimeType || "application/octet-stream");
    headers.set("Content-Length", buffer.length.toString());
    headers.set("ETag", `"${file.fileHash}"`);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    if (file.fileName) {
      const sanitizedName = encodeURIComponent(file.fileName);
      headers.set("Content-Disposition", `inline; filename="${sanitizedName}"`);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[GET /api/files/[id]] Erro ao entregar arquivo:", error);
    return NextResponse.json({ error: "Erro interno ao processar arquivo" }, { status: 500 });
  }
}
