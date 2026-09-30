export function chooseRandomAction({ legalActions, rng }) {
  if (!legalActions.length) return null;

  const types = [...new Set(legalActions.map((action) => action.type))];
  const selectedType = types[Math.floor(rng() * types.length)];
  const candidates = legalActions.filter(
    (action) => action.type === selectedType,
  );

  return candidates[Math.floor(rng() * candidates.length)];
}
