import test from "node:test";
import assert from "node:assert/strict";

import { chooseRandomAction } from "../src/ai/random-ai.js";
import {
  determineWinners,
  evaluateFamily,
  runGame,
} from "../src/engine/game-engine.js";

function makeFamily(overrides = {}) {
  const members = [
    { id: "a", generation: 1, adult: true, alive: true },
    { id: "b", generation: 2, adult: true, alive: true },
    { id: "c", generation: 2, adult: true, alive: true },
  ];

  return {
    id: overrides.id ?? "family-test",
    name: overrides.name ?? "測試家族",
    influence: 3,
    members,
    stats: {
      births: 3,
      livingDescendants: 2,
      officeCharacterIds: new Set(["a", "b", "c"]),
      currentOfficeIds: new Set(["c"]),
      keyOfficeIds: new Set(["b"]),
      externalMarriageFamilies: new Set(["x", "y", "z"]),
      industries: 3,
      localRegions: new Set(["冀州", "相州"]),
      completedMissions: 3,
      greatMissions: 1,
      ...overrides.stats,
    },
  };
}

test("達成五項條件時，應取得五項歷史評定", () => {
  const result = evaluateFamily(makeFamily());

  assert.equal(result.count, 5);
  assert.deepEqual(
    result.achieved.map((item) => item.name),
    ["宗族盛多", "累世貴盛", "婚姻之盛", "家產豐富", "勳業至大"],
  );
});

test("歷史評定是非排他的，多家可以同時達成", () => {
  const familyA = makeFamily({ id: "a", name: "甲家" });
  const familyB = makeFamily({ id: "b", name: "乙家" });

  const outcome = determineWinners([familyA, familyB]);

  assert.equal(outcome.highest, 5);
  assert.deepEqual(
    outcome.winners.map((winner) => winner.familyName),
    ["甲家", "乙家"],
  );
});

test("同一 seed 的 AI 模擬應得到相同終局", () => {
  const first = runGame({
    playerCount: 4,
    seed: 42,
    chooseAction: chooseRandomAction,
  });
  const second = runGame({
    playerCount: 4,
    seed: 42,
    chooseAction: chooseRandomAction,
  });

  assert.equal(first.game.round, second.game.round);
  assert.equal(first.game.endReason, second.game.endReason);
  assert.deepEqual(
    first.outcome.winners.map((winner) => winner.familyName),
    second.outcome.winners.map((winner) => winner.familyName),
  );
});

test("AI 試跑應在事件牌堆規定的範圍內結束", () => {
  const result = runGame({
    playerCount: 5,
    seed: 777,
    chooseAction: chooseRandomAction,
  });

  assert.equal(result.game.ended, true);
  assert.ok(result.game.round >= 6);
  assert.ok(result.game.round <= 10);
  assert.ok(result.outcome.winners.length >= 1);
});
