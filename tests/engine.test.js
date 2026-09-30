import test from "node:test";
import assert from "node:assert/strict";

import { chooseRandomAction } from "../src/ai/random-ai.js";
import {
  ABILITY_RESULT_TABLE,
  ACTIONS,
  createGame,
  determineWinners,
  evaluateFamily,
  getLegalActions,
  grantExtraAction,
  resolveAbilityRoll,
  runGame,
  startRound,
  applyAction,
} from "../src/engine/game-engine.js";

function makeFamily(overrides = {}) {
  const members = [
    {
      id: "a",
      generation: 1,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 3, 政務: 3, 君心: 3, 交際: 3, 名望: 3 },
    },
    {
      id: "b",
      generation: 2,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 3, 政務: 3, 君心: 3, 交際: 3, 名望: 3 },
    },
    {
      id: "c",
      generation: 2,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 3, 政務: 3, 君心: 3, 交際: 3, 名望: 3 },
    },
  ];

  return {
    id: overrides.id ?? "family-test",
    name: overrides.name ?? "測試家族",
    resources: {
      money: 3,
      food: 3,
      influence: 3,
      households: 0,
      retainers: 0,
    },
    members,
    actionEconomy: {
      baseActions: 3,
      extraActions: 0,
      remaining: 3,
    },
    history: {
      completedTasks: [
        { name: "甲", major: false },
        { name: "乙", major: false },
        { name: "丙", major: true },
      ],
    },
    stats: {
      births: 3,
      livingDescendants: 2,
      officeCharacterIds: new Set(["a", "b", "c"]),
      currentOfficeCharacterIds: new Set(["c"]),
      keyOfficeCharacterIds: new Set(["b"]),
      externalMarriageFamilies: new Set(["x", "y", "z"]),
      industries: 3,
      localRegions: new Set(["冀州", "相州"]),
      ...overrides.stats,
    },
  };
}

test("Ability × D6 應完全符合目前正式判定表", () => {
  for (let ability = 1; ability <= 5; ability += 1) {
    for (let die = 1; die <= 6; die += 1) {
      assert.equal(
        resolveAbilityRoll(ability, die),
        ABILITY_RESULT_TABLE[ability][die - 1],
      );
    }
  }
});

test("每回合基本 3 行動，額外行動最多只能 +2", () => {
  const game = createGame({ playerCount: 2, seed: 1 });
  const family = game.families[0];

  grantExtraAction(family, 10);
  startRound(game);

  assert.equal(family.actionEconomy.remaining, 5);
  assert.equal(family.actionEconomy.extraActions, 0);
});

test("中央任務區開局固定公開 3 張", () => {
  const game = createGame({ playerCount: 4, seed: 2 });
  assert.equal(game.publicTasks.length, 3);
});

test("人物執行一次人物型主要行動後，本回合不能再次出動", () => {
  const game = createGame({ playerCount: 2, seed: 3 });
  const family = game.families[0];
  const actorId = family.members[0].id;

  const taskAction = getLegalActions(game, family).find(
    (action) => action.type === ACTIONS.TAKE_TASK && action.actorId === actorId,
  );

  assert.ok(taskAction);
  applyAction(game, family, taskAction);

  const remainingForActor = getLegalActions(game, family).filter(
    (action) => action.actorId === actorId,
  );

  assert.equal(remainingForActor.length, 0);
  assert.equal(game.publicTasks.length, 3);
});

test("未任官人物不能直接跳到三級以上官職", () => {
  const game = createGame({ playerCount: 2, seed: 4 });
  const family = game.families[0];

  const officeActions = getLegalActions(game, family).filter(
    (action) => action.type === ACTIONS.SEEK_OFFICE,
  );

  assert.ok(officeActions.length > 0);

  for (const action of officeActions) {
    const office = game.officeBoard.find(
      (item) => item.id === action.targetOfficeId,
    );
    assert.ok(office.level <= 2);
  }
});

test("成功任務會進入家史；失敗任務才進棄牌", () => {
  const game = createGame({ playerCount: 2, seed: 5 });
  const family = game.families[0];

  game.rng = () => 0.9999;

  const taskAction = getLegalActions(game, family).find(
    (action) => action.type === ACTIONS.TAKE_TASK,
  );

  const beforeDiscard = game.taskDiscard.length;
  applyAction(game, family, taskAction);

  assert.equal(family.history.completedTasks.length, 1);
  assert.equal(game.taskDiscard.length, beforeDiscard);
  assert.equal(game.publicTasks.length, 3);
});

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
