import assert from "node:assert/strict";
import { createRng } from "./lib/rng.mjs";
import { chooseAction } from "./policies.mjs";
import { RULES_PROFILE, requireConfirmed } from "./rules-profile.mjs";

{
  const a = createRng("same-seed");
  const b = createRng("same-seed");
  assert.deepEqual(
    Array.from({ length: 20 }, () => a.d6()),
    Array.from({ length: 20 }, () => b.d6()),
    "Seeded RNG must be reproducible"
  );
}

{
  const legal = [
    { id: "industry", tags: ["industry"], economy: 2, expectedGain: 1, expectedCost: 1, risk: 0.2 },
    { id: "office", tags: ["office", "court"], political: 2, expectedGain: 1, expectedCost: 1, risk: 0.5 },
    { id: "reserve", tags: ["reserve", "lowRisk"], expectedGain: 0.2, expectedCost: 0, risk: 0.05, reversible: true }
  ];
  const political = chooseAction("political", legal, { rng: createRng("policy") });
  const expansion = chooseAction("expansion", legal, { rng: createRng("policy") });
  assert.equal(political.id, "office");
  assert.equal(expansion.id, "industry");
}

{
  assert.deepEqual(requireConfirmed("playerCounts"), [2, 3, 4, 5]);
  assert.equal(requireConfirmed("mainActionsPerFamilyPerRound"), 3);
  assert.equal(requireConfirmed("endgameMaturesAtDiamond"), 4);
  assert.equal(requireConfirmed("ordinaryDiamondCount"), 6);
  assert.equal(requireConfirmed("importantBirthChecksPerFamilyPerDiamond"), 1);
}

{
  assert.throws(
    () => requireConfirmed("royalArmyTotalForYoungKingScenario"),
    /do not invent a default/,
    "Unknown rules must not silently receive defaults"
  );
}

console.log(JSON.stringify({
  ok: true,
  mode: "sim-unit-tests",
  ruleset: RULES_PROFILE.ruleset,
  rulesSnapshotDate: RULES_PROFILE.snapshotDate,
  checks: [
    "seed reproducibility",
    "policy separation",
    "confirmed structural profile",
    "unknown-rule guard"
  ]
}, null, 2));
