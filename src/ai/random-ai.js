export function chooseRandomAction({ legalActions, rng }) {
  if (!legalActions.length) return null;

  const types = [...new Set(legalActions.map((action) => action.type))];
  const selectedType = types[Math.floor(rng() * types.length)];
  const candidates = legalActions.filter(
    (action) => action.type === selectedType,
  );

  return candidates[Math.floor(rng() * candidates.length)];
}

export function respondToAllianceProposal({ rng }) {
  return rng() < 0.5;
}

export function chooseRandomAmbition({ candidates, rng }) {
  return candidates[Math.floor(rng() * candidates.length)];
}

export function chooseRandomInternalCard({ playableCards, rng }) {
  if (!playableCards.length || rng() < 0.5) return null;
  return playableCards[Math.floor(rng() * playableCards.length)];
}

export function chooseRandomRewardCard({ choices, rng }) {
  return choices[Math.floor(rng() * choices.length)];
}

export function revealAmbitionWhenComplete() {
  return true;
}
