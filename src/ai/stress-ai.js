function weightedChoice(items, weightOf, rng) {
  const weighted = items.map((item) => ({
    item,
    weight: Math.max(0.01, weightOf(item)),
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;

  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }

  return weighted.at(-1).item;
}

export function chooseActionWithAmbitionEffort({
  family,
  legalActions,
  rng,
  effortMultiplier = 1,
}) {
  if (!legalActions.length) return null;

  const weights = family.ambition?.card?.actionWeights ?? {};
  const actionTypes = [...new Set(legalActions.map((action) => action.type))];

  const selectedType = weightedChoice(
    actionTypes,
    (type) => 1 + effortMultiplier * (weights[type] ?? 0),
    rng,
  );

  const candidates = legalActions.filter(
    (action) => action.type === selectedType,
  );

  return candidates[Math.floor(rng() * candidates.length)];
}
