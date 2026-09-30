import { createOfficeBoard } from "../data/offices.js";
import { createTaskDeck } from "../data/tasks.js";
import { createAmbitionDeck } from "../data/ambitions.js";
import { createHandDeck } from "../data/cards.js";
import {
  drawHandCards,
  drawRewardCardChoice,
  enforceHandLimit,
  getPlayableInternalCards,
  playInternalCard,
} from "./hand-cards.js";
import {
  assignFamilyAmbitions,
  revealCompletedAmbition,
  updateAmbitionCompletion,
} from "./ambitions.js";
import { createIndustryDeck, INDUSTRY_REGIONS } from "../data/industries.js";
import {
  advanceLifeStage,
  fertilitySuccess,
  isMarriageable,
} from "../data/life-cycle.js";
import {
  createRelation,
  relationName,
  resetRelationRoundUsage,
} from "./relations.js";

export const FAMILY_NAMES = [
  "清河崔氏",
  "范陽盧氏",
  "趙郡李氏",
  "滎陽鄭氏",
  "太原王氏",
];

export const ACTION_CATEGORIES = Object.freeze([
  "官職",
  "政治",
  "聯姻",
  "軍事／武力",
  "地方",
  "家族",
]);

export const ACTIONS = Object.freeze({
  SEEK_OFFICE: "seek_office",
  TAKE_TASK: "take_task",
  MARRIAGE: "marriage",
  PROPOSE_ALLIANCE: "propose_alliance",
  ACQUIRE_INDUSTRY: "acquire_industry",
  ESTABLISH_LOCAL_POWER: "establish_local_power",
  GATHER_MONEY: "gather_money",
  GATHER_FOOD: "gather_food",
});

export const BASE_ACTIONS_PER_ROUND = 3;
export const MAX_EXTRA_ACTIONS = 2;
export const PUBLIC_TASK_SLOTS = 3;
export const PUBLIC_INDUSTRY_SLOTS = 3;

export const ABILITY_RESULT_TABLE = Object.freeze({
  1: ["fail", "fail", "fail", "fail", "success", "success"],
  2: ["fail", "fail", "fail", "success", "success", "greatWin"],
  3: ["fail", "fail", "success", "success", "greatWin", "greatVictory"],
  4: ["fail", "success", "success", "success", "greatWin", "greatVictory"],
  5: ["fail", "success", "success", "greatWin", "greatWin", "greatVictory"],
});

export const HISTORICAL_EVALUATIONS = Object.freeze([
  {
    id: "clan_flourishing",
    name: "宗族盛多",
    check: (family) =>
      family.stats.births >= 3 && family.stats.livingDescendants >= 2,
  },
  {
    id: "generations_of_honor",
    name: "累世貴盛",
    check: (family) => {
      const generations = new Set(
        family.members
          .filter((member) => family.stats.officeCharacterIds.has(member.id))
          .map((member) => member.generation),
      );

      return (
        family.stats.officeCharacterIds.size >= 3 &&
        generations.size >= 2 &&
        family.stats.keyOfficeCharacterIds.size >= 1 &&
        family.stats.currentOfficeCharacterIds.size >= 1
      );
    },
  },
  {
    id: "marriage_flourishing",
    name: "婚姻之盛",
    check: (family) => family.stats.externalMarriageFamilies.size >= 3,
  },
  {
    id: "rich_estates",
    name: "家產豐富",
    check: (family) =>
      family.industryContracts.length >= 3 && family.stats.localRegions.size >= 2,
  },
  {
    id: "great_merit",
    name: "勳業至大",
    check: (family) => {
      const completed = family.history.completedTasks;
      return completed.length >= 3 && completed.some((task) => task.major);
    },
  },
]);

export function createSeededRng(seed = 1) {
  let state = Number(seed) >>> 0;

  return function rng() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createEventDeck(rng) {
  const upper = shuffle(
    [
      ...Array.from({ length: 8 }, () => ({ type: "calm" })),
      ...Array.from({ length: 2 }, () => ({ type: "unrest" })),
    ],
    rng,
  );

  const lower = shuffle(
    [
      ...Array.from({ length: 6 }, () => ({ type: "calm" })),
      ...Array.from({ length: 3 }, () => ({ type: "unrest" })),
      { type: "endgame" },
    ],
    rng,
  );

  return [...upper, ...lower];
}

function createMember({
  id,
  generation,
  sex,
  lifeStage,
  abilities,
  bornRound = null,
}) {
  return {
    id,
    generation,
    sex,
    lifeStage,
    turnsInStage: 0,
    adult:
      lifeStage === "成年" ||
      lifeStage === "壯年" ||
      lifeStage === "老年",
    alive: true,
    actedThisRound: false,
    currentOfficeId: null,
    marriageId: null,
    spouseRef: null,
    parentRefs: [],
    bornRound,
    abilities,
  };
}

function createMembers(familyId, familyIndex) {
  const thirdSex = familyIndex % 2 === 0 ? "男" : "女";

  return [
    createMember({
      id: `${familyId}-g1-a`,
      generation: 1,
      sex: "男",
      lifeStage: "壯年",
      abilities: { 武略: 3, 政務: 4, 君心: 2, 交際: 3, 名望: 3 },
    }),
    createMember({
      id: `${familyId}-g1-b`,
      generation: 1,
      sex: "女",
      lifeStage: "成年",
      abilities: { 武略: 2, 政務: 3, 君心: 4, 交際: 3, 名望: 3 },
    }),
    createMember({
      id: `${familyId}-g2-a`,
      generation: 2,
      sex: thirdSex,
      lifeStage: "成年",
      abilities: { 武略: 3, 政務: 2, 君心: 3, 交際: 4, 名望: 4 },
    }),
  ];
}

function createFamily(id, name, familyIndex) {
  return {
    id,
    name,
    resources: {
      money: 3,
      food: 3,
      influence: 3,
      households: 0,
      retainers: 0,
    },
    members: createMembers(id, familyIndex),
    hand: [],
    ambition: null,
    roundEffects: {
      taskAbilityBonus: 0,
      officeAbilityBonus: 0,
    },
    industryCapacity: 3,
    industryContracts: [],
    localAccessRegions: new Set(),
    actionEconomy: {
      baseActions: BASE_ACTIONS_PER_ROUND,
      extraActions: 0,
      remaining: BASE_ACTIONS_PER_ROUND,
    },
    history: {
      completedTasks: [],
    },
    stats: {
      births: 0,
      livingDescendants: 0,
      officeCharacterIds: new Set(),
      currentOfficeCharacterIds: new Set(),
      keyOfficeCharacterIds: new Set(),
      externalMarriageFamilies: new Set(),
      industries: 0,
      localRegions: new Set(),
      actionCounts: {},
    },
  };
}

function relationKey(familyAId, familyBId) {
  return [familyAId, familyBId].sort().join("::");
}

function createFamilyRelations(families) {
  const relations = new Map();

  for (let i = 0; i < families.length; i += 1) {
    for (let j = i + 1; j < families.length; j += 1) {
      const familyA = families[i];
      const familyB = families[j];
      relations.set(
        relationKey(familyA.id, familyB.id),
        createRelation(familyA.id, familyB.id),
      );
    }
  }

  return relations;
}

export function getFamilyRelation(game, familyAId, familyBId) {
  return game.familyRelations.get(relationKey(familyAId, familyBId)) ?? null;
}

function fillPublicTasks(game) {
  while (
    game.publicTasks.length < PUBLIC_TASK_SLOTS &&
    game.taskDeck.length > 0
  ) {
    game.publicTasks.push(game.taskDeck.shift());
  }
}

function fillPublicIndustries(game) {
  while (
    game.publicIndustries.length < PUBLIC_INDUSTRY_SLOTS &&
    game.industryDeck.length > 0
  ) {
    game.publicIndustries.push(game.industryDeck.shift());
  }
}

export function createGame({
  playerCount = 4,
  seed = 1,
  chooseAmbition,
} = {}) {
  if (playerCount < 2 || playerCount > 5) {
    throw new Error("playerCount 必須介於 2 到 5。");
  }

  const rng = createSeededRng(seed);
  const families = FAMILY_NAMES.slice(0, playerCount).map((name, index) =>
    createFamily(`family-${index + 1}`, name, index),
  );

  const game = {
    seed,
    rng,
    round: 1,
    unrest: 0,
    finalRound: false,
    ended: false,
    endReason: null,
    eventDeck: createEventDeck(rng),
    eventDiscard: [],
    officeBoard: createOfficeBoard(),
    taskDeck: createTaskDeck(rng),
    publicTasks: [],
    taskDiscard: [],
    industryDeck: createIndustryDeck(rng),
    publicIndustries: [],
    industryDiscard: [],
    ambitionDeck: createAmbitionDeck(rng),
    ambitionDiscard: [],
    handDeck: createHandDeck(rng),
    handDiscard: [],
    families,
    familyRelations: createFamilyRelations(families),
    marriages: [],
    nextMarriageNumber: 1,
    nextChildNumber: 1,
    nextAllianceNumber: 1,
    log: [],
  };

  fillPublicTasks(game);
  fillPublicIndustries(game);

  for (const family of families) {
    drawHandCards(game, family, 3);
  }

  assignFamilyAmbitions(game, chooseAmbition);
  startRound(game);

  return game;
}

export function resolveAbilityRoll(ability, die) {
  if (!Number.isInteger(ability) || ability < 1 || ability > 5) {
    throw new Error("能力值必須介於 1 到 5。");
  }

  if (!Number.isInteger(die) || die < 1 || die > 6) {
    throw new Error("骰值必須介於 1 到 6。");
  }

  return ABILITY_RESULT_TABLE[ability][die - 1];
}

function rollD6(game) {
  return Math.floor(game.rng() * 6) + 1;
}

function isSuccess(result) {
  return result !== "fail";
}

export function grantExtraAction(family, amount = 1) {
  const before = family.actionEconomy.extraActions;
  family.actionEconomy.extraActions = Math.min(
    MAX_EXTRA_ACTIONS,
    family.actionEconomy.extraActions + Math.max(0, amount),
  );
  return family.actionEconomy.extraActions - before;
}

export function startRound(game) {
  for (const family of game.families) {
    for (const member of family.members) {
      member.actedThisRound = false;
    }

    family.actionEconomy.remaining =
      family.actionEconomy.baseActions + family.actionEconomy.extraActions;
    family.actionEconomy.extraActions = 0;
    family.roundEffects.taskAbilityBonus = 0;
    family.roundEffects.officeAbilityBonus = 0;
  }

  for (const relation of game.familyRelations.values()) {
    resetRelationRoundUsage(relation);
  }
}

function drawWorldEvents(game, count = 2) {
  const drawn = game.eventDeck.splice(0, count);

  for (const event of drawn) {
    game.eventDiscard.push(event);

    if (event.type === "unrest") {
      game.unrest += 1;
      game.log.push(`第 ${game.round} 回合：天下動盪 +1。`);
    }

    if (event.type === "endgame" && !game.finalRound) {
      game.finalRound = true;
      game.endReason = "大變局事件";
      game.log.push(`第 ${game.round} 回合：翻出大變局，本回合為終局回合。`);
    }
  }

  if (game.unrest >= 5 && !game.finalRound) {
    game.finalRound = true;
    game.endReason = "天下動盪達到 5";
    game.log.push(
      `第 ${game.round} 回合：天下動盪達到 5，本回合為終局回合。`,
    );
  }

  return drawn;
}

function memberCanAct(member) {
  return member.alive && member.adult && !member.actedThisRound;
}

function officeById(game, officeId) {
  return game.officeBoard.find((office) => office.id === officeId) ?? null;
}

function familyById(game, familyId) {
  return game.families.find((family) => family.id === familyId) ?? null;
}

function findMember(family, memberId) {
  return family.members.find((member) => member.id === memberId) ?? null;
}

function canSeekOffice(game, family, member, targetOffice) {
  if (!memberCanAct(member)) return false;
  if (family.resources.influence < 1) return false;
  if (targetOffice.holder?.type === "player") return false;

  const currentOffice = member.currentOfficeId
    ? officeById(game, member.currentOfficeId)
    : null;

  if (!currentOffice) {
    return targetOffice.level <= 2;
  }

  return (
    targetOffice.id !== currentOffice.id &&
    targetOffice.level === currentOffice.level + 1
  );
}

function getOfficeActions(game, family) {
  const actions = [];

  for (const member of family.members) {
    if (!memberCanAct(member)) continue;

    for (const office of game.officeBoard) {
      if (!canSeekOffice(game, family, member, office)) continue;

      actions.push({
        type: ACTIONS.SEEK_OFFICE,
        category: "官職",
        actorId: member.id,
        targetOfficeId: office.id,
        label: member.currentOfficeId ? "升遷" : "就任",
      });
    }
  }

  return actions;
}

function getAvailableAssistants(game, family, task, actorId) {
  const assistants = [];

  for (const allyFamily of game.families) {
    if (allyFamily.id === family.id) continue;

    const relation = getFamilyRelation(game, family.id, allyFamily.id);
    if (!relation || relation.depth < 3) continue;

    for (const member of allyFamily.members) {
      if (!memberCanAct(member)) continue;

      const freeAtDepthFive =
        relation.depth >= 5 && !relation.roundUsage.freeAssistUsed;

      if (!freeAtDepthFive && allyFamily.actionEconomy.remaining <= 0) {
        continue;
      }

      assistants.push({
        assistingFamilyId: allyFamily.id,
        assistingMemberId: member.id,
        freeAtDepthFive,
      });
    }
  }

  return assistants;
}

function getTaskActions(game, family) {
  const actions = [];

  for (const member of family.members) {
    if (!memberCanAct(member)) continue;

    for (const task of game.publicTasks) {
      actions.push({
        type: ACTIONS.TAKE_TASK,
        category: task.actionCategory,
        actorId: member.id,
        taskInstanceId: task.instanceId,
      });

      for (const assistant of getAvailableAssistants(
        game,
        family,
        task,
        member.id,
      )) {
        actions.push({
          type: ACTIONS.TAKE_TASK,
          category: task.actionCategory,
          actorId: member.id,
          taskInstanceId: task.instanceId,
          assistance: assistant,
        });
      }
    }
  }

  return actions;
}

function getMarriageActions(game, family) {
  const actions = [];
  const ownCandidates = family.members.filter(
    (member) => memberCanAct(member) && isMarriageable(member),
  );

  for (const ownMember of ownCandidates) {
    for (const targetFamily of game.families) {
      if (targetFamily.id === family.id) continue;

      const targetMembers = targetFamily.members.filter(
        (member) =>
          isMarriageable(member) &&
          !member.actedThisRound &&
          member.sex !== ownMember.sex,
      );

      for (const targetMember of targetMembers) {
        actions.push({
          type: ACTIONS.MARRIAGE,
          category: "聯姻",
          actorId: ownMember.id,
          targetFamilyId: targetFamily.id,
          targetMemberId: targetMember.id,
        });
      }
    }
  }

  return actions;
}

function getAllianceActions(game, family) {
  return game.families
    .filter((target) => target.id !== family.id)
    .filter((target) => {
      const relation = getFamilyRelation(game, family.id, target.id);
      return relation && !relation.alliance;
    })
    .map((target) => ({
      type: ACTIONS.PROPOSE_ALLIANCE,
      category: "政治",
      targetFamilyId: target.id,
    }));
}

function familyHasRegionalOffice(game, family, region) {
  return game.officeBoard.some(
    (office) =>
      office.region === region &&
      office.holder?.type === "player" &&
      office.holder.familyId === family.id,
  );
}

function familyHasIndustryInRegion(family, region) {
  return family.industryContracts.some(
    (contract) => contract.region === region,
  );
}

function hasLocalFoothold(game, family, region) {
  return (
    familyHasRegionalOffice(game, family, region) ||
    familyHasIndustryInRegion(family, region) ||
    family.localAccessRegions.has(region)
  );
}

function canAcquireIndustry(game, family, industry) {
  if (family.industryContracts.length >= family.industryCapacity) return false;

  const cost = industry.acquisition.cost;

  if (industry.acquisition.type === "funding") {
    return (
      family.resources.money >= cost.money &&
      family.resources.influence >= cost.influence
    );
  }

  if (industry.acquisition.type === "office") {
    return (
      family.stats.currentOfficeCharacterIds.size >= 1 &&
      family.resources.money >= cost.money &&
      family.resources.influence >= cost.influence
    );
  }

  if (industry.acquisition.type === "local") {
    return (
      family.stats.localRegions.has(industry.region) &&
      family.resources.money >= cost.money &&
      family.resources.influence >= cost.influence
    );
  }

  return false;
}

function getIndustryActions(game, family) {
  return game.publicIndustries
    .filter((industry) => canAcquireIndustry(game, family, industry))
    .map((industry) => ({
      type: ACTIONS.ACQUIRE_INDUSTRY,
      category: "地方",
      industryInstanceId: industry.instanceId,
    }));
}

function getLocalPowerActions(game, family) {
  if (family.resources.influence < 1) return [];

  const actions = [];

  for (const member of family.members) {
    if (!memberCanAct(member)) continue;

    for (const region of INDUSTRY_REGIONS) {
      if (family.stats.localRegions.has(region)) continue;
      if (!hasLocalFoothold(game, family, region)) continue;

      actions.push({
        type: ACTIONS.ESTABLISH_LOCAL_POWER,
        category: "地方",
        actorId: member.id,
        region,
      });
    }
  }

  return actions;
}

export function getLegalActions(game, family) {
  if (family.actionEconomy.remaining <= 0) return [];

  return [
    ...getOfficeActions(game, family),
    ...getTaskActions(game, family),
    ...getMarriageActions(game, family),
    ...getAllianceActions(game, family),
    ...getIndustryActions(game, family),
    ...getLocalPowerActions(game, family),
    {
      type: ACTIONS.GATHER_MONEY,
      category: "家族",
    },
    {
      type: ACTIONS.GATHER_FOOD,
      category: "家族",
    },
  ];
}

function spendAction(family) {
  if (family.actionEconomy.remaining <= 0) {
    throw new Error(`${family.name} 已無剩餘主要行動。`);
  }

  family.actionEconomy.remaining -= 1;
}

function applySeekOffice(game, family, action) {
  const member = findMember(family, action.actorId);
  const targetOffice = officeById(game, action.targetOfficeId);

  if (!member || !targetOffice || !canSeekOffice(game, family, member, targetOffice)) {
    throw new Error("這次任官／升遷已不是合法行動。");
  }

  family.resources.influence -= 1;
  member.actedThisRound = true;

  const die = rollD6(game);
  const effectiveAbility = Math.min(
    5,
    member.abilities.君心 + family.roundEffects.officeAbilityBonus,
  );
  family.roundEffects.officeAbilityBonus = 0;
  const result = resolveAbilityRoll(effectiveAbility, die);

  if (!isSuccess(result)) {
    return { die, result, success: false };
  }

  if (member.currentOfficeId) {
    const oldOffice = officeById(game, member.currentOfficeId);
    if (oldOffice?.holder?.type === "player") {
      oldOffice.holder = null;
    }
  }

  targetOffice.holder = {
    type: "player",
    familyId: family.id,
    characterId: member.id,
  };
  member.currentOfficeId = targetOffice.id;

  family.stats.officeCharacterIds.add(member.id);
  family.stats.currentOfficeCharacterIds.add(member.id);
  if (targetOffice.keyOffice) {
    family.stats.keyOfficeCharacterIds.add(member.id);
  }

  return { die, result, success: true, officeId: targetOffice.id };
}

function applyTaskAssistance(game, family, task, assistance) {
  if (!assistance) return { abilityBonus: 0, assistance: null };

  const assistingFamily = familyById(game, assistance.assistingFamilyId);
  const assistingMember = assistingFamily
    ? findMember(assistingFamily, assistance.assistingMemberId)
    : null;
  const relation = assistingFamily
    ? getFamilyRelation(game, family.id, assistingFamily.id)
    : null;

  if (
    !assistingFamily ||
    !assistingMember ||
    !memberCanAct(assistingMember) ||
    !relation ||
    relation.depth < 3
  ) {
    throw new Error("這次協力已不是合法行動。");
  }

  const freeAtDepthFive =
    relation.depth >= 5 && !relation.roundUsage.freeAssistUsed;

  if (freeAtDepthFive) {
    relation.roundUsage.freeAssistUsed = true;
  } else {
    if (assistingFamily.actionEconomy.remaining <= 0) {
      throw new Error("協力家族已無主要行動可供支援。");
    }
    assistingFamily.actionEconomy.remaining -= 1;
  }

  assistingMember.actedThisRound = true;

  return {
    abilityBonus: 1,
    assistance: {
      familyId: assistingFamily.id,
      memberId: assistingMember.id,
      free: freeAtDepthFive,
      relationDepth: relation.depth,
    },
  };
}

function applyTask(game, family, action) {
  const member = findMember(family, action.actorId);
  const taskIndex = game.publicTasks.findIndex(
    (task) => task.instanceId === action.taskInstanceId,
  );
  const task = game.publicTasks[taskIndex];

  if (!member || !memberCanAct(member) || !task) {
    throw new Error("這次承接任務已不是合法行動。");
  }

  const assistanceResult = applyTaskAssistance(
    game,
    family,
    task,
    action.assistance,
  );

  member.actedThisRound = true;
  const die = rollD6(game);
  const baseAbility = member.abilities[task.ability];
  const effectiveAbility = Math.min(
    5,
    baseAbility +
      assistanceResult.abilityBonus +
      family.roundEffects.taskAbilityBonus,
  );
  family.roundEffects.taskAbilityBonus = 0;
  const result = resolveAbilityRoll(effectiveAbility, die);

  game.publicTasks.splice(taskIndex, 1);

  if (isSuccess(result)) {
    family.history.completedTasks.push({
      instanceId: task.instanceId,
      taskId: task.id,
      name: task.name,
      major: task.major,
      result,
      actorId: member.id,
      round: game.round,
      assistance: assistanceResult.assistance,
    });

    if (result === "success") family.resources.influence += 1;
    if (result === "greatWin") family.resources.influence += 2;
    if (result === "greatVictory") family.resources.influence += 3;
  } else {
    game.taskDiscard.push(task);
  }

  fillPublicTasks(game);

  return {
    die,
    result,
    success: isSuccess(result),
    taskName: task.name,
    major: task.major,
    baseAbility,
    effectiveAbility,
    assistance: assistanceResult.assistance,
  };
}

function applyMarriage(game, family, action) {
  const ownMember = findMember(family, action.actorId);
  const targetFamily = familyById(game, action.targetFamilyId);
  const targetMember = targetFamily
    ? findMember(targetFamily, action.targetMemberId)
    : null;

  if (
    !ownMember ||
    !targetFamily ||
    !targetMember ||
    !memberCanAct(ownMember) ||
    !isMarriageable(ownMember) ||
    !isMarriageable(targetMember) ||
    targetMember.actedThisRound ||
    ownMember.sex === targetMember.sex
  ) {
    throw new Error("這次聯姻已不是合法行動。");
  }

  const marriageNumber = game.nextMarriageNumber;
  game.nextMarriageNumber += 1;
  const marriageId = `marriage-${marriageNumber}`;
  const markerId = `姻${String(marriageNumber).padStart(2, "0")}`;

  ownMember.marriageId = marriageId;
  targetMember.marriageId = marriageId;
  ownMember.spouseRef = {
    familyId: targetFamily.id,
    memberId: targetMember.id,
  };
  targetMember.spouseRef = {
    familyId: family.id,
    memberId: ownMember.id,
  };
  ownMember.actedThisRound = true;
  targetMember.actedThisRound = true;

  const male =
    ownMember.sex === "男"
      ? { familyId: family.id, memberId: ownMember.id }
      : { familyId: targetFamily.id, memberId: targetMember.id };
  const female =
    ownMember.sex === "女"
      ? { familyId: family.id, memberId: ownMember.id }
      : { familyId: targetFamily.id, memberId: targetMember.id };

  game.marriages.push({
    id: marriageId,
    markerId,
    spouseA: { familyId: family.id, memberId: ownMember.id },
    spouseB: { familyId: targetFamily.id, memberId: targetMember.id },
    male,
    female,
    establishedRound: game.round,
    children: [],
    active: true,
  });

  family.stats.externalMarriageFamilies.add(targetFamily.id);
  targetFamily.stats.externalMarriageFamilies.add(family.id);
  family.resources.influence += 1;
  targetFamily.resources.influence += 1;

  const relation = getFamilyRelation(game, family.id, targetFamily.id);
  relation.marriages += 1;
  relation.depth = Math.min(5, relation.depth + 1);

  return {
    success: true,
    marriageId,
    markerId,
    targetFamilyId: targetFamily.id,
  };
}

function applyAllianceProposal(game, family, action) {
  const targetFamily = familyById(game, action.targetFamilyId);
  const relation = targetFamily
    ? getFamilyRelation(game, family.id, targetFamily.id)
    : null;

  if (!targetFamily || !relation || relation.alliance) {
    throw new Error("這次盟約提議已不是合法行動。");
  }

  return {
    success: true,
    pendingDecision: {
      type: "allianceProposal",
      proposerFamilyId: family.id,
      targetFamilyId: targetFamily.id,
    },
  };
}

export function resolveAllianceProposal(
  game,
  proposerFamilyId,
  targetFamilyId,
  accepted,
) {
  const proposer = familyById(game, proposerFamilyId);
  const target = familyById(game, targetFamilyId);
  const relation = getFamilyRelation(game, proposerFamilyId, targetFamilyId);

  if (!proposer || !target || !relation || relation.alliance) {
    throw new Error("盟約提議無法結算。");
  }

  if (!accepted) {
    return {
      accepted: false,
      depth: relation.depth,
      relationName: relationName(relation.depth),
    };
  }

  const allianceId = `alliance-${game.nextAllianceNumber}`;
  game.nextAllianceNumber += 1;
  relation.alliance = true;
  relation.allianceId = allianceId;
  relation.depth = Math.min(5, relation.depth + 1);

  return {
    accepted: true,
    allianceId,
    depth: relation.depth,
    relationName: relationName(relation.depth),
  };
}

export function dissolveAllianceMutually(game, familyAId, familyBId) {
  const relation = getFamilyRelation(game, familyAId, familyBId);

  if (!relation?.alliance) {
    throw new Error("雙方目前沒有可解除的盟約。");
  }

  relation.alliance = false;
  relation.allianceId = null;
  relation.depth = Math.max(0, relation.depth - 1);

  return {
    depth: relation.depth,
    relationName: relationName(relation.depth),
  };
}

export function betrayAlliance(game, actorFamilyId, targetFamilyId) {
  const actor = familyById(game, actorFamilyId);
  const relation = getFamilyRelation(game, actorFamilyId, targetFamilyId);

  if (!actor || !relation?.alliance) {
    throw new Error("目前沒有可背棄的盟約。");
  }

  const originalDepth = relation.depth;
  actor.resources.influence = Math.max(
    0,
    actor.resources.influence - originalDepth,
  );
  relation.alliance = false;
  relation.allianceId = null;
  relation.depth = Math.max(0, relation.depth - 2);

  return {
    influenceLost: originalDepth,
    depth: relation.depth,
    relationName: relationName(relation.depth),
  };
}

export function canDirectHostileAction(game, actorFamilyId, targetFamilyId) {
  const relation = getFamilyRelation(game, actorFamilyId, targetFamilyId);
  return !relation?.alliance;
}

export function provideFamilyAid(
  game,
  fromFamilyId,
  toFamilyId,
  { money = 0, food = 0 } = {},
) {
  const from = familyById(game, fromFamilyId);
  const to = familyById(game, toFamilyId);
  const relation = getFamilyRelation(game, fromFamilyId, toFamilyId);
  const total = money + food;

  if (!from || !to || !relation || relation.depth < 1) {
    throw new Error("雙方關係尚未達到「往來」。");
  }

  if (
    !Number.isInteger(money) ||
    !Number.isInteger(food) ||
    money < 0 ||
    food < 0 ||
    total < 1 ||
    total > 2
  ) {
    throw new Error("一次援助最多移轉 2 點錢／糧食。");
  }

  if (relation.roundUsage.aidProvidedBy[fromFamilyId]) {
    throw new Error("本回合此家族已提供過一次免費援助。");
  }

  if (from.resources.money < money || from.resources.food < food) {
    throw new Error("援助方資源不足。");
  }

  from.resources.money -= money;
  from.resources.food -= food;
  to.resources.money += money;
  to.resources.food += food;
  relation.roundUsage.aidProvidedBy[fromFamilyId] = true;

  return { money, food };
}

function applyAcquireIndustry(game, family, action) {
  const industryIndex = game.publicIndustries.findIndex(
    (industry) => industry.instanceId === action.industryInstanceId,
  );
  const industry = game.publicIndustries[industryIndex];

  if (!industry || !canAcquireIndustry(game, family, industry)) {
    throw new Error("這次取得產業契券已不是合法行動。");
  }

  const cost = industry.acquisition.cost;
  family.resources.money -= cost.money;
  family.resources.influence -= cost.influence;

  game.publicIndustries.splice(industryIndex, 1);
  family.industryContracts.push(industry);
  family.stats.industries = family.industryContracts.length;
  fillPublicIndustries(game);

  return {
    success: true,
    industryInstanceId: industry.instanceId,
    industryName: industry.name,
    region: industry.region,
  };
}

function applyEstablishLocalPower(game, family, action) {
  const member = findMember(family, action.actorId);

  if (
    !member ||
    !memberCanAct(member) ||
    family.resources.influence < 1 ||
    family.stats.localRegions.has(action.region) ||
    !hasLocalFoothold(game, family, action.region)
  ) {
    throw new Error("這次經營鄉里已不是合法行動。");
  }

  family.resources.influence -= 1;
  member.actedThisRound = true;

  const die = rollD6(game);
  const result = resolveAbilityRoll(member.abilities.政務, die);

  if (isSuccess(result)) {
    family.stats.localRegions.add(action.region);
  }

  return {
    die,
    result,
    success: isSuccess(result),
    region: action.region,
  };
}

export function settleIndustryIncome(game) {
  const settlement = [];

  for (const family of game.families) {
    let money = 0;
    let food = 0;

    for (const contract of family.industryContracts) {
      money += contract.income.money;
      food += contract.income.food;
    }

    family.resources.money += money;
    family.resources.food += food;
    settlement.push({ familyId: family.id, money, food });
  }

  return settlement;
}

export function abandonIndustryContract(game, familyId, contractInstanceId) {
  const family = familyById(game, familyId);
  if (!family) throw new Error("找不到要放棄產業的家族。");

  const index = family.industryContracts.findIndex(
    (contract) => contract.instanceId === contractInstanceId,
  );

  if (index < 0) {
    throw new Error("找不到要放棄的產業契券。");
  }

  const [contract] = family.industryContracts.splice(index, 1);
  family.stats.industries = family.industryContracts.length;
  game.industryDiscard.push(contract);

  return contract;
}

export function transferIndustryContract(
  game,
  fromFamilyId,
  toFamilyId,
  contractInstanceId,
) {
  const from = familyById(game, fromFamilyId);
  const to = familyById(game, toFamilyId);
  const relation = getFamilyRelation(game, fromFamilyId, toFamilyId);

  if (!from || !to || from.id === to.id) {
    throw new Error("資產讓渡的家族資料無效。");
  }

  if (to.industryContracts.length >= to.industryCapacity) {
    throw new Error("受讓方沒有空的產業契券欄位。");
  }

  const index = from.industryContracts.findIndex(
    (contract) => contract.instanceId === contractInstanceId,
  );
  if (index < 0) {
    throw new Error("讓渡方沒有這張產業契券。");
  }

  const useFreeTransfer =
    relation?.depth >= 2 && !relation.roundUsage.freeAssetTransferUsed;

  if (useFreeTransfer) {
    relation.roundUsage.freeAssetTransferUsed = true;
  } else {
    spendAction(from);
  }

  const [contract] = from.industryContracts.splice(index, 1);
  to.industryContracts.push(contract);
  from.stats.industries = from.industryContracts.length;
  to.stats.industries = to.industryContracts.length;

  return {
    contractInstanceId,
    fromFamilyId,
    toFamilyId,
    usedFreeTransfer: useFreeTransfer,
  };
}

export function markFreeAssetTransferUsed(game, familyAId, familyBId) {
  const relation = getFamilyRelation(game, familyAId, familyBId);

  if (!relation || relation.depth < 2) {
    throw new Error("雙方關係尚未達到「通財」。");
  }

  if (relation.roundUsage.freeAssetTransferUsed) {
    throw new Error("本回合已使用過一次免費資產讓渡。");
  }

  relation.roundUsage.freeAssetTransferUsed = true;
  return true;
}

export function shareResourceLoss(
  game,
  helperFamilyId,
  affectedFamilyId,
  resource,
) {
  const helper = familyById(game, helperFamilyId);
  const affected = familyById(game, affectedFamilyId);
  const relation = getFamilyRelation(game, helperFamilyId, affectedFamilyId);

  if (!helper || !affected || !relation || relation.depth < 4) {
    throw new Error("雙方關係尚未達到「共擔」。");
  }

  if (relation.roundUsage.sharedBurdenUsed) {
    throw new Error("本回合已使用過一次「共擔」。");
  }

  if (!["money", "food"].includes(resource)) {
    throw new Error("目前「共擔」只支援錢或糧食損失。");
  }

  if (helper.resources[resource] < 1) {
    throw new Error("協助方沒有足夠資源承擔損失。");
  }

  helper.resources[resource] -= 1;
  relation.roundUsage.sharedBurdenUsed = true;

  return {
    helperFamilyId,
    affectedFamilyId,
    resource,
    amount: 1,
  };
}

export function applyAction(game, family, action) {
  const legal = getLegalActions(game, family).some(
    (candidate) => JSON.stringify(candidate) === JSON.stringify(action),
  );

  if (!legal) {
    throw new Error("AI 嘗試執行目前不合法的行動。");
  }

  spendAction(family);
  family.stats.actionCounts[action.type] =
    (family.stats.actionCounts[action.type] ?? 0) + 1;

  switch (action.type) {
    case ACTIONS.SEEK_OFFICE:
      return applySeekOffice(game, family, action);
    case ACTIONS.TAKE_TASK:
      return applyTask(game, family, action);
    case ACTIONS.MARRIAGE:
      return applyMarriage(game, family, action);
    case ACTIONS.PROPOSE_ALLIANCE:
      return applyAllianceProposal(game, family, action);
    case ACTIONS.ACQUIRE_INDUSTRY:
      return applyAcquireIndustry(game, family, action);
    case ACTIONS.ESTABLISH_LOCAL_POWER:
      return applyEstablishLocalPower(game, family, action);
    case ACTIONS.GATHER_MONEY:
      family.resources.money += 1;
      return { success: true };
    case ACTIONS.GATHER_FOOD:
      family.resources.food += 1;
      return { success: true };
    default:
      throw new Error(`未知行動：${action.type}`);
  }
}

export function processBirths(game) {
  const births = [];

  for (const marriage of game.marriages) {
    if (!marriage.active) continue;
    if (marriage.children.length >= 3) continue;
    if (game.round <= marriage.establishedRound) continue;

    const fatherFamily = familyById(game, marriage.male.familyId);
    const motherFamily = familyById(game, marriage.female.familyId);
    const father = fatherFamily
      ? findMember(fatherFamily, marriage.male.memberId)
      : null;
    const mother = motherFamily
      ? findMember(motherFamily, marriage.female.memberId)
      : null;

    if (!father?.alive || !mother?.alive) continue;

    const die = rollD6(game);
    if (!fertilitySuccess(mother.lifeStage, die)) continue;

    const childNumber = game.nextChildNumber;
    game.nextChildNumber += 1;
    const childId = `${fatherFamily.id}-child-${childNumber}`;
    const childSex = game.rng() < 0.5 ? "男" : "女";

    const child = createMember({
      id: childId,
      generation: father.generation + 1,
      sex: childSex,
      lifeStage: "小孩",
      abilities: { 武略: 1, 政務: 1, 君心: 1, 交際: 1, 名望: 1 },
      bornRound: game.round,
    });
    child.parentRefs = [
      { familyId: fatherFamily.id, memberId: father.id, role: "父" },
      { familyId: motherFamily.id, memberId: mother.id, role: "母" },
    ];

    fatherFamily.members.push(child);
    fatherFamily.stats.births += 1;
    fatherFamily.stats.livingDescendants += 1;
    motherFamily.resources.influence += 1;

    marriage.children.push({
      familyId: fatherFamily.id,
      memberId: child.id,
    });

    const relation = getFamilyRelation(
      game,
      fatherFamily.id,
      motherFamily.id,
    );
    relation.depth = Math.min(5, relation.depth + 1);

    births.push({
      marriageId: marriage.id,
      childFamilyId: fatherFamily.id,
      childId: child.id,
      fatherFamilyId: fatherFamily.id,
      motherFamilyId: motherFamily.id,
      die,
    });
  }

  return births;
}

export function processEndOfRoundLife(game) {
  const births = processBirths(game);

  for (const family of game.families) {
    for (const member of family.members) {
      advanceLifeStage(member, game.round);
    }
  }

  return births;
}

export function evaluateFamily(family) {
  const achieved = HISTORICAL_EVALUATIONS.filter((evaluation) =>
    evaluation.check(family),
  );

  return {
    familyId: family.id,
    familyName: family.name,
    achieved: achieved.map((evaluation) => ({
      id: evaluation.id,
      name: evaluation.name,
    })),
    count: achieved.length,
  };
}

export function determineWinners(families) {
  const results = families.map(evaluateFamily);
  const highest = Math.max(...results.map((result) => result.count));

  return {
    highest,
    results,
    winners: results.filter((result) => result.count === highest),
  };
}

function runFamilyInternalOperations(
  game,
  family,
  chooseInternalCard,
) {
  drawHandCards(game, family, 1);

  const playableCards = getPlayableInternalCards(family);

  if (playableCards.length && typeof chooseInternalCard === "function") {
    const selected = chooseInternalCard({
      game,
      family,
      playableCards,
      rng: game.rng,
    });

    if (selected?.instanceId) {
      playInternalCard(game, family, selected.instanceId);
    }
  }

  enforceHandLimit(game, family);
}

function updateAndMaybeRevealAmbition(
  game,
  family,
  shouldRevealAmbition,
  chooseRewardCard,
) {
  const completed = updateAmbitionCompletion(game, family);
  if (!completed || family.ambition.revealed) return false;

  const reveal =
    typeof shouldRevealAmbition === "function"
      ? shouldRevealAmbition({ game, family, rng: game.rng })
      : false;

  if (!reveal) return false;

  const revealed = revealCompletedAmbition(
    game,
    family,
    drawRewardCardChoice,
    chooseRewardCard,
  );
  enforceHandLimit(game, family);
  return revealed;
}

export function runGame({
  playerCount = 4,
  seed = 1,
  chooseAction,
  respondToAlliance,
  chooseAmbition,
  chooseInternalCard,
  chooseRewardCard,
  shouldRevealAmbition,
} = {}) {
  if (typeof chooseAction !== "function") {
    throw new Error("runGame 需要 chooseAction 函式。");
  }

  const allianceResponder =
    typeof respondToAlliance === "function"
      ? respondToAlliance
      : () => false;

  const game = createGame({
    playerCount,
    seed,
    chooseAmbition,
  });

  while (!game.ended) {
    drawWorldEvents(game, 2);

    for (const family of game.families) {
      runFamilyInternalOperations(
        game,
        family,
        chooseInternalCard,
      );
      updateAndMaybeRevealAmbition(
        game,
        family,
        shouldRevealAmbition,
        chooseRewardCard,
      );
    }

    let familiesWithActions = true;

    while (familiesWithActions) {
      familiesWithActions = false;

      for (const family of game.families) {
        if (family.actionEconomy.remaining <= 0) continue;

        familiesWithActions = true;
        const legalActions = getLegalActions(game, family);
        const action = chooseAction({
          game,
          family,
          legalActions,
          rng: game.rng,
        });

        if (!action) {
          family.actionEconomy.remaining = 0;
          continue;
        }

        const actionResult = applyAction(game, family, action);

        updateAndMaybeRevealAmbition(
          game,
          family,
          shouldRevealAmbition,
          chooseRewardCard,
        );

        if (actionResult?.pendingDecision?.type === "allianceProposal") {
          const proposer = familyById(
            game,
            actionResult.pendingDecision.proposerFamilyId,
          );
          const target = familyById(
            game,
            actionResult.pendingDecision.targetFamilyId,
          );
          const accepted = allianceResponder({
            game,
            proposer,
            target,
            rng: game.rng,
          });

          resolveAllianceProposal(
            game,
            proposer.id,
            target.id,
            Boolean(accepted),
          );
        }
      }
    }

    settleIndustryIncome(game);
    processEndOfRoundLife(game);

    for (const family of game.families) {
      updateAndMaybeRevealAmbition(
        game,
        family,
        shouldRevealAmbition,
        chooseRewardCard,
      );
      enforceHandLimit(game, family);
    }

    if (game.finalRound || game.eventDeck.length === 0) {
      game.ended = true;
      if (!game.endReason) {
        game.endReason = "事件牌堆耗盡";
      }
    } else {
      game.round += 1;
      startRound(game);
    }

    if (game.round > 20) {
      throw new Error("模擬超過 20 回合，可能存在終局流程錯誤。");
    }
  }

  return {
    game,
    outcome: determineWinners(game.families),
  };
}

export function relationSnapshot(game) {
  return [...game.familyRelations.values()].map((relation) => ({
    familyAId: relation.familyAId,
    familyBId: relation.familyBId,
    depth: relation.depth,
    name: relationName(relation.depth),
    alliance: relation.alliance,
    marriages: relation.marriages,
  }));
}

export function familySnapshot(family) {
  return {
    name: family.name,
    money: family.resources.money,
    food: family.resources.food,
    influence: family.resources.influence,
    familyMembers: family.members.length,
    births: family.stats.births,
    livingDescendants: family.stats.livingDescendants,
    marriageFamilies: family.stats.externalMarriageFamilies.size,
    officials: family.stats.officeCharacterIds.size,
    currentOfficials: family.stats.currentOfficeCharacterIds.size,
    keyOfficials: family.stats.keyOfficeCharacterIds.size,
    completedTasks: family.history.completedTasks.length,
    greatTasks: family.history.completedTasks.filter((task) => task.major).length,
    industries: family.industryContracts.length,
    industryCapacity: family.industryCapacity,
    localRegions: family.stats.localRegions.size,
    handSize: family.hand.length,
    ambition: family.ambition?.card?.title ?? null,
    ambitionCompleted: family.ambition?.completed ?? false,
    ambitionRevealed: family.ambition?.revealed ?? false,
  };
}
