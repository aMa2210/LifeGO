import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

async function loadModule(relativePath) {
  const sourcePath = new URL(relativePath, import.meta.url);
  const source = readFileSync(sourcePath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`;
  return import(moduleUrl);
}

const character = await loadModule("../src/lib/character.ts");

const {
  STAGES,
  OUTFITS,
  ALL_VISUALS,
  INITIAL_CHARACTER,
  ARCHETYPE_TO_VISUAL,
  DIRECTIONAL_DELTA_THRESHOLD,
  SPROUT_TO_SHAPE_SUM_DELTA,
  pickVisualForUser,
} = character;

// ── Default state ───────────────────────────────────────────────────────
assert.equal(INITIAL_CHARACTER.visual, "stage-sprout");
assert.equal(INITIAL_CHARACTER.hasSproutShapeTransition, false);
assert.equal(STAGES.length, 3);
assert.equal(OUTFITS.length, 3);
assert.equal(ALL_VISUALS.length, 6);

// ── Q1 → visual coverage ───────────────────────────────────────────────
const archetypes = Object.keys(ARCHETYPE_TO_VISUAL);
assert.equal(archetypes.length, 18, "all 18 Q1 archetypes mapped");
const visualBuckets = {};
for (const a of archetypes) {
  const v = ARCHETYPE_TO_VISUAL[a];
  visualBuckets[v] = (visualBuckets[v] || 0) + 1;
}
// Every one of the 6 visuals receives at least one archetype.
for (const v of ALL_VISUALS) {
  assert.ok(visualBuckets[v] > 0, `visual ${v} should map from at least one archetype`);
}

// ── pickVisualForUser: no Q1 → sprout ──────────────────────────────────
const noQ1 = pickVisualForUser({
  archetypeId: null,
  currentAttrs: { explorer: 0, social: 0, athletic: 0, foodie: 0, aesthete: 0, productive: 0 },
  initialAttrs: { explorer: 0, social: 0, athletic: 0, foodie: 0, aesthete: 0, productive: 0 },
});
assert.equal(noQ1, "stage-sprout", "no Q1 falls back to sprout");

// ── pickVisualForUser: Q1 anchor used when no big delta ────────────────
const baseHealthy = { explorer: 1, social: 1, athletic: 6, foodie: 1, aesthete: 0, productive: 1 };
const anchorOnly = pickVisualForUser({
  archetypeId: "healthy",
  currentAttrs: baseHealthy,
  initialAttrs: baseHealthy,
});
assert.equal(anchorOnly, "outfit-sport", "healthy archetype anchors to sport");

// ── pickVisualForUser: directional shift switches video ────────────────
const startQuiet = { explorer: 1, social: 0, athletic: 0, foodie: 0, aesthete: 4, productive: 5 };
// Quiet maps to stage-awaken (productive-leaning).
assert.equal(ARCHETYPE_TO_VISUAL["quiet"], "stage-awaken");
// Add 6 athletic via check-ins.
const afterGym = pickVisualForUser({
  archetypeId: "quiet",
  currentAttrs: { ...startQuiet, athletic: 6 },
  initialAttrs: startQuiet,
});
assert.equal(afterGym, "outfit-sport", "+6 athletic from check-ins → sport");

// ── pickVisualForUser: foodie delta hits the in-development case ───────
const afterFood = pickVisualForUser({
  archetypeId: "quiet",
  currentAttrs: { ...startQuiet, foodie: 6 },
  initialAttrs: startQuiet,
});
assert.equal(afterFood, "in-development", "+6 foodie → in-development (no foodie video)");

const afterExplore = pickVisualForUser({
  archetypeId: "quiet",
  currentAttrs: { ...startQuiet, explorer: 7 },
  initialAttrs: startQuiet,
});
assert.equal(afterExplore, "in-development", "+7 explorer → in-development");

// ── pickVisualForUser: sprout → shape via varied check-ins ─────────────
const startCurious = { explorer: 6, social: 1, athletic: 0, foodie: 0, aesthete: 2, productive: 1 };
assert.equal(ARCHETYPE_TO_VISUAL["curious"], "stage-sprout");
// Spread sumDelta across axes so no single axis hits 6.
const variedDelta = {
  explorer: 6 + 2,
  social: 1 + 2,
  athletic: 0 + 2,
  foodie: 0 + 2,
  aesthete: 2 + 0,
  productive: 1 + 0,
};
const sumDelta = 2 + 2 + 2 + 2 + 0 + 0; // = 8
assert.ok(sumDelta >= SPROUT_TO_SHAPE_SUM_DELTA);
const afterVaried = pickVisualForUser({
  archetypeId: "curious",
  currentAttrs: variedDelta,
  initialAttrs: startCurious,
});
assert.equal(afterVaried, "stage-shape", "varied check-ins promote sprout → shape");

// ── Thresholds exposed for tuning ───────────────────────────────────────
assert.equal(DIRECTIONAL_DELTA_THRESHOLD, 6);
assert.equal(SPROUT_TO_SHAPE_SUM_DELTA, 8);

console.log("✓ character tests passed");
