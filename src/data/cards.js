export const HAND_CARD_TEMPLATES = Object.freeze([
  {
    id: "temporary_mobilization",
    title: "臨時調度",
    timing: "familyInternal",
    effect: { type: "extraAction", amount: 1 },
  },
  {
    id: "old_friend_aid",
    title: "故交來援",
    timing: "familyInternal",
    effect: { type: "taskAbilityBonus", amount: 1 },
  },
  {
    id: "retainer_network",
    title: "門生故吏",
    timing: "familyInternal",
    effect: { type: "officeAbilityBonus", amount: 1 },
  },
  {
    id: "private_mediation",
    title: "私下斡旋",
    timing: "familyInternal",
    effect: { type: "influence", amount: 1 },
  },
]);

export function createHandDeck(rng, copiesPerCard = 12) {
  const deck = [];

  for (const template of HAND_CARD_TEMPLATES) {
    for (let copy = 1; copy <= copiesPerCard; copy += 1) {
      deck.push({
        ...template,
        effect: { ...template.effect },
        instanceId: `${template.id}-${copy}`,
      });
    }
  }

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
