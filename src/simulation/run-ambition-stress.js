import { AMBITION_TEMPLATES } from "../data/ambitions.js";
import { chooseAmbitionDrivenAction } from "../ai/ambition-ai.js";
import { chooseActionWithAmbitionEffort } from "../ai/stress-ai.js";
import {
  chooseRandomAmbition,
  chooseRandomInternalCard,
  chooseRandomRewardCard,
  respondToAllianceProposal,
  revealAmbitionWhenComplete,
} from "../ai/random-ai.js";
import { runGame } from "../engine/game-engine.js";

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const gamesPerCell = toPositiveInteger(process.argv[2], 300);
const playerCount = 4;
const focalFamilyId = "family-1";

const effortLevels = [
  { id: "none", label: "不特別追求", multiplier: 0 },
  { id: "normal", label: "一般追求", multiplier: 1 },
  { id: "active", label: "積極追求", multiplier: 3 },
  { id: "obsessive", label: "高度執著", multiplier: 8 },
];

function cloneAmbition(ambition) {
  return {
    ...ambition,
    requirement: { ...ambition.requirement },
    actionWeights: { ...ambition.actionWeights },
  };
}

function percentage(value, total) {
  return total ? ((value / total) * 100).toFixed(1) : "0.0";
}

console.log("《家族天下》V0.6｜宿願可控性壓力測試");
console.log(`每格局數：${gamesPerCell}`);
console.log(`玩家數：${playerCount}`);
console.log("固定測試家族：family-1");
console.log("控制條件：同一批 Seed；只改測試家族對宿願相關主要行動的權重倍率。");
console.log("");

for (const ambitionTemplate of AMBITION_TEMPLATES) {
  console.log(`【${ambitionTemplate.id}｜${ambitionTemplate.title}】`);

  for (const effort of effortLevels) {
    let completed = 0;
    let winParticipation = 0;
    let soleWins = 0;
    let evaluationTotal = 0;
    let actionTotal = 0;
    let relevantActionTotal = 0;
    let moneyTotal = 0;
    let foodTotal = 0;
    let influenceTotal = 0;
    let completionRoundTotal = 0;
    let completionRoundCount = 0;

    for (let index = 0; index < gamesPerCell; index += 1) {
      const seed = 50000 + index;

      const { game, outcome } = runGame({
        playerCount,
        seed,
        chooseAmbition: chooseRandomAmbition,
        chooseInternalCard: chooseRandomInternalCard,
        chooseRewardCard: chooseRandomRewardCard,
        respondToAlliance: respondToAllianceProposal,
        shouldRevealAmbition: revealAmbitionWhenComplete,
        configureGame: ({ game: configuredGame }) => {
          const focal = configuredGame.families.find(
            (family) => family.id === focalFamilyId,
          );
          focal.ambition = {
            card: cloneAmbition(ambitionTemplate),
            completed: false,
            revealed: false,
            completedRound: null,
            revealedRound: null,
          };
        },
        chooseAction: ({ game: currentGame, family, legalActions, rng }) => {
          if (family.id === focalFamilyId) {
            return chooseActionWithAmbitionEffort({
              game: currentGame,
              family,
              legalActions,
              rng,
              effortMultiplier: effort.multiplier,
            });
          }

          return chooseAmbitionDrivenAction({
            game: currentGame,
            family,
            legalActions,
            rng,
          });
        },
      });

      const focal = game.families.find(
        (family) => family.id === focalFamilyId,
      );
      const focalResult = outcome.results.find(
        (result) => result.familyId === focalFamilyId,
      );

      if (focal.ambition.completed) {
        completed += 1;
        if (focal.ambition.completedRound !== null) {
          completionRoundTotal += focal.ambition.completedRound;
          completionRoundCount += 1;
        }
      }

      const isWinner = outcome.winners.some(
        (winner) => winner.familyId === focalFamilyId,
      );
      if (isWinner) winParticipation += 1;
      if (isWinner && outcome.winners.length === 1) soleWins += 1;

      evaluationTotal += focalResult.count;
      moneyTotal += focal.resources.money;
      foodTotal += focal.resources.food;
      influenceTotal += focal.resources.influence;

      const counts = focal.stats.actionCounts;
      const familyActions = Object.values(counts).reduce(
        (sum, count) => sum + count,
        0,
      );
      actionTotal += familyActions;

      for (const actionType of Object.keys(ambitionTemplate.actionWeights)) {
        relevantActionTotal += counts[actionType] ?? 0;
      }
    }

    const completionRate = percentage(completed, gamesPerCell);
    const winRate = percentage(winParticipation, gamesPerCell);
    const soleWinRate = percentage(soleWins, gamesPerCell);
    const relevantShare = actionTotal
      ? ((relevantActionTotal / actionTotal) * 100).toFixed(1)
      : "0.0";
    const averageCompletionRound = completionRoundCount
      ? (completionRoundTotal / completionRoundCount).toFixed(2)
      : "-";

    console.log(
      [
        "RESULT",
        ambitionTemplate.id,
        effort.id,
        effort.label,
        `完成率=${completionRate}%`,
        `相關行動占比=${relevantShare}%`,
        `平均歷史評定=${(evaluationTotal / gamesPerCell).toFixed(2)}`,
        `勝利參與率=${winRate}%`,
        `單獨勝利率=${soleWinRate}%`,
        `完成回合=${averageCompletionRound}`,
        `終局錢=${(moneyTotal / gamesPerCell).toFixed(2)}`,
        `終局糧=${(foodTotal / gamesPerCell).toFixed(2)}`,
        `終局影響力=${(influenceTotal / gamesPerCell).toFixed(2)}`,
      ].join("|"),
    );
  }

  console.log("");
}
