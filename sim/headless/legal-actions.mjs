import { ADJACENCY, EXECUTOR_STAGES, INDUSTRY_ALLOWED } from "./data.mjs";
import { activePlayer, controlledCharacters, makePairKey } from "./state.mjs";
import { RULES_PROFILE } from "../rules-profile.mjs";

const T = RULES_PROFILE.test;
const C = RULES_PROFILE.confirmed;

function executor(c) { return c.alive && EXECUTOR_STAGES.has(c.stage); }
function main(id, type, extra = {}) { return { id, kind: "main", type, ...extra }; }
function free(id, type, extra = {}) { return { id, kind: "free", type, ...extra }; }
function response(id, type, extra = {}) { return { id, kind: "response", type, ...extra }; }

export function legalActions(state) {
  if (state.ended || state.phase !== "actions") return [];

  if (state.pendingDecision) {
    const d = state.pendingDecision;
    if (d.type === "marriage-response") {
      return [
        response(`marriage-accept:${d.proposerId}:${d.targetId}`, "acceptMarriage", {
          responderFamilyId: d.responderFamilyId, tags: ["marriage", "political", "family"], political: 1.0, family: 1.2,
          expectedGain: 0.7, expectedCost: 0.2, risk: 0.25, reversible: false
        }),
        response(`marriage-reject:${d.proposerId}:${d.targetId}`, "rejectMarriage", {
          responderFamilyId: d.responderFamilyId, tags: ["reserve", "lowRisk"], expectedGain: 0.1, expectedCost: 0, risk: 0.05, reversible: true
        })
      ];
    }
    return [];
  }

  const p = activePlayer(state);
  if (!p) return [];
  const chars = controlledCharacters(state, p.familyId);
  const actions = [];

  for (const c of chars) {
    if (!executor(c)) continue;
    if (c.location === "花川" && !c.moveUsed) {
      actions.push(free(`move:${c.id}:花京`, "moveCharacter", {
        charId: c.id, to: "花京", tags: ["move", "court"], political: 0.15, risk: 0.05, expectedGain: 0.05
      }));
    }
    if (c.moveUsed) continue;
    const destinations = c.location === "花京" ? ["花川"] : (ADJACENCY[c.location] || []);
    for (const to of destinations) {
      actions.push(free(`move:${c.id}:${to}`, "moveCharacter", {
        charId: c.id, to, tags: ["move"], risk: 0.05, expectedGain: 0.02
      }));
    }
  }

  actions.push(main(`pass:${p.familyId}:${state.round}:${state.actionRound}`, "pass", {
    tags: ["reserve", "lowRisk"], expectedGain: 0, expectedCost: 0, risk: 0
  }));

  if (!T.fundraiseOncePerRound || !p.fundraiseUsed) {
    actions.push(main(`fundraise:${p.familyId}`, "fundraise", {
      tags: ["economy", "reserve"], economy: 1.0, expectedGain: 1, expectedCost: 0, risk: 0
    }));
  }

  if (p.resources.money >= T.buyFoodMoneyCost) {
    actions.push(main(`buy-food:${p.familyId}`, "buyFood", {
      tags: ["economy", "reserve"], economy: 0.6, expectedGain: 0.8, expectedCost: T.buyFoodMoneyCost, risk: 0.05
    }));
  }

  if (p.resources.money >= T.acquireIndustryMoneyCost && p.industries.length < T.industryCapacity) {
    for (const type of INDUSTRY_ALLOWED[p.root] || []) {
      if ((state.industrySupply[type] || 0) <= 0) continue;
      actions.push(main(`industry:${p.familyId}:${type}`, "acquireIndustry", {
        industryType: type, tags: ["industry", "economy", "growth"], economy: 1.8,
        expectedGain: 2.2, expectedCost: T.acquireIndustryMoneyCost, risk: 0.1
      }));
    }
  }

  if (p.resources.money >= C.formTroopMoneyCost) {
    for (const c of chars) {
      if (!executor(c) || c.exitedPolitics || c.actionsUsed >= 2 || c.location !== p.root) continue;
      actions.push(main(`troop-form:${c.id}`, "formTroop", {
        charId: c.id, tags: ["troop", "military", "growth"], military: 1.2,
        expectedGain: 1.0, expectedCost: C.formTroopMoneyCost, risk: 0.15
      }));
    }
  }

  for (const [from, amount] of Object.entries(p.troopsByRegion)) {
    if (amount <= 0) continue;
    for (const to of ADJACENCY[from] || []) {
      for (const count of [...new Set([1, amount])]) {
        actions.push(main(`troop-move:${from}:${to}:${count}`, "moveTroops", {
          from, to, count, tags: ["military", "move"], military: 0.5, expectedGain: 0.15, expectedCost: 0, risk: 0.1
        }));
      }
    }
  }

  for (const c of chars) {
    if (!executor(c) || c.exitedPolitics || c.actionsUsed >= 2) continue;
    if (!c.inService) {
      actions.push(main(`career-enter:${c.id}`, "enterService", {
        charId: c.id, tags: ["office", "political", "court"], political: 1.2, expectedGain: 1.0, expectedCost: 0, risk: 0.15
      }));
    } else if (c.seniority === 2 && !c.careerAdvanceAttempted && p.resources.influence >= C.seniority2to3InfluenceCost) {
      actions.push(main(`career-advance:${c.id}`, "advanceCareer2to3", {
        charId: c.id, tags: ["office", "political", "influence"], political: 1.6,
        expectedGain: 1.3, expectedCost: C.seniority2to3InfluenceCost, risk: 0.5
      }));
    }
  }

  const ownSingles = chars.filter(c => executor(c) && c.actionsUsed < 2 && !c.spouseId);
  for (const a of ownSingles) {
    for (const q of state.players) {
      if (q.familyId === p.familyId) continue;
      for (const b of controlledCharacters(state, q.familyId)) {
        if (!executor(b) || b.spouseId || a.sex === b.sex) continue;
        const key = makePairKey(a.id, b.id);
        if (p.rejectedMarriagePairs.includes(key) || q.rejectedMarriagePairs.includes(key)) continue;
        actions.push(main(`marriage:${a.id}:${b.id}`, "proposeMarriage", {
          proposerId: a.id, targetId: b.id, targetFamilyId: q.familyId,
          tags: ["marriage", "political", "family"], political: 1.0, family: 1.5,
          expectedGain: 1.1, expectedCost: 0.2, risk: 0.45, reversible: false
        }));
      }
    }
  }

  return actions;
}
