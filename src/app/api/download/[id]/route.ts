import { NextResponse } from "next/server";
import { getDownloadCache } from "@/lib/download-cache";
import {
  isValidDownloadId,
  sanitizeContentDispositionFilename,
} from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  if (!isValidDownloadId(id)) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const cached = await getDownloadCache(id);

  if (!cached) {
    console.warn("[download] cache miss", { downloadId: id });
    return NextResponse.json(
      { error: "Download expired or not found" },
      { status: 404 }
    );
  }

  console.info("[download] serving zip", {
    downloadId: id,
    filename: cached.filename,
    size: cached.buffer.length,
  });

  const safeFilename = sanitizeContentDispositionFilename(cached.filename);

  return new NextResponse(new Uint8Array(cached.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Content-Length": String(cached.buffer.length),
    },
  });
}
