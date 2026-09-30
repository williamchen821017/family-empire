export const INDUSTRY_REGIONS = Object.freeze([
  "司州",
  "冀州",
  "相州",
  "雍州",
  "豫州",
]);

export const INDUSTRY_TEMPLATES = Object.freeze([
  {
    id: "hedong-estate",
    name: "河東田莊",
    region: "雍州",
    acquisition: { type: "funding", cost: { money: 2, influence: 0 } },
    income: { money: 0, food: 2 },
  },
  {
    id: "luoyang-winery",
    name: "洛陽酒坊",
    region: "司州",
    acquisition: { type: "funding", cost: { money: 2, influence: 0 } },
    income: { money: 2, food: 0 },
  },
  {
    id: "jizhou-fields",
    name: "冀州田業",
    region: "冀州",
    acquisition: { type: "funding", cost: { money: 2, influence: 0 } },
    income: { money: 0, food: 2 },
  },
  {
    id: "xiangzhou-pasture",
    name: "相州牧業",
    region: "相州",
    acquisition: { type: "funding", cost: { money: 2, influence: 0 } },
    income: { money: 1, food: 1 },
  },
  {
    id: "luoyang-carriage",
    name: "洛陽車馬業",
    region: "司州",
    acquisition: { type: "office", cost: { money: 0, influence: 1 } },
    income: { money: 2, food: 0 },
  },
  {
    id: "court-merchant-network",
    name: "京畿商旅網絡",
    region: "司州",
    acquisition: { type: "office", cost: { money: 0, influence: 1 } },
    income: { money: 1, food: 1 },
  },
  {
    id: "yuzhou-orchard",
    name: "豫州果園",
    region: "豫州",
    acquisition: { type: "local", cost: { money: 0, influence: 1 } },
    income: { money: 0, food: 2 },
  },
  {
    id: "yuzhou-workshop",
    name: "豫州作坊",
    region: "豫州",
    acquisition: { type: "local", cost: { money: 0, influence: 1 } },
    income: { money: 2, food: 0 },
  },
]);

export function createIndustryDeck(rng, copiesPerIndustry = 3) {
  const cards = [];

  for (const template of INDUSTRY_TEMPLATES) {
    for (let copy = 1; copy <= copiesPerIndustry; copy += 1) {
      cards.push({
        ...template,
        acquisition: {
          ...template.acquisition,
          cost: { ...template.acquisition.cost },
        },
        income: { ...template.income },
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
