import { createOfficeBoard } from "../data/offices.js";
import { createTaskDeck } from "../data/tasks.js";

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
  GATHER_MONEY: "gather_money",
  GATHER_FOOD: "gather_food",
});

export const BASE_ACTIONS_PER_ROUND = 3;
export const MAX_EXTRA_ACTIONS = 2;
export const PUBLIC_TASK_SLOTS = 3;

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
      family.stats.industries >= 3 && family.stats.localRegions.size >= 2,
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

function createMembers(familyId) {
  return [
    {
      id: `${familyId}-g1-a`,
      generation: 1,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 3, 政務: 4, 君心: 2, 交際: 3, 名望: 3 },
    },
    {
      id: `${familyId}-g1-b`,
      generation: 1,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 2, 政務: 3, 君心: 4, 交際: 3, 名望: 3 },
    },
    {
      id: `${familyId}-g2-a`,
      generation: 2,
      adult: true,
      alive: true,
      actedThisRound: false,
      currentOfficeId: null,
      abilities: { 武略: 3, 政務: 2, 君心: 3, 交際: 4, 名望: 4 },
    },
  ];
}

function createFamily(id, name) {
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
    members: createMembers(id),
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
    },
  };
}

function fillPublicTasks(game) {
  while (
    game.publicTasks.length < PUBLIC_TASK_SLOTS &&
    game.taskDeck.length > 0
  ) {
    game.publicTasks.push(game.taskDeck.shift());
  }
}

export function createGame({ playerCount = 4, seed = 1 } = {}) {
  if (playerCount < 2 || playerCount > 5) {
    throw new Error("playerCount 必須介於 2 到 5。");
  }

  const rng = createSeededRng(seed);
  const families = FAMILY_NAMES.slice(0, playerCount).map((name, index) =>
    createFamily(`family-${index + 1}`, name),
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
    families,
    log: [],
  };

  fillPublicTasks(game);
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
    }
  }

  return actions;
}

export function getLegalActions(game, family) {
  if (family.actionEconomy.remaining <= 0) return [];

  return [
    ...getOfficeActions(game, family),
    ...getTaskActions(game, family),
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

function findMember(family, memberId) {
  return family.members.find((member) => member.id === memberId) ?? null;
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
  const result = resolveAbilityRoll(member.abilities.君心, die);

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

function applyTask(game, family, action) {
  const member = findMember(family, action.actorId);
  const taskIndex = game.publicTasks.findIndex(
    (task) => task.instanceId === action.taskInstanceId,
  );
  const task = game.publicTasks[taskIndex];

  if (!member || !memberCanAct(member) || !task) {
    throw new Error("這次承接任務已不是合法行動。");
  }

  member.actedThisRound = true;
  const die = rollD6(game);
  const ability = member.abilities[task.ability];
  const result = resolveAbilityRoll(ability, die);

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

  switch (action.type) {
    case ACTIONS.SEEK_OFFICE:
      return applySeekOffice(game, family, action);
    case ACTIONS.TAKE_TASK:
      return applyTask(game, family, action);
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

export function runGame({
  playerCount = 4,
  seed = 1,
  chooseAction,
} = {}) {
  if (typeof chooseAction !== "function") {
    throw new Error("runGame 需要 chooseAction 函式。");
  }

  const game = createGame({ playerCount, seed });

  while (!game.ended) {
    drawWorldEvents(game, 2);

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

        applyAction(game, family, action);
      }
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

export function familySnapshot(family) {
  return {
    name: family.name,
    money: family.resources.money,
    food: family.resources.food,
    influence: family.resources.influence,
    officials: family.stats.officeCharacterIds.size,
    currentOfficials: family.stats.currentOfficeCharacterIds.size,
    keyOfficials: family.stats.keyOfficeCharacterIds.size,
    completedTasks: family.history.completedTasks.length,
    greatTasks: family.history.completedTasks.filter((task) => task.major).length,
    births: family.stats.births,
    marriageFamilies: family.stats.externalMarriageFamilies.size,
    industries: family.stats.industries,
    localRegions: family.stats.localRegions.size,
  };
}
