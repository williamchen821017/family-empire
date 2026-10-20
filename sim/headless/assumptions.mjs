/**
 * Explicit simulation assumptions. Every value here is reported in output.
 * These are NOT silently promoted to V04 rules.
 */
export const ASSUMPTION_PROFILES = {
  "core-sandbox-v1": {
    id: "core-sandbox-v1",
    label: "Core-loop regression sandbox; not full V04 balance",
    industrySupplyInterpretation: "total-game-supply-including-setup",
    industrySupply: { 農莊: 4, 牧場: 3, 釀坊: 3, 商隊: 3, 工坊: 3 },
    newbornSexRule: "1d6-1to3-male-4to6-female",
    newbornAdultStatsRule: "prototype-d6-bucket-1-2-3-3-4-5",
    newbornGrowthStatRule: "random-among-stats-below-5",
    eventSpecificEffects: "disabled-except-diamond-timing",
    crisis: "not-simulated; core-loop sandbox ends when fourth diamond resolves",
    npcMarriage: "not-simulated",
    handCards: "not-simulated",
    titleOpportunities: "not-simulated",
    alliance: "not-simulated"
  }
};

export function getAssumptionProfile(id = "core-sandbox-v1") {
  const p = ASSUMPTION_PROFILES[id];
  if (!p) throw new Error(`Unknown assumption profile: ${id}`);
  return structuredClone(p);
}
