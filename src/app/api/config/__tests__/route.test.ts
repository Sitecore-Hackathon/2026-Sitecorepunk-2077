import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("GET /api/config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns autoRedeployOnRefinement true when env is unset", async () => {
    delete process.env.VIBECORE_AUTO_REDEPLOY;

    const { GET } = await import("@/app/api/config/route");
    const response = await GET(new Request("http://localhost/api/config"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("autoRedeployOnRefinement");
    expect(data.autoRedeployOnRefinement).toBe(true);
  });

  it("returns autoRedeployOnRefinement false when env is false", async () => {
    process.env.VIBECORE_AUTO_REDEPLOY = "false";

    const { GET } = await import("@/app/api/config/route");
    const response = await GET(new Request("http://localhost/api/config"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.autoRedeployOnRefinement).toBe(false);
  });

  it("returns autoRedeployOnRefinement true when env is true", async () => {
    process.env.VIBECORE_AUTO_REDEPLOY = "true";

    const { GET } = await import("@/app/api/config/route");
    const response = await GET(new Request("http://localhost/api/config"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.autoRedeployOnRefinement).toBe(true);
  });
});
