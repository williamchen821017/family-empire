import { MAIN_BRANCHES } from "./data.mjs";
import { birthFamilyCharacters } from "./state.mjs";
import { RULES_PROFILE } from "../rules-profile.mjs";

function branchContinuable(chars, branch) {
  return chars.some(c => c.alive && c.sex === "男" && c.branch === branch);
}

function branchHasGameBorn(chars, branch) {
  return chars.some(c => c.gameBorn && c.branch === branch);
}

export function evaluateLegends(state, familyId) {
  const p = state.players.find(x => x.familyId === familyId);
  const chars = birthFamilyCharacters(state, familyId);
  const branches = MAIN_BRANCHES[familyId] || [];
  const gens = new Set(chars.map(c => c.gen).filter(g => g > 0));

  const flourish = branches.length === 2 && gens.has(4) &&
    branches.every(b => branchContinuable(chars, b) && branchHasGameBorn(chars, b));

  const qualifyingGens = new Set(chars.filter(c => c.maxSeniorityEver >= 3).map(c => c.gen).filter(g => g > 0));
  let illustrious = false;
  const maxGen = Math.max(0, ...qualifyingGens);
  for (let g = 1; g <= maxGen - 2; g++) {
    if (qualifyingGens.has(g) && qualifyingGens.has(g + 1) && qualifyingGens.has(g + 2)) illustrious = true;
  }

  const marriage = new Set(p.newMarriageFamilies).size >= RULES_PROFILE.confirmed.marriageLegendDistinctNewFamilies;
  const wealthThreshold = RULES_PROFILE.test.wealthLegendMoneyPlusFood;
  const wealth = p.industries.length >= 3 && (p.resources.money + p.resources.food) >= wealthThreshold;

  return {
    "枝繁葉茂": flourish,
    "世代顯達": illustrious,
    "締結名門": marriage,
    "家業豐足": wealth
  };
}

export function legendCount(state, familyId) {
  return Object.values(evaluateLegends(state, familyId)).filter(Boolean).length;
}

export function determineWinners(state) {
  const rows = state.players.map(p => ({ familyId: p.familyId, count: legendCount(state, p.familyId), legends: evaluateLegends(state, p.familyId) }));
  const best = Math.max(...rows.map(r => r.count));
  if (best < RULES_PROFILE.test.minimumLegendForWin) return { best, winners: [], rows };
  return { best, winners: rows.filter(r => r.count === best).map(r => r.familyId), rows };
}
