export const TASK_TEMPLATES = Object.freeze([
  {
    id: "bandits",
    name: "州境盜起",
    actionCategory: "軍事／武力",
    ability: "武略",
    major: false,
  },
  {
    id: "border-alarm",
    name: "邊鎮告急",
    actionCategory: "軍事／武力",
    ability: "武略",
    major: true,
  },
  {
    id: "household-register",
    name: "清理戶籍",
    actionCategory: "地方",
    ability: "政務",
    major: false,
  },
  {
    id: "famine-relief",
    name: "郡中饑饉",
    actionCategory: "地方",
    ability: "政務",
    major: true,
  },
  {
    id: "diplomatic-mission",
    name: "奉使結援",
    actionCategory: "政治",
    ability: "交際",
    major: false,
  },
  {
    id: "court-remonstrance",
    name: "上疏論政",
    actionCategory: "政治",
    ability: "名望",
    major: false,
  },
  {
    id: "imperial-command",
    name: "奉詔整軍",
    actionCategory: "官職",
    ability: "君心",
    major: true,
  },
  {
    id: "transport",
    name: "河橋轉運",
    actionCategory: "地方",
    ability: "政務",
    major: false,
  },
]);

export function createTaskDeck(rng, copiesPerTask = 5) {
  const cards = [];

  for (const template of TASK_TEMPLATES) {
    for (let copy = 1; copy <= copiesPerTask; copy += 1) {
      cards.push({
        ...template,
        instanceId: `${template.id}-${copy}`,
      });
    }
  }

  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}
