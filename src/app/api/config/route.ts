import { NextResponse } from "next/server";

/**
 * Returns client-visible configuration derived from server env vars.
 * Used for behavioral toggles (e.g. auto-redeploy) that the client needs to read.
 */
export async function GET(): Promise<NextResponse> {
  const autoRedeploy =
    process.env.VIBECORE_AUTO_REDEPLOY?.toLowerCase() !== "false";

  return NextResponse.json({
    autoRedeployOnRefinement: autoRedeploy,
  });
}
