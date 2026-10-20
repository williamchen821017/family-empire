import { INDUSTRY_YIELD, STAGE_ORDER } from "./data.mjs";
import { playerByFamily, birthFamilyCharacters, characterById } from "./state.mjs";
import { RULES_PROFILE } from "../rules-profile.mjs";

const T = RULES_PROFILE.test;
const C = RULES_PROFILE.confirmed;

function record(state, item) { state.trace.push(item); }

function choose(state, context, kind, familyId, options) {
  if (!options.length) return null;
  if (!context?.choiceProvider) throw new Error(`Headless engine requires choiceProvider for settlement choice: ${kind}`);
  const picked = context.choiceProvider({ state, kind, familyId, options });
  const id = typeof picked === "string" ? picked : picked?.id;
  const found = options.find(o => o.id === id);
  if (!found) throw new Error(`choiceProvider returned illegal ${kind} choice: ${id}`);
  return found;
}

function totalTroops(p) { return Object.values(p.troopsByRegion).reduce((a,b)=>a+b,0); }

function resolveExcessTroopUpkeep(state, context) {
  for (const p of state.players) {
    let excess = Math.max(0, p.resources.troops - T.normalTroopCapacity);
    if (!excess) continue;
    const payableUnits = Math.min(excess, Math.floor(p.resources.money / T.excessTroopMoneyCostEach));
    p.resources.money -= payableUnits * T.excessTroopMoneyCostEach;
    excess -= payableUnits;
    while (excess > 0) {
      const options = Object.entries(p.troopsByRegion).filter(([,n]) => n > 0).map(([region]) => ({ id: region, region }));
      const selected = choose(state, context, "disband-excess-troop", p.familyId, options);
      if (!selected) throw new Error(`No troop available to disband for ${p.familyId}`);
      p.troopsByRegion[selected.region] -= 1;
      p.resources.troops -= 1;
      excess -= 1;
      record(state, { t:"troop-disband", round:state.round, familyId:p.familyId, region:selected.region, reason:"unpaid-excess" });
    }
    if (p.resources.troops !== totalTroops(p)) throw new Error(`Troop bookkeeping mismatch after upkeep for ${p.familyId}`);
  }
}

function eligibleBirthCouples(state, familyId) {
  const result = [];
  const males = birthFamilyCharacters(state, familyId, { includeDead:false }).filter(c => c.sex === "男" && c.spouseId);
  for (const h of males) {
    const w = characterById(state, h.spouseId);
    if (!w?.alive) continue;
    if (!["adult","prime1","prime2"].includes(h.stage)) continue;
    if (!["adult","prime1","prime2"].includes(w.stage)) continue;
    result.push({ id: `${h.id}+${w.id}`, husbandId:h.id, wifeId:w.id });
  }
  return result;
}

function generateAdultBase(rng) {
  const keys = ["command","governance","royalFavor","social","reputation"];
  const out = {};
  for (const key of keys) {
    const r = rng.d6();
    out[key] = r === 1 ? 1 : r === 2 ? 2 : r <= 4 ? 3 : r === 5 ? 4 : 5;
  }
  return out;
}

function resolveBirth(state, familyId, context) {
  const options = eligibleBirthCouples(state, familyId);
  if (!options.length) return;
  const chosen = choose(state, context, "important-birth-couple", familyId, options);
  if (!chosen) return;

  const diamondNo = state.diamondCount + 1;
  const metricKey = `${diamondNo}:${familyId}`;
  state.metrics.birthChecks[metricKey] = (state.metrics.birthChecks[metricKey] || 0) + 1;

  const h = characterById(state, chosen.husbandId);
  const w = characterById(state, chosen.wifeId);
  const need = h.stage === "prime2" || w.stage === "prime2" ? C.lateBirthMinRoll : C.normalBirthMinRoll;
  const roll = context.rng.d6();
  record(state, { t:"birth-check", round:state.round, diamond:diamondNo, familyId, husbandId:h.id, wifeId:w.id, roll, need });
  if (roll < need) return;

  const p = playerByFamily(state, familyId);
  p.metrics.births += 1;
  const id = `${familyId}-born-${p.metrics.births}`;
  const sexRoll = context.rng.d6();
  const sex = sexRoll <= 3 ? "男" : "女";
  const adultBase = generateAdultBase(context.rng);
  const growthCandidates = Object.keys(adultBase).filter(k => adultBase[k] < 5);
  const growth = context.rng.pick(growthCandidates) || "governance";
  state.characters[id] = {
    id, sex, stage:"child", stats:{}, seniority:0, location:p.root, gen:(h.gen || 0) + 1, branch:h.branch,
    fatherId:h.id, motherId:w.id, spouseId:null, growth, adultBase, officeLevel:0, inService:false, exitedPolitics:false,
    titleTier:0, birthFamilyId:familyId, controllerFamilyId:familyId, alive:true, actionsUsed:0, moveUsed:false,
    careerAdvanceAttempted:false, maxSeniorityEver:0, gameBorn:true, _newbornThisDiamond:true
  };
  record(state, { t:"birth", round:state.round, diamond:diamondNo, familyId, childId:id, sex, branch:h.branch });
}

function isPaternalDescendant(state, candidate, ancestorId) {
  let cur = candidate;
  const seen = new Set();
  while (cur?.fatherId && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.fatherId === ancestorId) return true;
    cur = characterById(state, cur.fatherId);
  }
  return false;
}

function resolveTitleInheritance(state, dead, context) {
  if (!dead.titleTier) return;
  const candidates = birthFamilyCharacters(state, dead.birthFamilyId, { includeDead:false })
    .filter(c => c.sex === "男" && isPaternalDescendant(state, c, dead.id));
  if (!candidates.length) {
    record(state, { t:"title-extinct", round:state.round, holderId:dead.id, tier:dead.titleTier });
    return;
  }
  const minGen = Math.min(...candidates.map(c => c.gen));
  const nearest = candidates.filter(c => c.gen === minGen).map(c => ({ id:c.id, charId:c.id }));
  const picked = choose(state, context, "title-heir", dead.birthFamilyId, nearest);
  const heir = characterById(state, picked.charId);
  heir.titleTier = dead.titleTier;
  record(state, { t:"title-inherit", round:state.round, from:dead.id, to:heir.id, tier:dead.titleTier });
}

function resolveCareerGrowth(state) {
  for (const c of Object.values(state.characters)) {
    if (!c.alive || !c.inService || !["adult","prime1","prime2","old"].includes(c.stage)) continue;
    if (c.officeLevel > 0) {
      if (c.officeLevel >= c.seniority && c.seniority < 5) c.seniority += 1;
    } else if (c.seniority === 1) {
      c.seniority = 2;
    }
    c.maxSeniorityEver = Math.max(c.maxSeniorityEver, c.seniority);
  }
}

function activateAdult(c, context) {
  c.stats = structuredClone(c.adultBase || {command:3,governance:3,royalFavor:3,social:3,reputation:3});
  c.seniority = 1;
  c.maxSeniorityEver = Math.max(c.maxSeniorityEver, 1);
  if (c.growth && c.stats[c.growth] < 5) {
    const roll = context.rng.d6();
    if (roll >= 4) c.stats[c.growth] += 1;
  }
}

function resolveAgeAndDeath(state, context) {
  const oldBefore = Object.values(state.characters).filter(c => c.alive && c.stage === "old");
  for (const c of Object.values(state.characters)) {
    if (!c.alive || c._newbornThisDiamond) continue;
    const idx = STAGE_ORDER.indexOf(c.stage);
    if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
      const prior = c.stage;
      c.stage = STAGE_ORDER[idx + 1];
      if (prior === "youth" && c.stage === "adult") activateAdult(c, context);
    }
  }
  for (const c of oldBefore) {
    const roll = context.rng.d6();
    if (roll <= C.oldDeathMaxRoll) {
      c.alive = false;
      const p = playerByFamily(state, c.controllerFamilyId);
      if (p) p.metrics.deathCount += 1;
      resolveTitleInheritance(state, c, context);
      record(state, { t:"death", round:state.round, charId:c.id, roll });
    }
  }
  for (const c of Object.values(state.characters)) delete c._newbornThisDiamond;
}

function resolveProduction(state) {
  for (const p of state.players) {
    for (const ind of p.industries) {
      const resource = INDUSTRY_YIELD[ind.type];
      if (!resource) throw new Error(`Unknown industry yield for ${ind.type}`);
      p.resources[resource] += 1;
    }
  }
}

export function settleRound(state, context) {
  state.metrics.roundsSettled += 1;
  resolveExcessTroopUpkeep(state, context);

  if (state.currentEvent?.diamond) {
    resolveProduction(state);
    for (const p of state.players) resolveBirth(state, p.familyId, context);
    resolveCareerGrowth(state);
    resolveAgeAndDeath(state, context);
    state.diamondCount += 1;
    record(state, { t:"diamond", round:state.round, diamondCount:state.diamondCount, event:state.currentEvent.name });
  }

  if (state.diamondCount >= C.endgameMaturesAtDiamond) {
    if (state.mode === "core-sandbox") {
      state.ended = true;
      state.phase = "ended";
      state.endReason = "core-loop-fourth-diamond";
      return;
    }
    state.unknownRules.push("full-young-king-crisis-resolution-required-before-final-endgame");
    state.ended = true;
    state.phase = "unknown";
    state.endReason = "unknown-rule-blocked";
    return;
  }

  state.round += 1;
  state.firstSeat = (state.firstSeat + 1) % state.players.length;
  state.activeSeat = state.firstSeat;
  state.actionRound = 1;
  for (const p of state.players) {
    p.fundraiseUsed = false;
    p.mainActionsThisRound = 0;
  }
  for (const c of Object.values(state.characters)) {
    c.actionsUsed = 0;
    c.moveUsed = false;
    c.careerAdvanceAttempted = false;
  }
  state.currentEvent = state.eventDeck.shift() || null;
  if (!state.currentEvent) {
    state.unknownRules.push("ordinary-event-deck-exhausted-before-fourth-diamond");
    state.ended = true;
    state.phase = "unknown";
    state.endReason = "unknown-rule-blocked";
    return;
  }
  record(state, { t:"round-start", round:state.round, event:state.currentEvent.name, diamond:state.currentEvent.diamond });
}
