export function chooseRandomAction({ legalActions, rng }) {
  if (!legalActions.length) return null;
  const index = Math.floor(rng() * legalActions.length);
  return legalActions[index];
}
