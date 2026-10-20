import assert from "node:assert/strict";
import { createRng } from "./lib/rng.mjs";
import { createGame } from "./headless/state.mjs";
import { legalActions } from "./headless/legal-actions.mjs";
import { applyAction } from "./headless/apply-action.mjs";
import { invariantCheck } from "./headless/invariants.mjs";
import { runGame } from "./headless/engine.mjs";

function choiceProvider({ options }) { return options[0]; }

{
  const rng = createRng("headless-init");
  const state = createGame({ seed:"headless-init", rng, familyIds:["owl","deer"], mode:"core-sandbox" });
  assert.equal(state.players.length, 2);
  assert.equal(state.actionRound, 1);
  assert.equal(state.currentEvent !== null, true);
  assert.deepEqual(invariantCheck(state), []);
}

{
  const rng = createRng("action-legality");
  const state = createGame({ seed:"action-legality", rng, familyIds:["owl","deer"], mode:"core-sandbox" });
  const initial = legalActions(state);
  assert(initial.some(a => a.type === "fundraise"));
  applyAction(state, initial.find(a => a.type === "fundraise"), { rng, choiceProvider });
  assert.equal(state.players[0].resources.money, 5);
  assert.deepEqual(invariantCheck(state), []);
}

{
  const seed = "deterministic-headless";
  const familyIds = ["owl","deer","fox","bear"];
  const policyByFamily = { owl:"random", deer:"political", fox:"conservative", bear:"expansion" };
  const a = runGame({ seed, rng:createRng(seed), familyIds, policyByFamily, keepTrace:true });
  const b = runGame({ seed, rng:createRng(seed), familyIds, policyByFamily, keepTrace:true });
  assert.deepEqual(a, b, "Same seed and policies must produce identical headless report");
  assert.equal(a.violations.length, 0, JSON.stringify(a.violations));
  assert.equal(a.endReason, "core-loop-fourth-diamond");
  assert.equal(a.diamonds, 4);
}

{
  const seed = "strict-unknown";
  const report = runGame({
    seed,
    rng:createRng(seed),
    familyIds:["owl","deer","fox"],
    policyByFamily:{owl:"random",deer:"random",fox:"random"},
    mode:"strict-v04",
    keepTrace:false
  });
  assert.equal(report.endReason, "unknown-rule-blocked");
  assert(report.unknownRules.includes("full-young-king-crisis-resolution-required-before-final-endgame"));
  assert.equal(report.violations.length, 0);
}

console.log(JSON.stringify({
  ok:true,
  mode:"headless-mvp-tests",
  checks:[
    "state creation",
    "legalActions -> applyAction",
    "invariant checks",
    "deterministic full core-loop",
    "strict unknown-rule stop"
  ]
}, null, 2));
