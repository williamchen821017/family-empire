export const LIFE_STAGES = Object.freeze([
  "小孩",
  "少年",
  "成年",
  "壯年",
  "老年",
]);

export const STAGE_DURATION = Object.freeze({
  小孩: 1,
  少年: 1,
  成年: 2,
  壯年: 2,
  老年: Number.POSITIVE_INFINITY,
});

export function isMarriageable(member) {
  return (
    member.alive &&
    member.marriageId === null &&
    (member.lifeStage === "成年" || member.lifeStage === "壯年")
  );
}

export function fertilitySuccess(lifeStage, die) {
  if (lifeStage === "成年") return die >= 5;
  if (lifeStage === "壯年") return die === 6;
  return false;
}

export function advanceLifeStage(member, currentRound) {
  if (!member.alive) return;
  if (member.bornRound === currentRound) return;
  if (member.lifeStage === "老年") return;

  member.turnsInStage += 1;
  const duration = STAGE_DURATION[member.lifeStage];

  if (member.turnsInStage < duration) return;

  const index = LIFE_STAGES.indexOf(member.lifeStage);
  member.lifeStage = LIFE_STAGES[index + 1];
  member.turnsInStage = 0;
  member.adult =
    member.lifeStage === "成年" ||
    member.lifeStage === "壯年" ||
    member.lifeStage === "老年";
}
