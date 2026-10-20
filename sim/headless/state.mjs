import { FAMILY_SETUPS, ORDINARY_EVENTS } from "./data.mjs";
import { getAssumptionProfile } from "./assumptions.mjs";

export const COVERAGE_GAPS = [
  "world-event-specific-effects",
  "hand-cards",
  "npc-marriage-roster-and-resolution",
  "alliance-system",
  "open-office-appointment-contests",
  "royal-army",
  "full-young-king-crisis",
  "crisis-purge-preservation-and-new-regime",
  "event-title-awards-and-title-qualification-effects",
  "widow-remarriage"
];

function clone(value) { return structuredClone(value); }

function makeEventDeck(rng) {
  const peaceful = ORDINARY_EVENTS.filter(e => e.openingPeaceful);
  const firstTwo = rng.shuffle(peaceful).slice(0, 2);
  const chosen = new Set(firstTwo.map(e => e.id));
  const rest = ORDINARY_EVENTS.filter(e => !chosen.has(e.id));
  return [...rng.shuffle(firstTwo), ...rng.shuffle(rest)].map(clone);
}

function normalizeCharacter(raw, familyId) {
  return {
    ...clone(raw),
    birthFamilyId: raw.birthFamilyId ?? familyId,
    controllerFamilyId: familyId,
    alive: true,
    actionsUsed: 0,
    moveUsed: false,
    careerAdvanceAttempted: false,
    maxSeniorityEver: raw.seniority,
    gameBorn: false,
    motherId: null
  };
}

export function createGame({ seed, rng, familyIds, assumptionProfileId = "core-sandbox-v1", mode = "core-sandbox" }) {
  if (!Array.isArray(familyIds) || familyIds.length < 2 || familyIds.length > 5) throw new Error("Headless V04 MVP supports 2–5 player families.");
  if (new Set(familyIds).size !== familyIds.length) throw new Error("Family IDs must be unique.");
  for (const id of familyIds) if (!FAMILY_SETUPS[id]) throw new Error(`Unknown family: ${id}`);

  const assumptions = getAssumptionProfile(assumptionProfileId);
  const industrySupply = clone(assumptions.industrySupply);
  const characters = {};
  const players = familyIds.map((familyId, seat) => {
    const setup = FAMILY_SETUPS[familyId];
    for (const raw of setup.chars) {
      const c = normalizeCharacter(raw, familyId);
      if (characters[c.id]) throw new Error(`Duplicate character ID: ${c.id}`);
      characters[c.id] = c;
    }
    const industries = setup.industries.map((type, i) => ({ id: `${familyId}-start-${i+1}`, type, region: setup.root }));
    for (const ind of industries) {
      industrySupply[ind.type] -= 1;
      if (industrySupply[ind.type] < 0) throw new Error(`Assumption profile has insufficient ${ind.type} supply for Setup.`);
    }
    const troopsByRegion = setup.resources.troops ? { [setup.root]: setup.resources.troops } : {};
    return {
      seat, familyId, name: setup.name, root: setup.root, resources: clone(setup.resources), industries, troopsByRegion,
      fundraiseUsed: false, mainActionsThisRound: 0, newMarriageFamilies: [], rejectedMarriagePairs: [],
      contacts: familyId === "deer" ? ["opening-npc-noble-contact"] : [],
      metrics: { births: 0, deathCount: 0, actions: {} }
    };
  });

  const eventDeck = makeEventDeck(rng);
  const state = {
    version: "V04-headless-mvp-1", rulesSnapshotDate: "2026-10-20", seed: String(seed), mode,
    assumptions, coverageGaps: [...COVERAGE_GAPS], round: 1, actionRound: 1, firstSeat: 0, activeSeat: 0,
    phase: "actions", diamondCount: 0, currentEvent: eventDeck.shift(), eventDeck, industrySupply,
    players, characters, pendingDecision: null, ended: false, endReason: null, unknownRules: [], violations: [], trace: [],
    metrics: { mainActions: 0, freeMoves: 0, marriageProposals: 0, marriageAccepted: 0, birthChecks: {}, roundsSettled: 0 }
  };
  state.trace.push({ t: "start", round: 1, event: state.currentEvent?.name, families: familyIds });
  return state;
}

export function playerByFamily(state, familyId) { return state.players.find(p => p.familyId === familyId) ?? null; }
export function activePlayer(state) { return state.players[state.activeSeat] ?? null; }
export function characterById(state, id) { return state.characters[id] ?? null; }
export function controlledCharacters(state, familyId) { return Object.values(state.characters).filter(c => c.alive && c.controllerFamilyId === familyId); }
export function birthFamilyCharacters(state, familyId, { includeDead = true } = {}) {
  return Object.values(state.characters).filter(c => c.birthFamilyId === familyId && (includeDead || c.alive));
}
export function makePairKey(a, b) { return [a, b].sort().join("::"); }
