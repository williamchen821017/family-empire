import { legalActions } from "./legal-actions.mjs";
import { activePlayer, characterById, makePairKey, playerByFamily } from "./state.mjs";
import { bumpActionMetric, rollAbility } from "./mechanics.mjs";
import { settleRound } from "./settlement.mjs";
import { RULES_PROFILE } from "../rules-profile.mjs";

const T = RULES_PROFILE.test;
const C = RULES_PROFILE.confirmed;

function record(state, item) { state.trace.push(item); }

function findLegal(state, actionId) {
  return legalActions(state).find(a => a.id === actionId) || null;
}

function advanceAfterMainAction(state, context) {
  const p = activePlayer(state);
  p.mainActionsThisRound += 1;
  state.metrics.mainActions += 1;

  const next = (state.activeSeat + 1) % state.players.length;
  if (next === state.firstSeat) {
    state.actionRound += 1;
    if (state.actionRound > C.mainActionsPerFamilyPerRound) {
      settleRound(state, context);
      return;
    }
  }
  state.activeSeat = next;
}

function applyMarriageResponse(state, action, context) {
  const d = state.pendingDecision;
  if (!d || d.type !== "marriage-response") throw new Error("No marriage response pending.");
  if (action.responderFamilyId !== d.responderFamilyId) throw new Error("Wrong marriage responder.");

  const proposer = characterById(state, d.proposerId);
  const target = characterById(state, d.targetId);
  const proposerFamily = playerByFamily(state, d.proposerFamilyId);
  const targetFamily = playerByFamily(state, d.responderFamilyId);
  if (!proposer || !target || !proposerFamily || !targetFamily) throw new Error("Marriage response state is corrupted.");

  const pairKey = makePairKey(proposer.id, target.id);
  if (action.type === "acceptMarriage") {
    proposer.spouseId = target.id;
    target.spouseId = proposer.id;
    const husband = proposer.sex === "男" ? proposer : target;
    const wife = proposer.sex === "女" ? proposer : target;
    wife.controllerFamilyId = husband.birthFamilyId;
    const husbandFamily = playerByFamily(state, husband.birthFamilyId);
    if (husbandFamily) wife.location = husbandFamily.root;
    if (!proposerFamily.newMarriageFamilies.includes(targetFamily.familyId)) proposerFamily.newMarriageFamilies.push(targetFamily.familyId);
    if (!targetFamily.newMarriageFamilies.includes(proposerFamily.familyId)) targetFamily.newMarriageFamilies.push(proposerFamily.familyId);
    state.metrics.marriageAccepted += 1;
    record(state, { t:"marriage", round:state.round, proposerId:proposer.id, targetId:target.id, accepted:true });
  } else if (action.type === "rejectMarriage") {
    if (!proposerFamily.rejectedMarriagePairs.includes(pairKey)) proposerFamily.rejectedMarriagePairs.push(pairKey);
    if (!targetFamily.rejectedMarriagePairs.includes(pairKey)) targetFamily.rejectedMarriagePairs.push(pairKey);
    record(state, { t:"marriage", round:state.round, proposerId:proposer.id, targetId:target.id, accepted:false });
  } else {
    throw new Error(`Unexpected marriage response type: ${action.type}`);
  }

  state.pendingDecision = null;
  advanceAfterMainAction(state, context);
}

export function applyAction(state, actionInput, context) {
  if (state.ended) throw new Error("Cannot act after game end.");
  const actionId = typeof actionInput === "string" ? actionInput : actionInput?.id;
  const action = findLegal(state, actionId);
  if (!action) throw new Error(`Illegal action: ${actionId}`);

  if (action.kind === "response") {
    applyMarriageResponse(state, action, context);
    return action;
  }

  const p = activePlayer(state);
  if (!p) throw new Error("No active player.");
  bumpActionMetric(p, action.type);

  if (action.type === "moveCharacter") {
    const c = characterById(state, action.charId);
    if (!c) throw new Error(`Missing character ${action.charId}`);
    const from = c.location;
    const freeCapital = from === "花川" && action.to === "花京" && !c.moveUsed;
    c.location = action.to;
    if (!freeCapital) c.moveUsed = true;
    state.metrics.freeMoves += 1;
    record(state, { t:"move", round:state.round, familyId:p.familyId, charId:c.id, from, to:action.to, freeCapital });
    return action;
  }

  if (action.type === "pass") {
    record(state, { t:"action", round:state.round, familyId:p.familyId, type:"pass" });
    advanceAfterMainAction(state, context);
    return action;
  }

  if (action.type === "fundraise") {
    p.resources.money += 1;
    if (T.fundraiseOncePerRound) p.fundraiseUsed = true;
  } else if (action.type === "buyFood") {
    p.resources.money -= T.buyFoodMoneyCost;
    p.resources.food += 1;
  } else if (action.type === "acquireIndustry") {
    p.resources.money -= T.acquireIndustryMoneyCost;
    state.industrySupply[action.industryType] -= 1;
    p.industries.push({ id:`${p.familyId}-industry-${state.round}-${p.industries.length+1}`, type:action.industryType, region:p.root });
  } else if (action.type === "formTroop") {
    const c = characterById(state, action.charId);
    c.actionsUsed += 1;
    p.resources.money -= C.formTroopMoneyCost;
    p.resources.troops += 1;
    p.troopsByRegion[p.root] = (p.troopsByRegion[p.root] || 0) + 1;
  } else if (action.type === "moveTroops") {
    p.troopsByRegion[action.from] -= action.count;
    p.troopsByRegion[action.to] = (p.troopsByRegion[action.to] || 0) + action.count;
  } else if (action.type === "enterService") {
    const c = characterById(state, action.charId);
    c.actionsUsed += 1;
    c.inService = true;
    if (c.seniority < 1) c.seniority = 1;
    c.maxSeniorityEver = Math.max(c.maxSeniorityEver, c.seniority);
  } else if (action.type === "advanceCareer2to3") {
    const c = characterById(state, action.charId);
    c.actionsUsed += 1;
    c.careerAdvanceAttempted = true;
    p.resources.influence -= C.seniority2to3InfluenceCost;
    const r = rollAbility(c.stats.reputation || 1, context.rng, 1);
    if (r.rank >= 1) {
      c.seniority = 3;
      c.maxSeniorityEver = Math.max(c.maxSeniorityEver, 3);
    }
    record(state, { t:"career-roll", round:state.round, familyId:p.familyId, charId:c.id, ...r });
  } else if (action.type === "proposeMarriage") {
    const proposer = characterById(state, action.proposerId);
    proposer.actionsUsed += 1;
    state.metrics.marriageProposals += 1;
    state.pendingDecision = {
      type:"marriage-response",
      proposerFamilyId:p.familyId,
      responderFamilyId:action.targetFamilyId,
      proposerId:action.proposerId,
      targetId:action.targetId
    };
    record(state, { t:"marriage-proposal", round:state.round, familyId:p.familyId, proposerId:action.proposerId, targetId:action.targetId });
    return action;
  } else {
    throw new Error(`Unhandled legal action type: ${action.type}`);
  }

  record(state, { t:"action", round:state.round, familyId:p.familyId, type:action.type, id:action.id });
  advanceAfterMainAction(state, context);
  return action;
}
