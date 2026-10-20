import fs from "node:fs";
import path from "node:path";
import { createRng } from "./lib/rng.mjs";
import { runGame } from "./headless/engine.mjs";
import { FAMILY_SETUPS } from "./headless/data.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const seed = arg("--seed", "selfplay-default");
const games = Number(arg("--games", "1000"));
const playerCounts = arg("--players", "2,3,4,5").split(",").map(Number).filter(n => n >= 2 && n <= 5);
const outPath = arg("--out", "");
const mode = arg("--mode", "core-sandbox");
const failOnViolation = process.argv.includes("--fail-on-violation");
const assumptionProfileId = arg("--assumption-profile", "core-sandbox-v1");
if (!Number.isInteger(games) || games < 1) throw new Error("--games must be a positive integer");
if (!playerCounts.length) throw new Error("--players must contain at least one of 2,3,4,5");

const master = createRng(seed);
const familyPool = Object.keys(FAMILY_SETUPS);
const policyNames = ["random", "expansion", "conservative", "political"];
const familyStats = Object.fromEntries(familyPool.map(id => [id, {
  appearances:0, winCredit:0, outrightWins:0,
  legendDone:{"枝繁葉茂":0,"世代顯達":0,"締結名門":0,"家業豐足":0}
}]));
const actionUse = {};
const failures = [];
let violationGames = 0;
let totalRounds = 0;
let totalDiamonds = 0;
let allTableJointWins = 0;
let completeGames = 0;
let unknownBlocked = 0;

for (let i = 0; i < games; i++) {
  const players = playerCounts[i % playerCounts.length];
  const familyIds = master.shuffle(familyPool).slice(0, players);
  const policyRotation = master.shuffle(policyNames);
  const policyByFamily = Object.fromEntries(familyIds.map((id, j) => [id, policyRotation[(i + j) % policyRotation.length]]));
  const gameSeed = `${seed}:g${i}:p${players}`;
  const report = runGame({
    seed:gameSeed,
    rng:createRng(gameSeed),
    familyIds,
    policyByFamily,
    assumptionProfileId,
    mode,
    keepTrace:false
  });

  totalRounds += report.rounds;
  totalDiamonds += report.diamonds;
  if (report.endReason === "unknown-rule-blocked") unknownBlocked += 1;
  if (!report.violations.length && report.endReason !== "unknown-rule-blocked") completeGames += 1;
  if (report.winners.length === players && report.winners.length > 0) allTableJointWins += 1;
  const credit = report.winners.length ? 1 / report.winners.length : 0;

  for (const row of report.legendRows) {
    const s = familyStats[row.familyId];
    s.appearances += 1;
    if (report.winners.includes(row.familyId)) {
      s.winCredit += credit;
      if (report.winners.length === 1) s.outrightWins += 1;
    }
    for (const [legend, done] of Object.entries(row.legends)) if (done) s.legendDone[legend] += 1;
  }
  for (const p of report.players) {
    for (const [type, count] of Object.entries(p.actionUse)) actionUse[type] = (actionUse[type] || 0) + count;
  }
  if (report.violations.length) {
    violationGames += 1;
    if (failures.length < 25) failures.push({
      seed:gameSeed, players, families:familyIds, policies:policyByFamily, violations:report.violations
    });
  }
}

const familySummary = Object.fromEntries(Object.entries(familyStats).map(([id,s]) => [id, {
  appearances:s.appearances,
  winCreditRate:s.appearances ? s.winCredit / s.appearances : null,
  outrightWinRate:s.appearances ? s.outrightWins / s.appearances : null,
  legendCompletionRates:Object.fromEntries(Object.entries(s.legendDone).map(([k,v]) => [k, s.appearances ? v / s.appearances : null]))
}]));

const output = {
  mode:"selfplay",
  gitSha:process.env.GITHUB_SHA || null,
  engineMode:mode,
  seed,
  games,
  playerCounts,
  assumptionProfileId,
  balanceEligible:false,
  balanceEligibilityReason:"MVP regression self-play; do not use family win rates as final V04 balance evidence until coverage gaps are closed.",
  summary:{
    completeGames,
    unknownBlocked,
    violationGames,
    averageRounds:totalRounds / games,
    averageDiamonds:totalDiamonds / games,
    allTableJointWinRate:allTableJointWins / games,
    actionUse,
    familySummary
  },
  failureSamples:failures
};

const json = JSON.stringify(output, null, 2);
if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  fs.writeFileSync(outPath, json + "\n");
}
console.log(json);

if (failOnViolation && violationGames > 0) process.exitCode = 1;
