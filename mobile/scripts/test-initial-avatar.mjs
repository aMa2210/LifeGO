import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const sourcePath = new URL("../src/lib/initial-avatar.ts", import.meta.url);
const source = readFileSync(sourcePath, "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: false,
  },
}).outputText;

const moduleUrl = `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`;
const mod = await import(moduleUrl);

const {
  PERSON_OPTIONS,
  PLACE_OPTIONS,
  TONE_OPTIONS,
  buildInitialAvatarProfile,
  EMPTY_INITIAL_ATTRIBUTES,
} = mod;

assert.equal(PERSON_OPTIONS.length, 18, "keeps the compressed 18 archetypes");
assert.equal(PLACE_OPTIONS.length, 18, "keeps the compressed 18 place choices");
assert.equal(TONE_OPTIONS.length, 6, "keeps the six feedback tones");

for (const option of PERSON_OPTIONS) {
  assert.ok(option.score, `${option.id} should define six-axis score`);
  assert.equal(
    Object.keys(option.score).length,
    6,
    `${option.id} score should cover six axes`
  );
}

const profile = buildInitialAvatarProfile({
  archetypeId: "quiet",
  placeIds: ["library", "cafe", "home"],
  toneId: "gentle",
});

assert.deepEqual(profile.initialAttributes, {
  explorer: 1,
  social: 0.7,
  athletic: 0,
  foodie: 3.3,
  aesthete: 8.4,
  productive: 12.2,
});
assert.deepEqual(profile.topAxes, ["productive", "aesthete"]);
assert.equal(profile.voiceStyle, "gentle");
assert.equal(profile.archetypeId, "quiet");
assert.deepEqual(profile.placeIds, ["library", "cafe", "home"]);
assert.equal(profile.toneId, "gentle");
assert.ok(
  !("avatarRecipe" in profile),
  "v2 profile must not include the deprecated avatarRecipe field"
);

const beforeTone = buildInitialAvatarProfile({
  archetypeId: "quiet",
  placeIds: ["library"],
  toneId: "praise",
}).initialAttributes;
const afterTone = buildInitialAvatarProfile({
  archetypeId: "quiet",
  placeIds: ["library"],
  toneId: "coach",
}).initialAttributes;
assert.deepEqual(beforeTone, afterTone, "tone must not change initial scores");

assert.throws(
  () =>
    buildInitialAvatarProfile({
      archetypeId: "quiet",
      placeIds: ["library", "cafe", "home", "park"],
      toneId: "gentle",
    }),
  /at most 3 places/
);

assert.deepEqual(EMPTY_INITIAL_ATTRIBUTES, {
  explorer: 0,
  social: 0,
  athletic: 0,
  foodie: 0,
  aesthete: 0,
  productive: 0,
});

console.log("✓ initial-avatar tests passed");
