/**
 * Vercel REST API client for programmatic deployment.
 * POST /v13/deployments with inlined files.
 */

const VERCEL_API = "https://api.vercel.com";

export type VercelFile = {
  file: string;
  data: string;
  encoding?: "utf-8" | "base64";
};

export type VercelDeploymentResponse = {
  id: string;
  projectId?: string;
  url?: string;
  readyState?: string;
  alias?: string[];
};

export type VercelDeploymentStatus = {
  id: string;
  url?: string | null;
  readyState?: string;
  status?: string;
  /** Direct link to deployment inspector in Vercel dashboard */
  inspectorUrl?: string | null;
  /** Production/staging aliases assigned when deployment is READY */
  alias?: string[];
};

function requireVercelToken(tokenOverride?: string): string {
  const token = tokenOverride?.trim() || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error(
      "VERCEL_TOKEN is not set. Add it to .env or save a local override in Settings."
    );
  }

  return token;
}

export async function createDeployment(params: {
  name: string;
  files: VercelFile[];
  project?: string;
  target?: "production";
  token?: string;
}): Promise<VercelDeploymentResponse> {
  const token = requireVercelToken(params.token);

  const { name, files, project, target } = params;

  const body: Record<string, unknown> = {
    name,
    files: files.map((f) => ({
      file: f.file,
      data: f.data,
      encoding: f.encoding ?? "utf-8",
    })),
    projectSettings: {
      framework: "nextjs",
      buildCommand: "npm run build",
      outputDirectory: ".next",
      installCommand: "npm install",
    },
    target: target ?? "production",
  };

  if (project) {
    body.project = project;
  }

  const res = await fetch(
    `${VERCEL_API}/v13/deployments?skipAutoDetectionConfirmation=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Vercel API error: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

/** Disable ssoProtection and passwordProtection for a project so preview URLs are publicly accessible. */
export async function disableProjectProtection(params: {
  projectId: string;
  teamId?: string;
  token?: string;
}): Promise<void> {
  const token = requireVercelToken(params.token);

  const { projectId, teamId } = params;
  const searchParams = new URLSearchParams();
  if (teamId) searchParams.set("teamId", teamId);
  const query = searchParams.toString();
  const url = `${VERCEL_API}/v9/projects/${encodeURIComponent(projectId)}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ssoProtection: null,
      passwordProtection: null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Vercel API error: ${res.status} ${res.statusText}`
    );
  }
}

export async function getDeploymentStatus(
  deploymentIdOrUrl: string,
  tokenOverride?: string
): Promise<VercelDeploymentStatus> {
  const token = requireVercelToken(tokenOverride);

  const res = await fetch(
    `${VERCEL_API}/v13/deployments/${encodeURIComponent(deploymentIdOrUrl)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Vercel API error: ${res.status}`
    );
  }

  const data = (await res.json()) as {
    id?: string;
    url?: string | null;
    readyState?: string;
    status?: string;
    inspectorUrl?: string | null;
    alias?: string[];
  };

  return {
    id: data.id ?? deploymentIdOrUrl,
    url: data.url,
    readyState: data.readyState,
    status: data.status,
    inspectorUrl: data.inspectorUrl ?? null,
    alias: data.alias,
  };
}

/** Assign a stable alias to a deployment (deployment must be READY). */
export async function assignDeploymentAlias(params: {
  deploymentId: string;
  alias: string;
  teamId?: string;
  token?: string;
}): Promise<{ alias: string; uid: string }> {
  const token = requireVercelToken(params.token);

  const { deploymentId, alias, teamId } = params;
  const searchParams = new URLSearchParams();
  if (teamId) searchParams.set("teamId", teamId);
  const query = searchParams.toString();
  const url = `${VERCEL_API}/v2/deployments/${encodeURIComponent(deploymentId)}/aliases${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ alias }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Vercel alias API error: ${res.status}`
    );
  }

  const data = (await res.json()) as { alias: string; uid: string };
  return data;
}
