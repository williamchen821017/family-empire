export const FAMILY_NAMES = [
  "清河崔氏",
  "范陽盧氏",
  "趙郡李氏",
  "滎陽鄭氏",
  "太原王氏",
];

export const REGIONS = ["冀州", "相州", "雍州", "豫州"];

export const ACTIONS = Object.freeze({
  FAMILY_GROWTH: "family_growth",
  SEEK_OFFICE: "seek_office",
  MARRIAGE: "marriage",
  INDUSTRY: "industry",
  LOCAL_POWER: "local_power",
  MISSION: "mission",
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
        family.stats.keyOfficeIds.size >= 1 &&
        family.stats.currentOfficeIds.size >= 1
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
    check: (family) =>
      family.stats.completedMissions >= 3 && family.stats.greatMissions >= 1,
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

function createFamily(id, name) {
  const members = [
    { id: `${id}-g1-a`, generation: 1, adult: true, alive: true, age: 4 },
    { id: `${id}-g1-b`, generation: 1, adult: true, alive: true, age: 4 },
    { id: `${id}-g2-a`, generation: 2, adult: true, alive: true, age: 3 },
  ];

  return {
    id,
    name,
    influence: 3,
    members,
    stats: {
      births: 0,
      livingDescendants: 0,
      officeCharacterIds: new Set(),
      currentOfficeIds: new Set(),
      keyOfficeIds: new Set(),
      externalMarriageFamilies: new Set(),
      industries: 0,
      localRegions: new Set(),
      completedMissions: 0,
      greatMissions: 0,
    },
  };
}

export function createGame({ playerCount = 4, seed = 1 } = {}) {
  if (playerCount < 2 || playerCount > 5) {
    throw new Error("playerCount 必須介於 2 到 5。");
  }

  const rng = createSeededRng(seed);
  const families = FAMILY_NAMES.slice(0, playerCount).map((name, index) =>
    createFamily(`family-${index + 1}`, name),
  );

  return {
    seed,
    rng,
    round: 1,
    unrest: 0,
    finalRound: false,
    ended: false,
    endReason: null,
    eventDeck: createEventDeck(rng),
    eventDiscard: [],
    families,
    log: [],
  };
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
    game.log.push(`第 ${game.round} 回合：天下動盪達到 5，本回合為終局回合。`);
  }

  return drawn;
}

function findAdultWithoutOffice(family) {
  return family.members.find(
    (member) =>
      member.alive &&
      member.adult &&
      !family.stats.officeCharacterIds.has(member.id),
  );
}

export function getLegalActions(game, family) {
  const actions = [ACTIONS.MISSION];

  if (family.stats.births < 5) {
    actions.push(ACTIONS.FAMILY_GROWTH);
  }

  if (findAdultWithoutOffice(family)) {
    actions.push(ACTIONS.SEEK_OFFICE);
  }

  if (family.stats.externalMarriageFamilies.size < game.families.length - 1) {
    actions.push(ACTIONS.MARRIAGE);
  }

  if (family.stats.industries < 5) {
    actions.push(ACTIONS.INDUSTRY);
  }

  if (family.stats.localRegions.size < REGIONS.length) {
    actions.push(ACTIONS.LOCAL_POWER);
  }

  return actions;
}

function applyFamilyGrowth(game, family) {
  if (game.rng() >= 0.5) return;

  const nextGeneration =
    Math.max(...family.members.map((member) => member.generation)) + 1;
  const childId = `${family.id}-child-${family.stats.births + 1}`;

  family.members.push({
    id: childId,
    generation: nextGeneration,
    adult: false,
    alive: true,
    age: 0,
  });
  family.stats.births += 1;
  family.stats.livingDescendants += 1;
}

function applySeekOffice(game, family) {
  const member = findAdultWithoutOffice(family);
  if (!member || game.rng() >= 0.65) return;

  family.stats.officeCharacterIds.add(member.id);
  family.stats.currentOfficeIds.add(member.id);

  if (game.rng() < 0.3) {
    family.stats.keyOfficeIds.add(member.id);
  }

  family.influence += 1;
}

function applyMarriage(game, family) {
  const candidates = game.families.filter(
    (other) =>
      other.id !== family.id &&
      !family.stats.externalMarriageFamilies.has(other.id),
  );

  if (!candidates.length) return;

  const target = candidates[Math.floor(game.rng() * candidates.length)];
  family.stats.externalMarriageFamilies.add(target.id);
  target.stats.externalMarriageFamilies.add(family.id);
  family.influence += 1;
  target.influence += 1;
}

function applyIndustry(game, family) {
  if (family.stats.industries >= 5) return;
  if (game.rng() < 0.75) {
    family.stats.industries += 1;
  }
}

function applyLocalPower(game, family) {
  const candidates = REGIONS.filter(
    (region) => !family.stats.localRegions.has(region),
  );

  if (!candidates.length || game.rng() >= 0.65) return;

  const region = candidates[Math.floor(game.rng() * candidates.length)];
  family.stats.localRegions.add(region);
}

function applyMission(game, family) {
  if (game.rng() >= 0.65) return;

  family.stats.completedMissions += 1;
  family.influence += 1;

  if (game.rng() < 0.25) {
    family.stats.greatMissions += 1;
  }
}

export function applyAction(game, family, action) {
  switch (action) {
    case ACTIONS.FAMILY_GROWTH:
      applyFamilyGrowth(game, family);
      break;
    case ACTIONS.SEEK_OFFICE:
      applySeekOffice(game, family);
      break;
    case ACTIONS.MARRIAGE:
      applyMarriage(game, family);
      break;
    case ACTIONS.INDUSTRY:
      applyIndustry(game, family);
      break;
    case ACTIONS.LOCAL_POWER:
      applyLocalPower(game, family);
      break;
    case ACTIONS.MISSION:
      applyMission(game, family);
      break;
    default:
      throw new Error(`未知行動：${action}`);
  }
}

function advanceFamilyTime(family) {
  for (const member of family.members) {
    if (!member.alive) continue;

    member.age += 1;

    if (!member.adult && member.age >= 2) {
      member.adult = true;
    }
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
  actionsPerFamily = 3,
} = {}) {
  if (typeof chooseAction !== "function") {
    throw new Error("runGame 需要 chooseAction 函式。");
  }

  const game = createGame({ playerCount, seed });

  while (!game.ended) {
    drawWorldEvents(game, 2);

    for (let actionIndex = 0; actionIndex < actionsPerFamily; actionIndex += 1) {
      for (const family of game.families) {
        const legalActions = getLegalActions(game, family);
        const action = chooseAction({
          game,
          family,
          legalActions,
          rng: game.rng,
        });

        if (action) {
          applyAction(game, family, action);
        }
      }
    }

    for (const family of game.families) {
      advanceFamilyTime(family);
    }

    if (game.finalRound || game.eventDeck.length === 0) {
      game.ended = true;
      if (!game.endReason) {
        game.endReason = "事件牌堆耗盡";
      }
    } else {
      game.round += 1;
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
    influence: family.influence,
    births: family.stats.births,
    livingDescendants: family.stats.livingDescendants,
    officials: family.stats.officeCharacterIds.size,
    keyOfficials: family.stats.keyOfficeIds.size,
    currentOfficials: family.stats.currentOfficeIds.size,
    marriageFamilies: family.stats.externalMarriageFamilies.size,
    industries: family.stats.industries,
    localRegions: family.stats.localRegions.size,
    completedMissions: family.stats.completedMissions,
    greatMissions: family.stats.greatMissions,
  };
}
