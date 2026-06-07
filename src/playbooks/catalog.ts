import { readFileSync } from "node:fs";
import path from "node:path";
import { CATALOG_PATH, PLAYBOOKS_DIR } from "../paths.js";

export interface PlaybookEntry {
  id: string;
  title: string;
  group: string;
  skill: string;
  source: string;
  snippet: string;
  keywords: string;
}

let _catalog: PlaybookEntry[] | null = null;

export function loadCatalog(): PlaybookEntry[] {
  if (_catalog) return _catalog;
  const raw = readFileSync(CATALOG_PATH, "utf8");
  _catalog = JSON.parse(raw) as PlaybookEntry[];
  return _catalog;
}

export function listGroups(): { group: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of loadCatalog()) counts.set(e.group, (counts.get(e.group) ?? 0) + 1);
  return [...counts.entries()]
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPlaybookById(id: string): { entry: PlaybookEntry; content: string } | null {
  const entry = loadCatalog().find((e) => e.id === id);
  if (!entry) return null;
  try {
    const content = readFileSync(path.join(PLAYBOOKS_DIR, `${id}.md`), "utf8");
    return { entry, content };
  } catch {
    return null;
  }
}

/**
 * Lightweight keyword scorer over the catalog haystack. No external deps —
 * tokenizes the query, scores title/keyword/snippet hits, returns ranked entries.
 */
export function searchPlaybooks(
  query: string,
  opts: { group?: string; limit?: number } = {},
): { entry: PlaybookEntry; score: number }[] {
  const { group, limit = 12 } = opts;
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);

  const pool = group
    ? loadCatalog().filter((e) => e.group === group)
    : loadCatalog();

  if (terms.length === 0) {
    return pool.slice(0, limit).map((entry) => ({ entry, score: 0 }));
  }

  const scored = pool.map((entry) => {
    const title = entry.title.toLowerCase();
    const kw = entry.keywords;
    const snip = entry.snippet.toLowerCase();
    const id = entry.id.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (id.includes(t)) score += 6;
      if (title.includes(t)) score += 5;
      if (kw.includes(t)) score += 3;
      if (snip.includes(t)) score += 1;
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit);
}
