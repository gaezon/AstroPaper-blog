import type { Page } from "@playwright/test";

export type JsonLdNode = Record<string, unknown>;

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

function isRecord(value: unknown): value is JsonLdNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectNodesFromDocument(document: unknown): JsonLdNode[] {
  if (Array.isArray(document)) {
    return document.filter(isRecord).flatMap(collectNodesFromDocument);
  }

  if (!isRecord(document)) {
    return [];
  }

  const graph = document["@graph"];
  if (Array.isArray(graph)) {
    return graph.filter(isRecord);
  }

  if (isRecord(graph)) {
    return [graph];
  }

  return [document];
}

export function parseJsonLdDocument(source: string): unknown {
  return JSON.parse(source);
}

export function parseJsonLdNodes(source: string): JsonLdNode[] {
  return collectNodesFromDocument(parseJsonLdDocument(source));
}

export function parseJsonLdNodesSafely(source: string): JsonLdNode[] {
  try {
    return parseJsonLdNodes(source);
  } catch {
    return [];
  }
}

export function hasJsonLdType(node: JsonLdNode, expectedType: string): boolean {
  const rawType = node["@type"];
  if (typeof rawType === "string") {
    return rawType === expectedType;
  }
  if (Array.isArray(rawType)) {
    return rawType.includes(expectedType);
  }
  return false;
}

export function findFirstJsonLdNodeByType(
  nodes: JsonLdNode[],
  expectedType: string
): JsonLdNode | undefined {
  return nodes.find(node => hasJsonLdType(node, expectedType));
}

export async function getJsonLdScriptContents(page: Page): Promise<string[]> {
  return page.locator(JSON_LD_SELECTOR).allTextContents();
}

export async function getJsonLdNodes(page: Page): Promise<JsonLdNode[]> {
  const scripts = await getJsonLdScriptContents(page);
  return scripts.flatMap(parseJsonLdNodesSafely);
}
