/**
 * AI policy layer only ranks LEGAL actions supplied by a future headless engine.
 * It never decides legality and therefore cannot silently create rules.
 *
 * Expected action shape (fields are optional):
 * {
 *   id, type, tags: [],
 *   expectedGain, expectedCost, risk,
 *   political, economy, military, family,
 *   reversible
 * }
 */

function n(v) {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function score(action, weights) {
  const tags = new Set(action.tags || []);
  let s = 0;
  s += n(action.expectedGain) * (weights.gain ?? 1);
  s -= n(action.expectedCost) * (weights.cost ?? 1);
  s -= n(action.risk) * (weights.risk ?? 1);
  s += n(action.political) * (weights.political ?? 0);
  s += n(action.economy) * (weights.economy ?? 0);
  s += n(action.military) * (weights.military ?? 0);
  s += n(action.family) * (weights.family ?? 0);
  if (action.reversible === false) s -= weights.irreversiblePenalty ?? 0;
  for (const [tag, value] of Object.entries(weights.tags || {})) if (tags.has(tag)) s += value;
  return s;
}

function chooseBest(legalActions, rng, weights) {
  if (!legalActions.length) return null;
  const scored = legalActions.map(a => ({ action: a, score: score(a, weights) }));
  const best = Math.max(...scored.map(x => x.score));
  const leaders = scored.filter(x => x.score === best).map(x => x.action);
  return rng.pick(leaders);
}

export const POLICIES = {
  random: {
    choose(legalActions, context) {
      return context.rng.pick(legalActions) ?? null;
    }
  },
  expansion: {
    choose(legalActions, context) {
      return chooseBest(legalActions, context.rng, {
        gain: 1.1, cost: 0.45, risk: 0.35, economy: 1.5, military: 0.7, family: 0.3,
        tags: { industry: 2.0, troop: 1.0, growth: 0.8 }
      });
    }
  },
  conservative: {
    choose(legalActions, context) {
      return chooseBest(legalActions, context.rng, {
        gain: 0.7, cost: 1.1, risk: 1.7, economy: 0.5, family: 0.5,
        irreversiblePenalty: 1.0,
        tags: { preserve: 1.7, reserve: 1.1, lowRisk: 1.0 }
      });
    }
  },
  political: {
    choose(legalActions, context) {
      return chooseBest(legalActions, context.rng, {
        gain: 0.8, cost: 0.55, risk: 0.6, political: 1.7, family: 0.9,
        tags: { office: 1.8, marriage: 1.5, alliance: 1.0, influence: 1.2, court: 1.4 }
      });
    }
  }
};

export function chooseAction(policyName, legalActions, context) {
  const policy = POLICIES[policyName];
  if (!policy) throw new Error(`Unknown policy: ${policyName}`);
  return policy.choose(legalActions, context);
}
