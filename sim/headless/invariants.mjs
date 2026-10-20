import { RULES_PROFILE } from "../rules-profile.mjs";

const T = RULES_PROFILE.test;
const C = RULES_PROFILE.confirmed;

export function invariantCheck(state) {
  const errors = [];
  const playerIds = new Set(state.players.map(p => p.familyId));

  for (const p of state.players) {
    for (const key of ["money", "food", "influence", "troops"]) {
      const v = p.resources[key];
      if (!Number.isInteger(v) || v < 0) errors.push(`${p.familyId}: resource ${key} invalid (${v})`);
    }
    if (p.industries.length > T.industryCapacity) errors.push(`${p.familyId}: industry capacity exceeded (${p.industries.length})`);
    if (p.mainActionsThisRound > C.mainActionsPerFamilyPerRound) errors.push(`${p.familyId}: more than 3 main actions in round`);
    const regionTroops = Object.values(p.troopsByRegion).reduce((a,b)=>a+b,0);
    if (regionTroops !== p.resources.troops) errors.push(`${p.familyId}: troop total mismatch resources=${p.resources.troops} map=${regionTroops}`);
    if (p.newMarriageFamilies.includes(p.familyId)) errors.push(`${p.familyId}: self marriage-family entry`);
  }

  for (const [type, count] of Object.entries(state.industrySupply)) {
    if (!Number.isInteger(count) || count < 0) errors.push(`industry supply ${type} invalid (${count})`);
  }

  for (const c of Object.values(state.characters)) {
    if (!playerIds.has(c.controllerFamilyId)) errors.push(`${c.id}: invalid controller ${c.controllerFamilyId}`);
    if (c.actionsUsed < 0 || c.actionsUsed > C.characterActionLimitPerRound) errors.push(`${c.id}: actionsUsed=${c.actionsUsed}`);
    if (typeof c.moveUsed !== "boolean") errors.push(`${c.id}: moveUsed not boolean`);
    if (c.sex === "女" && c.titleTier > 0) errors.push(`${c.id}: female character holds five-rank hereditary title`);
    if (c.spouseId) {
      if (c.spouseId === c.id) errors.push(`${c.id}: married to self`);
      const s = state.characters[c.spouseId];
      if (!s) errors.push(`${c.id}: spouse ${c.spouseId} missing`);
      else if (s.spouseId !== c.id) errors.push(`${c.id}: spouse link not symmetric with ${s.id}`);
    }
    if (c.seniority < 0 || c.seniority > 5) errors.push(`${c.id}: seniority out of range ${c.seniority}`);
    if (c.maxSeniorityEver < c.seniority) errors.push(`${c.id}: maxSeniorityEver below current seniority`);
  }

  for (const [key, count] of Object.entries(state.metrics.birthChecks)) {
    if (count > 1) errors.push(`birth check limit violated at ${key}: ${count}`);
  }

  if (!Number.isInteger(state.activeSeat) || state.activeSeat < 0 || state.activeSeat >= state.players.length) errors.push(`activeSeat invalid ${state.activeSeat}`);
  if (state.actionRound < 1 || state.actionRound > 3) {
    if (!state.ended) errors.push(`actionRound invalid ${state.actionRound}`);
  }
  if (state.mode === "core-sandbox" && state.diamondCount > C.endgameMaturesAtDiamond) errors.push("core sandbox exceeded fourth diamond");
  if (state.ended && state.phase !== "ended" && state.phase !== "error" && state.phase !== "unknown") errors.push(`ended game has phase ${state.phase}`);

  return errors;
}
