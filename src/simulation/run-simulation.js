import { chooseRandomAction } from "../ai/random-ai.js";
import { familySnapshot, runGame } from "../engine/game-engine.js";

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const gameCount = toPositiveInteger(process.argv[2], 1);
const playerCount = toPositiveInteger(process.argv[3], 4);

const winCounts = new Map();
const evaluationCounts = new Map();
const endReasonCounts = new Map();
let roundTotal = 0;
let sharedWinGames = 0;
let marriageTotal = 0;
let birthTotal = 0;

for (let index = 0; index < gameCount; index += 1) {
  const seed = 1000 + index;
  const { game, outcome } = runGame({
    playerCount,
    seed,
    chooseAction: chooseRandomAction,
  });

  roundTotal += game.round;
  marriageTotal += game.marriages.length;
  birthTotal += game.families.reduce(
    (sum, family) => sum + family.stats.births,
    0,
  );

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
    console.log("《家族天下》AI 試跑 V0.3｜聯姻、族譜、子嗣正式化");
    console.log(`Seed：${seed}`);
    console.log(`玩家數：${playerCount}`);
    console.log(`終局回合：第 ${game.round} 回合`);
    console.log(`終局原因：${game.endReason}`);
    console.log(`本局婚姻：${game.marriages.length} 對`);
    console.log(`本局誕育：${game.families.reduce((sum, family) => sum + family.stats.births, 0)} 人`);
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

    console.log(
      `勝利玩家：${outcome.winners.map((winner) => winner.familyName).join("、")}`,
    );
  }
}

if (gameCount > 1) {
  console.log(`《家族天下》AI 批次試跑 V0.3：${gameCount} 局`);
  console.log(`玩家數：${playerCount}`);
  console.log(`平均終局回合：${(roundTotal / gameCount).toFixed(2)}`);
  console.log(`平均每局婚姻：${(marriageTotal / gameCount).toFixed(2)} 對`);
  console.log(`平均每局誕育：${(birthTotal / gameCount).toFixed(2)} 人`);
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
  console.log("歷史評定取得率：");
  for (const [key, count] of [...evaluationCounts.entries()].sort()) {
    console.log(
      `- ${key}：${((count / gameCount) * 100).toFixed(1)}%`,
    );
  }
}
