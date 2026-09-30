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

export function chooseAmbitionDrivenAction({
  family,
  legalActions,
  rng,
}) {
  if (!legalActions.length) return null;

  const weights = family.ambition?.card?.actionWeights ?? {};
  const actionTypes = [...new Set(legalActions.map((action) => action.type))];

  const selectedType = weightedChoice(
    actionTypes,
    (type) => 1 + (weights[type] ?? 0),
    rng,
  );

  const candidates = legalActions.filter(
    (action) => action.type === selectedType,
  );

  return candidates[Math.floor(rng() * candidates.length)];
}

export function chooseAmbitionFromCandidates({ candidates, rng }) {
  return candidates[Math.floor(rng() * candidates.length)];
}

export function respondToAllianceByAmbition({ proposer, target, rng }) {
  const proposerWeight =
    proposer.ambition?.card?.actionWeights?.propose_alliance ?? 0;
  const targetWeight =
    target.ambition?.card?.actionWeights?.propose_alliance ?? 0;
  const chance = Math.min(0.9, 0.35 + (proposerWeight + targetWeight) * 0.035);
  return rng() < chance;
}

export function chooseInternalCardByAmbition({
  family,
  playableCards,
}) {
  if (!playableCards.length) return null;

  const weights = family.ambition?.card?.actionWeights ?? {};
  const preferredEffect =
    (weights.take_task ?? 0) >= (weights.seek_office ?? 0)
      ? "taskAbilityBonus"
      : "officeAbilityBonus";

  return (
    playableCards.find((card) => card.effect.type === preferredEffect) ??
    playableCards.find((card) => card.effect.type === "extraAction") ??
    playableCards[0]
  );
}

export function chooseRewardCardByAmbition({
  family,
  choices,
}) {
  const weights = family.ambition?.card?.actionWeights ?? {};

  if ((weights.take_task ?? 0) > (weights.seek_office ?? 0)) {
    return (
      choices.find((card) => card.effect.type === "taskAbilityBonus") ??
      choices[0]
    );
  }

  if ((weights.seek_office ?? 0) > 0) {
    return (
      choices.find((card) => card.effect.type === "officeAbilityBonus") ??
      choices[0]
    );
  }

  return (
    choices.find((card) => card.effect.type === "extraAction") ??
    choices[0]
  );
}

export function revealAmbitionWhenComplete() {
  return true;
}
