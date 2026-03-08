import { NextRequest, NextResponse } from "next/server";
import { getDeploymentStatus } from "@/lib/deploy/vercel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Deployment ID required" },
      { status: 400 }
    );
  }

  try {
    const rawToken = req.headers.get("x-vibecore-vercel-token")?.trim();
    const tokenOverride =
      rawToken && /^[A-Za-z0-9_]{20,}$/.test(rawToken) ? rawToken : undefined;
    const status = await getDeploymentStatus(id, tokenOverride);
    return NextResponse.json(status);
  } catch (e) {
    console.error("Deployment status error:", e);
    const message = e instanceof Error ? e.message : "Failed to get status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
