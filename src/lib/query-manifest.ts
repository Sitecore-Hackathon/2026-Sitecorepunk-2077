import type { ManifestEntry } from "@/types";

/**
 * Pre-validated GraphQL query templates that are known to work with
 * SitecoreAI endpoints. The LLM should prefer these over
 * constructing new queries from the schema.
 */
export const GRAPHQL_QUERY_MANIFEST: ManifestEntry[] = [
  // ─── Authoring API Queries ────────────────────────────────────────────

  {
    id: "getItemByPath",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Get a single item by path with all its fields (name-value pairs)",
    query: `query GetItem($path: String!, $language: String!) {
  item(where: { path: $path, language: $language }) {
    itemId
    name
    path
    displayName
    fields {
      nodes {
        name
        value
      }
    }
  }
}`,
    variableTypes: { path: "String!", language: "String!" },
  },

  {
    id: "getItemChildren",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Get an item and its children with basic fields",
    query: `query GetItemChildren($path: String!, $language: String!) {
  item(where: { path: $path, language: $language }) {
    itemId
    name
    path
    children {
      nodes {
        itemId
        name
        path
        displayName
        fields {
          nodes {
            name
            value
          }
        }
      }
    }
  }
}`,
    variableTypes: { path: "String!", language: "String!" },
  },

  // ─── Authoring API Mutations ──────────────────────────────────────────

  {
    id: "createItem",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Create a new item under a parent with template and field values. " +
      "CRITICAL: templateId and parent MUST be Sitecore item GUIDs (e.g. {76036F5E-CBCE-46D1-AF0A-4143F9B557AA}), NOT paths. " +
      "Passing a path like /sitecore/content/Home causes 'Unable to convert type from String to Guid'.",
    query: `mutation CreateItem(
  $templateId: ID!
  $parent: ID!
  $name: String!
  $language: String!
  $fields: [FieldValueInput!]!
) {
  createItem(
    input: {
      templateId: $templateId
      parent: $parent
      name: $name
      language: $language
      fields: $fields
    }
  ) {
    item {
      itemId
      path
    }
  }
}`,
    variableTypes: {
      templateId: "ID!",
      parent: "ID!",
      name: "String!",
      language: "String!",
      fields: "[FieldValueInput!]!",
    },
  },

  {
    id: "updateItemById",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Update field values on an existing item by itemId (GUID). itemId MUST be a Sitecore GUID, not a path.",
    query: `mutation UpdateItemById(
  $itemId: ID!
  $language: String!
  $fields: [FieldValueInput!]!
) {
  updateItem(
    input: {
      itemId: $itemId
      language: $language
      fields: $fields
    }
  ) {
    item {
      itemId
      path
    }
  }
}`,
    variableTypes: {
      itemId: "ID!",
      language: "String!",
      fields: "[FieldValueInput!]!",
    },
  },

  {
    id: "updateItemByPath",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Update field values on an existing item by path and language.",
    query: `mutation UpdateItemByPath(
  $path: String!
  $language: String!
  $fields: [FieldValueInput!]!
) {
  updateItem(
    input: {
      path: $path
      language: $language
      fields: $fields
    }
  ) {
    item {
      itemId
      path
    }
  }
}`,
    variableTypes: {
      path: "String!",
      language: "String!",
      fields: "[FieldValueInput!]!",
    },
  },

  {
    id: "updateItemAlt",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Update field values on an existing item by name and path.",
    query: `mutation UpdateItemAlt(
  $name: String!
  $path: String!
  $language: String!
  $fields: [FieldValueInput!]!
) {
  updateItem(
    input: {
      name: $name
      path: $path
      language: $language
      fields: $fields
    }
  ) {
    item {
      itemId
      path
    }
  }
}`,
    variableTypes: {
      name: "String!",
      path: "String!",
      language: "String!",
      fields: "[FieldValueInput!]!",
    },
  },

  {
    id: "updateItemAltId",
    endpoint: "xmc.authoring.graphql",
    contextType: "preview",
    description:
      "Update field values on an existing item by id (GUID). id MUST be a Sitecore GUID.",
    query: `mutation UpdateItemAltId(
  $id: ID!
  $language: String!
  $fields: [FieldValueInput!]!
) {
  updateItem(
    input: {
      id: $id
      language: $language
      fields: $fields
    }
  ) {
    item {
      itemId
      path
    }
  }
}`,
    variableTypes: {
      id: "ID!",
      language: "String!",
      fields: "[FieldValueInput!]!",
    },
  },

  // ─── Experience Edge Queries (Live / Published Content) ───────────────

  {
    id: "getLayout",
    endpoint: "xmc.live.graphql",
    contextType: "live",
    description:
      "Get the layout for a page via Experience Edge. The selection set " +
      "uses only 'id' as a safe default — consult GRAPHQL_SCHEMA_JSON " +
      "for additional available fields on the layout item type.",
    query: `query GetLayout(
  $siteName: String!
  $routePath: String!
  $language: String!
) {
  layout(
    site: $siteName
    routePath: $routePath
    language: $language
  ) {
    item {
      id
    }
  }
}`,
    variableTypes: {
      siteName: "String!",
      routePath: "String!",
      language: "String!",
    },
  },

  {
    id: "getPreviewLayout",
    endpoint: "xmc.preview.graphql",
    contextType: "preview",
    description:
      "Get the layout for a draft/preview page. The selection set " +
      "uses only 'id' as a safe default — consult GRAPHQL_SCHEMA_JSON " +
      "for additional available fields on the layout item type.",
    query: `query GetPreviewLayout(
  $siteName: String!
  $routePath: String!
  $language: String!
) {
  layout(
    site: $siteName
    routePath: $routePath
    language: $language
  ) {
    item {
      id
    }
  }
}`,
    variableTypes: {
      siteName: "String!",
      routePath: "String!",
      language: "String!",
    },
  },
];

/**
 * Filter the manifest to only include entries relevant to the selected features.
 */
export function getManifestForFeatures(features: string[]): ManifestEntry[] {
  return GRAPHQL_QUERY_MANIFEST.filter((entry) => {
    if (entry.endpoint === "xmc.authoring.graphql") {
      if (entry.query.trimStart().startsWith("mutation")) {
        return features.includes("graphql-write");
      }
      return (
        features.includes("graphql-read") ||
        features.includes("graphql-write")
      );
    }
    if (
      entry.endpoint === "xmc.live.graphql" ||
      entry.endpoint === "xmc.preview.graphql"
    ) {
      return features.includes("live-content");
    }
    return false;
  });
}
