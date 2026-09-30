export const HAND_LIMIT = 5;

export function drawHandCards(game, family, count = 1) {
  const drawn = [];

  for (let index = 0; index < count; index += 1) {
    const card = game.handDeck.shift();
    if (!card) break;
    family.hand.push(card);
    drawn.push(card);
  }

  return drawn;
}

export function drawRewardCardChoice(
  game,
  family,
  count = 2,
  chooseCard,
) {
  const choices = [];

  for (let index = 0; index < count; index += 1) {
    const card = game.handDeck.shift();
    if (!card) break;
    choices.push(card);
  }

  if (!choices.length) return null;

  const chosen =
    typeof chooseCard === "function"
      ? chooseCard({ game, family, choices, rng: game.rng })
      : choices[0];

  const selected =
    choices.find((card) => card.instanceId === chosen?.instanceId) ??
    choices[0];

  family.hand.push(selected);

  for (const card of choices) {
    if (card.instanceId !== selected.instanceId) {
      game.handDiscard.push(card);
    }
  }

  return selected;
}

export function enforceHandLimit(game, family) {
  const discarded = [];

  while (family.hand.length > HAND_LIMIT) {
    const card = family.hand.pop();
    game.handDiscard.push(card);
    discarded.push(card);
  }

  return discarded;
}

export function getPlayableInternalCards(family) {
  return family.hand.filter((card) => card.timing === "familyInternal");
}

export function playInternalCard(game, family, cardInstanceId) {
  const index = family.hand.findIndex(
    (card) => card.instanceId === cardInstanceId,
  );

  if (index < 0) {
    throw new Error("找不到要使用的家族手牌。");
  }

  const card = family.hand[index];

  if (card.timing !== "familyInternal") {
    throw new Error("這張牌現在不能使用。");
  }

  const effect = card.effect;

  switch (effect.type) {
    case "extraAction": {
      const maximum =
        family.actionEconomy.baseActions + 2;
      family.actionEconomy.remaining = Math.min(
        maximum,
        family.actionEconomy.remaining + effect.amount,
      );
      break;
    }
    case "taskAbilityBonus":
      family.roundEffects.taskAbilityBonus = Math.max(
        family.roundEffects.taskAbilityBonus,
        effect.amount,
      );
      break;
    case "officeAbilityBonus":
      family.roundEffects.officeAbilityBonus = Math.max(
        family.roundEffects.officeAbilityBonus,
        effect.amount,
      );
      break;
    case "influence":
      family.resources.influence += effect.amount;
      break;
    default:
      throw new Error(`未知手牌效果：${effect.type}`);
  }

  family.hand.splice(index, 1);
  game.handDiscard.push(card);

  return card;
}
