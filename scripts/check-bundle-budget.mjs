#!/usr/bin/env node
/**
 * check-bundle-budget.mjs
 *
 * Measures gzip size of built JS chunks under dist/assets and fails the
 * build if the "initial" payload exceeds the budget.
 *
 * Heuristic for "initial":
 *   entry chunk + the react-vendor chunk (always loaded with the entry).
 * Other vendor chunks (supabase, radix, dnd-kit, tanstack, forms, icons,
 * dates, generic vendor) are deferred via lazy routes and excluded.
 *
 * Budget: 220 KB gz (200 KB target + 10% margin).
 *
 * Usage: node scripts/check-bundle-budget.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const ASSETS_DIR = join(ROOT, "dist", "assets");
const BUDGET_KB = 220;
const BUDGET_BYTES = BUDGET_KB * 1024;

if (!existsSync(ASSETS_DIR)) {
  console.error(`[bundle-budget] dist/assets not found at ${ASSETS_DIR}`);
  console.error("Run `vite build` first.");
  process.exit(1);
}

/** @typedef {{ file: string; rawBytes: number; gzBytes: number }} ChunkInfo */

/** @type {ChunkInfo[]} */
const chunks = readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith(".js"))
  .map((f) => {
    const full = join(ASSETS_DIR, f);
    const raw = readFileSync(full);
    return {
      file: basename(full),
      rawBytes: statSync(full).size,
      gzBytes: gzipSync(raw).length,
    };
  })
  .sort((a, b) => b.gzBytes - a.gzBytes);

if (chunks.length === 0) {
  console.error("[bundle-budget] No .js chunks in dist/assets — nothing to check.");
  process.exit(1);
}

const fmtKB = (b) => (b / 1024).toFixed(1).padStart(7) + " KB";

// Identify entry: Vite emits entry as `index-<hash>.js` (or whatever index.html points to).
// Fallback: the chunk file referenced from dist/index.html as entry script.
function findEntryFromHtml() {
  const htmlPath = join(ROOT, "dist", "index.html");
  if (!existsSync(htmlPath)) return null;
  const html = readFileSync(htmlPath, "utf8");
  const match = html.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/);
  return match ? match[1] : null;
}

const entryFile = findEntryFromHtml();
const entryChunk = entryFile
  ? chunks.find((c) => c.file === entryFile)
  : chunks.find((c) => c.file.startsWith("index-"));

const reactVendorChunk = chunks.find((c) => c.file.startsWith("react-vendor"));

if (!entryChunk) {
  console.error("[bundle-budget] Could not identify entry chunk.");
  console.error("Chunks present:", chunks.map((c) => c.file).join(", "));
  process.exit(1);
}

const initialBytes =
  entryChunk.gzBytes + (reactVendorChunk ? reactVendorChunk.gzBytes : 0);

console.log("\n[bundle-budget] Top 10 chunks by gzip size:");
console.log("  ".padEnd(2) + "file".padEnd(48) + "raw".padStart(11) + "  " + "gz".padStart(11));
console.log("  " + "-".repeat(48 + 11 + 2 + 11));
for (const c of chunks.slice(0, 10)) {
  console.log(
    "  " +
      c.file.padEnd(48) +
      fmtKB(c.rawBytes) +
      "  " +
      fmtKB(c.gzBytes)
  );
}

console.log("\n[bundle-budget] Initial payload (entry + react-vendor):");
console.log(`  entry        : ${entryChunk.file}  ${fmtKB(entryChunk.gzBytes)}`);
if (reactVendorChunk) {
  console.log(
    `  react-vendor : ${reactVendorChunk.file}  ${fmtKB(reactVendorChunk.gzBytes)}`
  );
}
console.log(
  `  TOTAL        : ${fmtKB(initialBytes)}  (budget: ${BUDGET_KB} KB gz)`
);

if (initialBytes > BUDGET_BYTES) {
  console.error(
    `\n[bundle-budget] FAIL — initial payload ${fmtKB(initialBytes).trim()} exceeds budget of ${BUDGET_KB} KB gz.`
  );
  console.error("Top 3 heaviest chunks:");
  for (const c of chunks.slice(0, 3)) {
    console.error(`  - ${c.file}: ${fmtKB(c.gzBytes).trim()}`);
  }
  process.exit(1);
}

console.log(
  `\n[bundle-budget] OK — initial payload within budget (${fmtKB(initialBytes).trim()} <= ${BUDGET_KB} KB gz).\n`
);
