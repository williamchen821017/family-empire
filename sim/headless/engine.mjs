import { createGame, activePlayer } from "./state.mjs";
import { legalActions } from "./legal-actions.mjs";
import { applyAction } from "./apply-action.mjs";
import { invariantCheck } from "./invariants.mjs";
import { determineWinners } from "./legends.mjs";
import { chooseAction } from "../policies.mjs";

function familyForDecision(state) {
  if (state.pendingDecision) return state.pendingDecision.responderFamilyId;
  return activePlayer(state)?.familyId ?? null;
}

function makeChoiceProvider(policyByFamily, rng) {
  return ({ kind, familyId, options }) => {
    if (!options.length) return null;
    const policyName = policyByFamily[familyId] || "random";
    if (kind === "important-birth-couple") return rng.pick(options);
    if (kind === "title-heir") return rng.pick(options);
    if (kind === "disband-excess-troop") return policyName === "conservative" ? options[0] : rng.pick(options);
    return rng.pick(options);
  };
}

export function runGame({
  seed,
  rng,
  familyIds,
  policyByFamily,
  assumptionProfileId = "core-sandbox-v1",
  mode = "core-sandbox",
  maxSteps = 5000,
  keepTrace = true
}) {
  const state = createGame({ seed, rng, familyIds, assumptionProfileId, mode });
  const context = { rng, choiceProvider: makeChoiceProvider(policyByFamily, rng) };

  let steps = 0;
  while (!state.ended && steps < maxSteps) {
    steps += 1;
    const actions = legalActions(state);
    if (!actions.length) {
      state.violations.push({ step:steps, round:state.round, error:"NO_LEGAL_ACTIONS", phase:state.phase, pendingDecision:state.pendingDecision });
      state.ended = true;
      state.phase = "error";
      state.endReason = "no-legal-actions";
      break;
    }

    const familyId = familyForDecision(state);
    const policyName = policyByFamily[familyId] || "random";
    const chosen = chooseAction(policyName, actions, { rng, state, familyId });
    if (!chosen) {
      state.violations.push({ step:steps, round:state.round, error:"POLICY_RETURNED_NULL", familyId, policyName });
      state.ended = true;
      state.phase = "error";
      state.endReason = "policy-null";
      break;
    }

    try {
      applyAction(state, chosen, context);
    } catch (error) {
      state.violations.push({ step:steps, round:state.round, error:"APPLY_ACTION_ERROR", message:String(error?.message || error), action:chosen });
      state.ended = true;
      state.phase = "error";
      state.endReason = "apply-action-error";
      break;
    }

    const violations = invariantCheck(state);
    if (violations.length) {
      state.violations.push(...violations.map(error => ({ step:steps, round:state.round, error:"INVARIANT", message:error, action:chosen.id })));
      state.ended = true;
      state.phase = "error";
      state.endReason = "invariant-failure";
      break;
    }
  }

  if (!state.ended && steps >= maxSteps) {
    state.violations.push({ step:steps, round:state.round, error:"MAX_STEPS_EXCEEDED" });
    state.ended = true;
    state.phase = "error";
    state.endReason = "max-steps";
  }

  const result = determineWinners(state);
  const report = {
    engineVersion: state.version,
    rulesSnapshotDate: state.rulesSnapshotDate,
    seed:String(seed),
    mode,
    assumptionProfile:state.assumptions,
    balanceEligible:false,
    balanceEligibilityReason:"Headless MVP intentionally omits event-specific effects, NPC marriage, cards and full crisis.",
    coverageGaps:[...state.coverageGaps],
    unknownRules:[...state.unknownRules],
    familyIds:[...familyIds],
    policies:{...policyByFamily},
    rounds:state.round,
    diamonds:state.diamondCount,
    steps,
    endReason:state.endReason,
    violations:[...state.violations],
    winners:result.winners,
    bestLegendCount:result.best,
    legendRows:result.rows,
    players:state.players.map(p => ({
      familyId:p.familyId,
      resources:{...p.resources},
      industries:p.industries.length,
      newMarriageFamilies:[...p.newMarriageFamilies],
      births:p.metrics.births,
      deaths:p.metrics.deathCount,
      actionUse:{...p.metrics.actions}
    })),
    metrics:structuredClone(state.metrics)
  };
  if (keepTrace || state.violations.length || state.unknownRules.length) report.trace = state.trace;
  return report;
}
