import fs from "node:fs";
import path from "node:path";
import { createRng } from "./lib/rng.mjs";
import { requireConfirmed, RULES_PROFILE } from "./rules-profile.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

const seed = arg("--seed", "structural-default");
const iterations = Number(arg("--iterations", "20000"));
const outPath = arg("--out", "");
if (!Number.isInteger(iterations) || iterations < 1) throw new Error("--iterations must be a positive integer");

const rng = createRng(seed);
const eventCount = requireConfirmed("ordinaryEventCount");
const diamondCount = requireConfirmed("ordinaryDiamondCount");
const targetDiamond = requireConfirmed("endgameMaturesAtDiamond");

if (diamondCount < targetDiamond) throw new Error("Confirmed profile is internally inconsistent: not enough diamond events");

const positions = [];
const histogram = {};
for (let i = 0; i < iterations; i++) {
  const deck = rng.shuffle([
    ...Array(diamondCount).fill(true),
    ...Array(eventCount - diamondCount).fill(false)
  ]);
  let seen = 0;
  let pos = null;
  for (let j = 0; j < deck.length; j++) {
    if (deck[j]) seen += 1;
    if (seen === targetDiamond) {
      pos = j + 1;
      break;
    }
  }
  if (pos === null) throw new Error("Target diamond not found");
  positions.push(pos);
  histogram[pos] = (histogram[pos] || 0) + 1;
}
positions.sort((a, b) => a - b);

const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
const actionBudgets = Object.fromEntries(
  requireConfirmed("playerCounts").map(players => [
    players,
    {
      tableMainActionsPerRound: players * requireConfirmed("mainActionsPerFamilyPerRound"),
      mainActionsPerFamilyPerRound: requireConfirmed("mainActionsPerFamilyPerRound")
    }
  ])
);

const result = {
  ruleset: RULES_PROFILE.ruleset,
  rulesSnapshotDate: RULES_PROFILE.snapshotDate,
  seed,
  rngCalls: rng.calls(),
  mode: "structural",
  iterations,
  summary: {
    fourthDiamondOrdinaryEventPosition: {
      mean,
      p05: percentile(positions, 0.05),
      p50: percentile(positions, 0.50),
      p95: percentile(positions, 0.95),
      histogram: Object.fromEntries(Object.entries(histogram).sort((a, b) => Number(a[0]) - Number(b[0])))
    },
    actionBudgets,
    maxImportantBirthsPerFamilyBeforeFourthDiamond:
      requireConfirmed("endgameMaturesAtDiamond") *
      requireConfirmed("importantBirthChecksPerFamilyPerDiamond")
  },
  violations: [],
  unknownRules: Object.entries(RULES_PROFILE.unknown).filter(([, v]) => v === null).map(([k]) => k)
};

const json = JSON.stringify(result, null, 2);
if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json + "\n");
}
console.log(json);
