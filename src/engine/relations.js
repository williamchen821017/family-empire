export const RELATION_LEVELS = Object.freeze([
  { depth: 0, name: "無正式關係" },
  { depth: 1, name: "往來" },
  { depth: 2, name: "通財" },
  { depth: 3, name: "協力" },
  { depth: 4, name: "共擔" },
  { depth: 5, name: "共進退" },
]);

export function relationName(depth) {
  return RELATION_LEVELS.find((item) => item.depth === depth)?.name ?? "未知";
}

export function createRelation(familyAId, familyBId) {
  return {
    familyAId,
    familyBId,
    depth: 0,
    marriages: 0,
    alliance: false,
    allianceId: null,
    roundUsage: {
      aidProvidedBy: {},
      freeAssetTransferUsed: false,
      sharedBurdenUsed: false,
      freeAssistUsed: false,
    },
  };
}

export function resetRelationRoundUsage(relation) {
  relation.roundUsage = {
    aidProvidedBy: {},
    freeAssetTransferUsed: false,
    sharedBurdenUsed: false,
    freeAssistUsed: false,
  };
}
