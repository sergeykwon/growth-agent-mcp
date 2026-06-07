#!/usr/bin/env node
/**
 * sync-playbooks.mjs
 *
 * Copies the growth skill markdown corpus into this package's `data/playbooks/`
 * and generates `data/catalog.json`, the index the `growth_playbook` tool serves.
 *
 * Usage:
 *   node scripts/sync-playbooks.mjs <SKILLS_DIR>
 *   GROWTH_SKILLS_DIR=/path/to/.claude/skills node scripts/sync-playbooks.mjs
 *
 * SKILLS_DIR is the source `.claude/skills` directory (passed as the first
 * argument or via the GROWTH_SKILLS_DIR env var). This is an internal
 * maintenance script used to refresh the bundled corpus from the source skills;
 * end users never need to run it.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PKG_ROOT, "data", "playbooks");
const CATALOG_PATH = path.join(PKG_ROOT, "data", "catalog.json");

const SKILLS_DIR = process.argv[2] || process.env.GROWTH_SKILLS_DIR;

if (!SKILLS_DIR) {
  console.error(
    "[sync] no skills dir provided.\n" +
      "  Usage: node scripts/sync-playbooks.mjs <SKILLS_DIR>\n" +
      "     or: GROWTH_SKILLS_DIR=/path/to/.claude/skills node scripts/sync-playbooks.mjs",
  );
  process.exit(1);
}

// Which skill folders to ingest, and the friendly group each belongs to.
const SKILL_GROUPS = [
  { match: /^growth-marketing$/, group: "growth-marketing" },
  { match: /^ads(-.*)?$/, group: "ads" },
  { match: /^pmf-.*/, group: "pmf" },
  { match: /^seo-audit$/, group: "seo" },
];

function groupFor(skill) {
  for (const g of SKILL_GROUPS) if (g.match.test(skill)) return g.group;
  return null;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/\.md$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripFrontmatter(text) {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      return { frontmatter: text.slice(0, after), body: text.slice(after + 1) };
    }
  }
  return { frontmatter: "", body: text };
}

function parseFrontmatterField(fm, field) {
  const re = new RegExp(`^${field}:\\s*(.+)$`, "mi");
  const m = fm.match(re);
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function firstHeading(body) {
  const m = body.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function snippetOf(body, n = 320) {
  const cleaned = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > n ? cleaned.slice(0, n).trimEnd() + "…" : cleaned;
}

async function walkMarkdown(dir, base = dir, acc = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      await walkMarkdown(full, base, acc);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      acc.push({ full, rel: path.relative(base, full) });
    }
  }
  return acc;
}

async function main() {
  console.error(`[sync] source skills dir: ${SKILLS_DIR}`);
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const skillDirs = (await fs.readdir(SKILLS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && groupFor(d.name))
    .map((d) => d.name)
    .sort();

  const catalog = [];
  const seenIds = new Set();
  let copied = 0;

  for (const skill of skillDirs) {
    const group = groupFor(skill);
    const skillPath = path.join(SKILLS_DIR, skill);
    const files = await walkMarkdown(skillPath);

    for (const { full, rel } of files) {
      const raw = await fs.readFile(full, "utf8");
      const { frontmatter, body } = stripFrontmatter(raw);

      // ID: SKILL.md -> <skill>; references/foo.md -> <skill>-foo
      let id;
      if (/^skill\.md$/i.test(rel)) {
        id = slugify(skill);
      } else {
        const relNoExt = rel.replace(/\.md$/i, "").replace(/^references\//i, "");
        id = `${slugify(skill)}-${slugify(relNoExt)}`;
      }
      // Disambiguate rare collisions.
      let unique = id;
      let i = 2;
      while (seenIds.has(unique)) unique = `${id}-${i++}`;
      id = unique;
      seenIds.add(id);

      const fmName = parseFrontmatterField(frontmatter, "name");
      const fmDesc = parseFrontmatterField(frontmatter, "description");
      const title = firstHeading(body) || fmName || id;
      const snippet = fmDesc || snippetOf(body);

      // Searchable haystack for the retrieval tool.
      const keywords = Array.from(
        new Set(
          `${id} ${title} ${skill} ${group} ${fmDesc}`
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((t) => t.length > 2),
        ),
      ).join(" ");

      await fs.writeFile(path.join(OUT_DIR, `${id}.md`), raw, "utf8");
      copied++;

      catalog.push({
        id,
        title,
        group,
        skill,
        source: rel,
        snippet,
        keywords,
      });
    }
  }

  catalog.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");

  const byGroup = catalog.reduce((m, c) => {
    m[c.group] = (m[c.group] || 0) + 1;
    return m;
  }, {});
  console.error(`[sync] copied ${copied} playbooks across ${skillDirs.length} skills`);
  console.error(`[sync] by group: ${JSON.stringify(byGroup)}`);
  console.error(`[sync] catalog: ${CATALOG_PATH}`);
}

main().catch((err) => {
  console.error("[sync] fatal:", err);
  process.exit(1);
});
