/**
 * 測試用規則鏡像，不是遊戲規則權威來源。
 * 只放自動測試真正需要的少量參數；每個值都必須標示 status。
 * 若正式規則改變，先更新權威決策，再更新這裡。
 */
export const RULES_PROFILE = {
  ruleset: "V04",
  snapshotDate: "2026-10-20",
  authority: "V04 正式交接文件＋後續正式決策",
  note: "This file is a simulation mirror, never the source of truth.",

  confirmed: {
    playerCounts: [2, 3, 4, 5],
    mainActionsPerFamilyPerRound: 3,
    characterActionLimitPerRound: 2,
    characterNormalMoveLimitPerRound: 1,
    ordinaryEventCount: 10,
    ordinaryDiamondCount: 6,
    endgameMaturesAtDiamond: 4,
    importantBirthChecksPerFamilyPerDiamond: 1,
    marriageLegendDistinctNewFamilies: 3,
    formTroopMoneyCost: 1,
    seniority2to3InfluenceCost: 1,
    oldDeathMaxRoll: 3,
    normalBirthMinRoll: 2,
    lateBirthMinRoll: 4
  },

  test: {
    industryCapacity: 3,
    acquireIndustryMoneyCost: 2,
    buyFoodMoneyCost: 2,
    wealthLegendMoneyPlusFood: 20,
    normalTroopCapacity: 3,
    excessTroopMoneyCostEach: 1,
    fundraiseOncePerRound: true,
    minimumLegendForWin: 1
  },

  unknown: {
    royalArmyTotalForYoungKingScenario: null,
    finalIndustryTileSupply: null,
    fullNpcMarriageRoster: null,
    completeCrisisAutomation: null
  }
};

export function requireConfirmed(key) {
  if (!(key in RULES_PROFILE.confirmed)) {
    throw new Error(`Rule "${key}" is not in confirmed profile; do not invent a default.`);
  }
  return RULES_PROFILE.confirmed[key];
}
