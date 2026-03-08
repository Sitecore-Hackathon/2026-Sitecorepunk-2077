import type { ManifestEntry } from "@/types";

/**
 * Build a prompt section listing verified mutation templates when no schema is available.
 * The LLM must use ONLY these templates — no freehand GraphQL construction.
 */
export function buildVerifiedManifestSection(manifest: ManifestEntry[]): string {
  if (manifest.length === 0) return "";

  let section = `\n## VERIFIED_GRAPHQL_MUTATIONS — Use Only These Templates\n\n`;
  section += `When no schema is available, you MUST use ONLY the following verified mutation templates.\n`;
  section += `Do NOT construct GraphQL from scratch. Copy and adapt these templates.\n\n`;

  for (const entry of manifest) {
    if (!entry.query.trimStart().startsWith("mutation")) continue;
    section += `### \`${entry.id}\` (${entry.endpoint}, context: ${entry.contextType})\n`;
    section += `${entry.description}\n`;
    section += "```graphql\n" + entry.query + "\n```\n";
    section += `Variable types: \`${JSON.stringify(entry.variableTypes)}\`\n\n`;
  }

  return section;
}

// ─── Fallback Warning ────────────────────────────────────────────────────────

/**
 * Fallback warning injected when no usable schema data is available (demo mode,
 * introspection failure, or empty schema result).
 * When used, the VERIFIED_GRAPHQL_MUTATIONS section is injected BEFORE this.
 */
export const NO_SCHEMA_WARNING = `
## NO LIVE SCHEMA AVAILABLE

Vibecore could not introspect the GraphQL schema from the Sitecore instance.
You MUST use ONLY the verified mutations listed in VERIFIED_GRAPHQL_MUTATIONS above.

### CRITICAL: createItem GUID Rule
For \`createItem\`, \`templateId\` and \`parent\` MUST be Sitecore GUIDs (e.g. \`{76036F5E-CBCE-46D1-AF0A-4143F9B557AA}\`).
Passing a path like \`/sitecore/content/Home\` causes \`"Unable to convert type from String to Guid"\`.

### STRICT RULES WHEN NO SCHEMA IS AVAILABLE:
1. Use ONLY the verified mutation templates from VERIFIED_GRAPHQL_MUTATIONS. Do NOT construct new mutations.
2. For **Authoring API** queries: You may use only these well-established item fields:
   \`itemId\`, \`name\`, \`path\`, \`displayName\`, \`fields { nodes { name value } }\`,
   \`children { nodes { ... } }\`. These are well-known Sitecore authoring fields.
3. For **Experience Edge / Live API** (\`xmc.live.graphql\`): Do NOT construct GraphQL
   queries with unverified fields. Instead, generate a TODO comment explaining that
   the live schema was unavailable and the query needs to be verified:
   \`// TODO: Live GraphQL query — schema introspection was unavailable. Verify available fields before using.\`
4. Do NOT guess or invent any field names, type names, or argument names.
5. Do NOT use the \`rendered\` field — it may not exist in all Sitecore configurations.
6. If the user's requirements need fields you cannot verify, add clear comments
   explaining the limitation rather than guessing.
`;
