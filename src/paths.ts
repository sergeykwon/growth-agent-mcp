import path from "node:path";
import { fileURLToPath } from "node:url";

// This file compiles to `dist/paths.js`, so the package root is one level up
// from the compiled file's directory, and the bundled corpus lives in `data/`.
const here = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(here, "..");
export const DATA_DIR = path.join(PACKAGE_ROOT, "data");
export const PLAYBOOKS_DIR = path.join(DATA_DIR, "playbooks");
export const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");
