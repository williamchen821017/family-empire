import {
  chooseRandomAction,
  chooseRandomAmbition,
  chooseRandomInternalCard,
  chooseRandomRewardCard,
  respondToAllianceProposal,
  revealAmbitionWhenComplete as revealRandomAmbition,
} from "../ai/random-ai.js";
import {
  chooseAmbitionDrivenAction,
  chooseAmbitionFromCandidates,
  chooseInternalCardByAmbition,
  chooseRewardCardByAmbition,
  respondToAllianceByAmbition,
  revealAmbitionWhenComplete as revealDrivenAmbition,
} from "../ai/ambition-ai.js";
import {
  familySnapshot,
  relationSnapshot,
  runGame,
} from "../engine/game-engine.js";

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const gameCount = toPositiveInteger(process.argv[2], 1);
const playerCount = toPositiveInteger(process.argv[3], 4);
const aiMode = process.argv[4] === "ambition" ? "ambition" : "random";

const aiPolicy =
  aiMode === "ambition"
    ? {
        chooseAction: chooseAmbitionDrivenAction,
        chooseAmbition: chooseAmbitionFromCandidates,
        chooseInternalCard: chooseInternalCardByAmbition,
        chooseRewardCard: chooseRewardCardByAmbition,
        respondToAlliance: respondToAllianceByAmbition,
        shouldRevealAmbition: revealDrivenAmbition,
      }
    : {
        chooseAction: chooseRandomAction,
        chooseAmbition: chooseRandomAmbition,
        chooseInternalCard: chooseRandomInternalCard,
        chooseRewardCard: chooseRandomRewardCard,
        respondToAlliance: respondToAllianceProposal,
        shouldRevealAmbition: revealRandomAmbition,
      };

const winCounts = new Map();
const evaluationCounts = new Map();
const endReasonCounts = new Map();
let roundTotal = 0;
let sharedWinGames = 0;
let marriageTotal = 0;
let birthTotal = 0;
let allianceTotal = 0;
let depthTotal = 0;
let relationCountTotal = 0;
let industryTotal = 0;
let localRegionTotal = 0;
const ambitionAssigned = new Map();
const ambitionCompleted = new Map();
const actionCounts = new Map();

for (let index = 0; index < gameCount; index += 1) {
  const seed = 1000 + index;
  const { game, outcome } = runGame({
    playerCount,
    seed,
    chooseAction: aiPolicy.chooseAction,
    respondToAlliance: aiPolicy.respondToAlliance,
    chooseAmbition: aiPolicy.chooseAmbition,
    chooseInternalCard: aiPolicy.chooseInternalCard,
    chooseRewardCard: aiPolicy.chooseRewardCard,
    shouldRevealAmbition: aiPolicy.shouldRevealAmbition,
  });

  roundTotal += game.round;
  marriageTotal += game.marriages.length;
  birthTotal += game.families.reduce(
    (sum, family) => sum + family.stats.births,
    0,
  );

  const relations = relationSnapshot(game);
  allianceTotal += relations.filter((relation) => relation.alliance).length;
  depthTotal += relations.reduce((sum, relation) => sum + relation.depth, 0);
  relationCountTotal += relations.length;
  industryTotal += game.families.reduce(
    (sum, family) => sum + family.industryContracts.length,
    0,
  );
  localRegionTotal += game.families.reduce(
    (sum, family) => sum + family.stats.localRegions.size,
    0,
  );

  for (const family of game.families) {
    const ambitionId = family.ambition?.card?.id ?? "none";
    ambitionAssigned.set(
      ambitionId,
      (ambitionAssigned.get(ambitionId) ?? 0) + 1,
    );

    if (family.ambition?.completed) {
      ambitionCompleted.set(
        ambitionId,
        (ambitionCompleted.get(ambitionId) ?? 0) + 1,
      );
    }

    for (const [actionType, count] of Object.entries(
      family.stats.actionCounts,
    )) {
      actionCounts.set(
        actionType,
        (actionCounts.get(actionType) ?? 0) + count,
      );
    }
  }

  if (outcome.winners.length > 1) sharedWinGames += 1;

  endReasonCounts.set(
    game.endReason,
    (endReasonCounts.get(game.endReason) ?? 0) + 1,
  );

  for (const winner of outcome.winners) {
    winCounts.set(
      winner.familyName,
      (winCounts.get(winner.familyName) ?? 0) + 1,
    );
  }

  for (const result of outcome.results) {
    for (const evaluation of result.achieved) {
      const key = `${result.familyName}｜${evaluation.name}`;
      evaluationCounts.set(key, (evaluationCounts.get(key) ?? 0) + 1);
    }
  }

  if (gameCount === 1) {
    console.log("《家族天下》AI 試跑 V0.6｜宿願、手牌與策略 AI");
    console.log(`AI 模式：${aiMode === "ambition" ? "宿願導向" : "隨機"}`);
    console.log(`Seed：${seed}`);
    console.log(`玩家數：${playerCount}`);
    console.log(`終局回合：第 ${game.round} 回合`);
    console.log(`終局原因：${game.endReason}`);
    console.log(`本局婚姻：${game.marriages.length} 對`);
    console.log(`本局誕育：${game.families.reduce((sum, family) => sum + family.stats.births, 0)} 人`);
    console.log(
      `終局仍有效盟約：${relations.filter((relation) => relation.alliance).length} 個`,
    );
    console.log("");

    for (const family of game.families) {
      const result = outcome.results.find(
        (item) => item.familyId === family.id,
      );
      console.log(`【${family.name}】`);
      console.log(familySnapshot(family));
      console.log(
        `歷史評定：${result.achieved.length ? result.achieved.map((item) => item.name).join("、") : "無"}`,
      );
      console.log("");
    }

    console.log("終局家族關係：");
    for (const relation of relations) {
      console.log(
        `- ${relation.familyAId} ↔ ${relation.familyBId}：${relation.name}（${relation.depth}），盟約：${relation.alliance ? "有" : "無"}`,
      );
    }

    console.log("");
    console.log(
      `勝利玩家：${outcome.winners.map((winner) => winner.familyName).join("、")}`,
    );
  }
}

if (gameCount > 1) {
  console.log(`《家族天下》AI 批次試跑 V0.6：${gameCount} 局`);
  console.log(`AI 模式：${aiMode === "ambition" ? "宿願導向" : "隨機"}`);
  console.log(`玩家數：${playerCount}`);
  console.log(`平均終局回合：${(roundTotal / gameCount).toFixed(2)}`);
  console.log(`平均每局婚姻：${(marriageTotal / gameCount).toFixed(2)} 對`);
  console.log(`平均每局誕育：${(birthTotal / gameCount).toFixed(2)} 人`);
  console.log(`平均終局有效盟約：${(allianceTotal / gameCount).toFixed(2)} 個`);
  console.log(
    `平均關係深度：${relationCountTotal ? (depthTotal / relationCountTotal).toFixed(2) : "0.00"}`,
  );
  console.log(`平均每局終局產業契券：${(industryTotal / gameCount).toFixed(2)} 張`);
  console.log(`平均每局終局鄉里勢力：${(localRegionTotal / gameCount).toFixed(2)} 個`);
  console.log(
    `共同勝利局數：${sharedWinGames}（${((sharedWinGames / gameCount) * 100).toFixed(1)}%）`,
  );
  console.log("");

  console.log("勝利次數（共同勝利會同時記入）：");
  for (const [familyName, count] of [...winCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(
      `- ${familyName}：${count} 次（${((count / gameCount) * 100).toFixed(1)}%）`,
    );
  }

  console.log("");
  console.log("終局來源：");
  for (const [reason, count] of endReasonCounts.entries()) {
    console.log(
      `- ${reason}：${count} 次（${((count / gameCount) * 100).toFixed(1)}%）`,
    );
  }

  console.log("");
  console.log("宿願完成率：");
  for (const [ambitionId, assigned] of [...ambitionAssigned.entries()].sort()) {
    const completed = ambitionCompleted.get(ambitionId) ?? 0;
    console.log(
      `- ${ambitionId}：${((completed / assigned) * 100).toFixed(1)}%（${completed}/${assigned}）`,
    );
  }

  console.log("");
  console.log("主要行動使用量：");
  for (const [actionType, count] of [...actionCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`- ${actionType}：${count}`);
  }

  console.log("");
  console.log("歷史評定取得率：");
  for (const [key, count] of [...evaluationCounts.entries()].sort()) {
    console.log(
      `- ${key}：${((count / gameCount) * 100).toFixed(1)}%`,
    );
  }
}
