import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseAmbitionDrivenAction,
  chooseInternalCardByAmbition,
} from "../src/ai/ambition-ai.js";
import {
  createGame,
  determineWinners,
  evaluateFamily,
  runGame,
} from "../src/engine/game-engine.js";
import {
  drawHandCards,
  drawRewardCardChoice,
  enforceHandLimit,
  getPlayableInternalCards,
  playInternalCard,
} from "../src/engine/hand-cards.js";
import {
  checkAmbition,
  revealCompletedAmbition,
  updateAmbitionCompletion,
} from "../src/engine/ambitions.js";
import {
  chooseRandomAction,
  chooseRandomAmbition,
  chooseRandomInternalCard,
  chooseRandomRewardCard,
  respondToAllianceProposal,
  revealAmbitionWhenComplete,
} from "../src/ai/random-ai.js";

test("開局每家先抽 3 張手牌，並從 2 張宿願中保留 1 張", () => {
  const game = createGame({
    playerCount: 4,
    seed: 101,
    chooseAmbition: chooseRandomAmbition,
  });

  for (const family of game.families) {
    assert.equal(family.hand.length, 3);
    assert.ok(family.ambition?.card);
    assert.equal(family.ambition.completed, false);
    assert.equal(family.ambition.revealed, false);
  }
});

test("手牌上限固定為 5，超出的牌會進棄牌", () => {
  const game = createGame({
    playerCount: 2,
    seed: 102,
    chooseAmbition: chooseRandomAmbition,
  });
  const family = game.families[0];

  drawHandCards(game, family, 4);
  assert.ok(family.hand.length > 5);

  const discarded = enforceHandLimit(game, family);

  assert.equal(family.hand.length, 5);
  assert.ok(discarded.length >= 1);
  assert.ok(game.handDiscard.length >= discarded.length);
});

test("臨時調度會增加當回合行動，但不超過基本 3 + 額外 2", () => {
  const game = createGame({
    playerCount: 2,
    seed: 103,
    chooseAmbition: chooseRandomAmbition,
  });
  const family = game.families[0];

  family.hand = [
    {
      id: "temporary_mobilization",
      instanceId: "test-extra-action",
      title: "臨時調度",
      timing: "familyInternal",
      effect: { type: "extraAction", amount: 1 },
    },
  ];
  family.actionEconomy.remaining = 5;

  playInternalCard(game, family, "test-extra-action");

  assert.equal(family.actionEconomy.remaining, 5);
  assert.equal(family.hand.length, 0);
});

test("宿願達成後公開可得 +2 影響力與抽 2 留 1", () => {
  const game = createGame({
    playerCount: 2,
    seed: 104,
    chooseAmbition: chooseRandomAmbition,
  });
  const family = game.families[0];

  family.ambition = {
    card: {
      id: "test-influence",
      title: "廣結人望，使門聲大著",
      requirement: { type: "influence", min: 3 },
      actionWeights: {},
    },
    completed: false,
    revealed: false,
    completedRound: null,
    revealedRound: null,
  };

  const beforeInfluence = family.resources.influence;
  const beforeHand = family.hand.length;

  assert.equal(updateAmbitionCompletion(game, family), true);
  assert.equal(
    revealCompletedAmbition(
      game,
      family,
      drawRewardCardChoice,
      chooseRandomRewardCard,
    ),
    true,
  );

  assert.equal(family.resources.influence, beforeInfluence + 2);
  assert.equal(family.hand.length, beforeHand + 1);
  assert.equal(family.ambition.revealed, true);
});

test("宿願導向 AI 會依宿願權重改變行動選擇", () => {
  const family = {
    ambition: {
      card: {
        actionWeights: {
          marriage: 20,
          seek_office: 0,
        },
      },
    },
  };
  const legalActions = [
    { type: "seek_office", actorId: "a" },
    { type: "marriage", actorId: "b" },
  ];

  const action = chooseAmbitionDrivenAction({
    family,
    legalActions,
    rng: () => 0.5,
  });

  assert.equal(action.type, "marriage");
});

test("宿願只提供私人獎勵，不參與歷史評定勝負或破除平手", () => {
  const makeFamily = (id, name, revealed) => ({
    id,
    name,
    ambition: {
      card: { id: "private-goal", title: "測試宿願" },
      completed: revealed,
      revealed,
    },
    members: [],
    industryContracts: [],
    history: { completedTasks: [] },
    stats: {
      births: 0,
      livingDescendants: 0,
      officeCharacterIds: new Set(),
      currentOfficeCharacterIds: new Set(),
      keyOfficeCharacterIds: new Set(),
      externalMarriageFamilies: new Set(),
      localRegions: new Set(),
    },
  });

  const a = makeFamily("a", "甲家", true);
  const b = makeFamily("b", "乙家", false);

  const outcome = determineWinners([a, b]);

  assert.equal(evaluateFamily(a).count, 0);
  assert.equal(evaluateFamily(b).count, 0);
  assert.deepEqual(
    outcome.winners.map((winner) => winner.familyName),
    ["甲家", "乙家"],
  );
});

test("V0.6 隨機 AI 仍能完整跑到終局", () => {
  const result = runGame({
    playerCount: 4,
    seed: 105,
    chooseAction: chooseRandomAction,
    respondToAlliance: respondToAllianceProposal,
    chooseAmbition: chooseRandomAmbition,
    chooseInternalCard: chooseRandomInternalCard,
    chooseRewardCard: chooseRandomRewardCard,
    shouldRevealAmbition: revealAmbitionWhenComplete,
  });

  assert.equal(result.game.ended, true);
  assert.ok(result.outcome.winners.length >= 1);
  for (const family of result.game.families) {
    assert.ok(family.ambition?.card);
    assert.ok(family.hand.length <= 5);
  }
});
