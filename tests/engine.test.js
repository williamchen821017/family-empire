import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseRandomAction,
  respondToAllianceProposal,
} from "../src/ai/random-ai.js";
import {
  ABILITY_RESULT_TABLE,
  ACTIONS,
  abandonIndustryContract,
  applyAction,
  betrayAlliance,
  canDirectHostileAction,
  createGame,
  determineWinners,
  dissolveAllianceMutually,
  evaluateFamily,
  getFamilyRelation,
  getLegalActions,
  grantExtraAction,
  markFreeAssetTransferUsed,
  processBirths,
  provideFamilyAid,
  resolveAbilityRoll,
  resolveAllianceProposal,
  runGame,
  settleIndustryIncome,
  shareResourceLoss,
  startRound,
  transferIndustryContract,
} from "../src/engine/game-engine.js";

function makeFamily(overrides = {}) {
  const members = [
    {
      id: "a",
      generation: 1,
      adult: true,
      alive: true,
      lifeStage: "成年",
      actedThisRound: false,
      currentOfficeId: null,
      marriageId: null,
      abilities: { 武略: 3, 政務: 3, 君心: 3, 交際: 3, 名望: 3 },
    },
    {
      id: "b",
      generation: 2,
      adult: true,
      alive: true,
      lifeStage: "成年",
      actedThisRound: false,
      currentOfficeId: null,
      marriageId: null,
      abilities: { 武略: 3, 政務: 3, 君心: 3, 交際: 3, 名望: 3 },
    },
    {
      id: "c",
      generation: 2,
      adult: true,
      alive: true,
      lifeStage: "成年",
      actedThisRound: false,
      currentOfficeId: null,
      marriageId: null,
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
    industryCapacity: 3,
    industryContracts: [
      { instanceId: "i1", income: { money: 1, food: 0 } },
      { instanceId: "i2", income: { money: 0, food: 1 } },
      { instanceId: "i3", income: { money: 1, food: 1 } },
    ],
    localAccessRegions: new Set(),
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

test("跨家族聯姻後，雙方人物使用同一組婚姻標記", () => {
  const game = createGame({ playerCount: 2, seed: 6 });
  const family = game.families[0];

  const marriageAction = getLegalActions(game, family).find(
    (action) => action.type === ACTIONS.MARRIAGE,
  );

  assert.ok(marriageAction);
  const result = applyAction(game, family, marriageAction);
  const marriage = game.marriages.find(
    (item) => item.id === result.marriageId,
  );
  const ownMember = family.members.find(
    (member) => member.id === marriageAction.actorId,
  );
  const targetFamily = game.families.find(
    (item) => item.id === marriageAction.targetFamilyId,
  );
  const targetMember = targetFamily.members.find(
    (member) => member.id === marriageAction.targetMemberId,
  );

  assert.equal(ownMember.marriageId, marriage.id);
  assert.equal(targetMember.marriageId, marriage.id);
  assert.equal(marriage.markerId, "姻01");

  const relation = getFamilyRelation(
    game,
    family.id,
    targetFamily.id,
  );
  assert.equal(relation.depth, 1);
  assert.equal(relation.marriages, 1);
});

test("子嗣歸父族，並保留父母雙方的族譜連結", () => {
  const game = createGame({ playerCount: 2, seed: 7 });
  const initiatingFamily = game.families[0];

  const marriageAction = getLegalActions(game, initiatingFamily).find(
    (action) => {
      if (action.type !== ACTIONS.MARRIAGE) return false;
      const own = initiatingFamily.members.find(
        (member) => member.id === action.actorId,
      );
      return own.sex === "男";
    },
  );

  assert.ok(marriageAction);
  const marriageResult = applyAction(
    game,
    initiatingFamily,
    marriageAction,
  );
  const marriage = game.marriages.find(
    (item) => item.id === marriageResult.marriageId,
  );
  const fatherFamily = game.families.find(
    (family) => family.id === marriage.male.familyId,
  );
  const motherFamily = game.families.find(
    (family) => family.id === marriage.female.familyId,
  );
  const motherInfluenceBefore = motherFamily.resources.influence;

  game.round = marriage.establishedRound + 1;
  const originalRng = game.rng;
  const values = [0.9999, 0.1];
  game.rng = () => values.shift() ?? 0.1;

  const births = processBirths(game);

  game.rng = originalRng;

  assert.equal(births.length, 1);
  assert.equal(fatherFamily.stats.births, 1);

  const child = fatherFamily.members.find(
    (member) => member.id === births[0].childId,
  );

  assert.ok(child);
  assert.equal(child.parentRefs.length, 2);
  assert.equal(
    child.parentRefs.find((ref) => ref.role === "父").familyId,
    fatherFamily.id,
  );
  assert.equal(
    child.parentRefs.find((ref) => ref.role === "母").familyId,
    motherFamily.id,
  );
  assert.equal(
    motherFamily.resources.influence,
    motherInfluenceBefore + 1,
  );

  const relation = getFamilyRelation(
    game,
    fatherFamily.id,
    motherFamily.id,
  );
  assert.equal(relation.depth, 2);
});

test("同一對夫婦最多只有 3 名進入遊戲的子女", () => {
  const game = createGame({ playerCount: 2, seed: 8 });
  const family = game.families[0];
  const marriageAction = getLegalActions(game, family).find(
    (action) => action.type === ACTIONS.MARRIAGE,
  );

  const marriageResult = applyAction(game, family, marriageAction);
  const marriage = game.marriages.find(
    (item) => item.id === marriageResult.marriageId,
  );

  for (let round = 2; round <= 8; round += 1) {
    game.round = round;
    game.rng = () => 0.9999;
    processBirths(game);
  }

  assert.equal(marriage.children.length, 3);
});

test("正式盟約成立時，關係深度 +1 並禁止直接敵對行動", () => {
  const game = createGame({ playerCount: 2, seed: 9 });
  const family = game.families[0];

  const allianceAction = getLegalActions(game, family).find(
    (action) => action.type === ACTIONS.PROPOSE_ALLIANCE,
  );

  assert.ok(allianceAction);
  const proposal = applyAction(game, family, allianceAction);

  const resolved = resolveAllianceProposal(
    game,
    proposal.pendingDecision.proposerFamilyId,
    proposal.pendingDecision.targetFamilyId,
    true,
  );

  assert.equal(resolved.accepted, true);

  const relation = getFamilyRelation(
    game,
    proposal.pendingDecision.proposerFamilyId,
    proposal.pendingDecision.targetFamilyId,
  );

  assert.equal(relation.alliance, true);
  assert.equal(relation.depth, 1);
  assert.equal(
    canDirectHostileAction(
      game,
      proposal.pendingDecision.proposerFamilyId,
      proposal.pendingDecision.targetFamilyId,
    ),
    false,
  );
});

test("和平解除盟約只讓關係 -1，不扣影響力", () => {
  const game = createGame({ playerCount: 2, seed: 10 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);

  relation.depth = 3;
  relation.alliance = true;
  relation.allianceId = "alliance-test";
  const beforeInfluence = a.resources.influence;

  const result = dissolveAllianceMutually(game, a.id, b.id);

  assert.equal(result.depth, 2);
  assert.equal(relation.alliance, false);
  assert.equal(a.resources.influence, beforeInfluence);
});

test("背盟會依原關係深度扣影響力，關係再 -2", () => {
  const game = createGame({ playerCount: 2, seed: 11 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);

  relation.depth = 4;
  relation.alliance = true;
  relation.allianceId = "alliance-test";
  a.resources.influence = 10;

  const result = betrayAlliance(game, a.id, b.id);

  assert.equal(result.influenceLost, 4);
  assert.equal(a.resources.influence, 6);
  assert.equal(relation.depth, 2);
  assert.equal(relation.alliance, false);
  assert.equal(canDirectHostileAction(game, a.id, b.id), true);
});

test("關係 1 的「往來」每方每回合可免費援助一次，總量最多 2", () => {
  const game = createGame({ playerCount: 2, seed: 12 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);
  relation.depth = 1;

  provideFamilyAid(game, a.id, b.id, { money: 1, food: 1 });

  assert.equal(a.resources.money, 2);
  assert.equal(a.resources.food, 2);
  assert.equal(b.resources.money, 4);
  assert.equal(b.resources.food, 4);

  assert.throws(() =>
    provideFamilyAid(game, a.id, b.id, { money: 1 }),
  );

  provideFamilyAid(game, b.id, a.id, { money: 1 });
  assert.equal(a.resources.money, 3);
});

test("關係 2 的「通財」每回合只能免費資產讓渡一次", () => {
  const game = createGame({ playerCount: 2, seed: 13 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);
  relation.depth = 2;

  assert.equal(markFreeAssetTransferUsed(game, a.id, b.id), true);
  assert.throws(() =>
    markFreeAssetTransferUsed(game, a.id, b.id),
  );
});

test("關係 4 的「共擔」每回合只能替對方承擔 1 點資源損失一次", () => {
  const game = createGame({ playerCount: 2, seed: 14 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);
  relation.depth = 4;
  const before = a.resources.food;

  shareResourceLoss(game, a.id, b.id, "food");

  assert.equal(a.resources.food, before - 1);
  assert.throws(() =>
    shareResourceLoss(game, a.id, b.id, "food"),
  );
});

test("關係 3 的協力會花援助方 1 個行動並讓主行動能力 +1", () => {
  const game = createGame({ playerCount: 2, seed: 15 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);
  relation.depth = 3;

  const assisted = getLegalActions(game, a).find(
    (action) =>
      action.type === ACTIONS.TAKE_TASK &&
      action.assistance?.assistingFamilyId === b.id,
  );

  assert.ok(assisted);
  const beforeActions = b.actionEconomy.remaining;
  game.rng = () => 0.5;

  const result = applyAction(game, a, assisted);

  assert.equal(b.actionEconomy.remaining, beforeActions - 1);
  assert.equal(result.effectiveAbility, Math.min(5, result.baseAbility + 1));
  assert.equal(result.assistance.free, false);
});

test("關係 5 的共進退每回合第一次協力不花援助方行動，但仍使用該人物", () => {
  const game = createGame({ playerCount: 2, seed: 16 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);
  relation.depth = 5;

  const assisted = getLegalActions(game, a).find(
    (action) =>
      action.type === ACTIONS.TAKE_TASK &&
      action.assistance?.assistingFamilyId === b.id,
  );

  assert.ok(assisted);
  const helper = b.members.find(
    (member) => member.id === assisted.assistance.assistingMemberId,
  );
  const beforeActions = b.actionEconomy.remaining;
  game.rng = () => 0.5;

  const result = applyAction(game, a, assisted);

  assert.equal(b.actionEconomy.remaining, beforeActions);
  assert.equal(helper.actedThisRound, true);
  assert.equal(result.assistance.free, true);
  assert.equal(relation.roundUsage.freeAssistUsed, true);
});

test("中央產業機會開局固定公開 3 張", () => {
  const game = createGame({ playerCount: 4, seed: 17 });
  assert.equal(game.publicIndustries.length, 3);
});

test("出資型產業會支付成本並取得產業契券", () => {
  const game = createGame({ playerCount: 2, seed: 18 });
  const family = game.families[0];

  game.publicIndustries = [
    {
      id: "test-estate",
      instanceId: "test-estate-1",
      name: "測試田莊",
      region: "冀州",
      acquisition: { type: "funding", cost: { money: 2, influence: 0 } },
      income: { money: 0, food: 2 },
    },
  ];

  const action = getLegalActions(game, family).find(
    (item) =>
      item.type === ACTIONS.ACQUIRE_INDUSTRY &&
      item.industryInstanceId === "test-estate-1",
  );

  assert.ok(action);
  const moneyBefore = family.resources.money;
  applyAction(game, family, action);

  assert.equal(family.resources.money, moneyBefore - 2);
  assert.equal(family.industryContracts.length, 1);
  assert.equal(family.industryContracts[0].instanceId, "test-estate-1");
});

test("產業契券在回合結算提供歲入", () => {
  const game = createGame({ playerCount: 2, seed: 19 });
  const family = game.families[0];

  family.industryContracts.push({
    instanceId: "income-test",
    name: "歲入測試",
    region: "冀州",
    income: { money: 2, food: 1 },
  });

  const moneyBefore = family.resources.money;
  const foodBefore = family.resources.food;
  settleIndustryIncome(game);

  assert.equal(family.resources.money, moneyBefore + 2);
  assert.equal(family.resources.food, foodBefore + 1);
});

test("有地方落腳理由後，才能用政務判定建立鄉里勢力", () => {
  const game = createGame({ playerCount: 2, seed: 20 });
  const family = game.families[0];

  assert.equal(
    getLegalActions(game, family).some(
      (item) =>
        item.type === ACTIONS.ESTABLISH_LOCAL_POWER &&
        item.region === "豫州",
    ),
    false,
  );

  family.industryContracts.push({
    instanceId: "yuzhou-test",
    name: "豫州測試產業",
    region: "豫州",
    income: { money: 1, food: 1 },
  });
  family.stats.industries = family.industryContracts.length;
  game.rng = () => 0.9999;

  const action = getLegalActions(game, family).find(
    (item) =>
      item.type === ACTIONS.ESTABLISH_LOCAL_POWER &&
      item.region === "豫州",
  );

  assert.ok(action);
  applyAction(game, family, action);
  assert.equal(family.stats.localRegions.has("豫州"), true);
});

test("關係 2 的通財讓第一次資產讓渡免費，第二次改耗主要行動", () => {
  const game = createGame({ playerCount: 2, seed: 21 });
  const a = game.families[0];
  const b = game.families[1];
  const relation = getFamilyRelation(game, a.id, b.id);

  relation.depth = 2;
  a.industryContracts.push(
    {
      instanceId: "transfer-1",
      name: "契券一",
      region: "冀州",
      income: { money: 1, food: 0 },
    },
    {
      instanceId: "transfer-2",
      name: "契券二",
      region: "相州",
      income: { money: 0, food: 1 },
    },
  );
  a.stats.industries = 2;

  const actionsBefore = a.actionEconomy.remaining;
  const first = transferIndustryContract(
    game,
    a.id,
    b.id,
    "transfer-1",
  );

  assert.equal(first.usedFreeTransfer, true);
  assert.equal(a.actionEconomy.remaining, actionsBefore);

  const second = transferIndustryContract(
    game,
    a.id,
    b.id,
    "transfer-2",
  );

  assert.equal(second.usedFreeTransfer, false);
  assert.equal(a.actionEconomy.remaining, actionsBefore - 1);
  assert.equal(b.industryContracts.length, 2);
});

test("放棄產業契券不退款，契券進入棄牌", () => {
  const game = createGame({ playerCount: 2, seed: 22 });
  const family = game.families[0];

  family.industryContracts.push({
    instanceId: "abandon-test",
    name: "放棄測試",
    region: "冀州",
    income: { money: 1, food: 1 },
  });
  const moneyBefore = family.resources.money;

  const contract = abandonIndustryContract(
    game,
    family.id,
    "abandon-test",
  );

  assert.equal(contract.instanceId, "abandon-test");
  assert.equal(family.resources.money, moneyBefore);
  assert.equal(
    game.industryDiscard.some(
      (item) => item.instanceId === "abandon-test",
    ),
    true,
  );
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
    respondToAlliance: respondToAllianceProposal,
  });
  const second = runGame({
    playerCount: 4,
    seed: 42,
    chooseAction: chooseRandomAction,
    respondToAlliance: respondToAllianceProposal,
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
    respondToAlliance: respondToAllianceProposal,
  });

  assert.equal(result.game.ended, true);
  assert.ok(result.game.round >= 6);
  assert.ok(result.game.round <= 10);
  assert.ok(result.outcome.winners.length >= 1);
});
