export function checkAmbition(game, family, ambition) {
  if (!ambition) return false;

  const requirement = ambition.requirement;

  switch (requirement.type) {
    case "officialCount":
      return family.stats.officeCharacterIds.size >= requirement.min;
    case "keyOfficialCount":
      return family.stats.keyOfficeCharacterIds.size >= requirement.min;
    case "currentOfficialCount":
      return family.stats.currentOfficeCharacterIds.size >= requirement.min;
    case "officeGenerations": {
      const generations = new Set(
        family.members
          .filter((member) => family.stats.officeCharacterIds.has(member.id))
          .map((member) => member.generation),
      );
      return generations.size >= requirement.min;
    }
    case "marriageFamilies":
      return family.stats.externalMarriageFamilies.size >= requirement.min;
    case "activeAlliances": {
      let count = 0;
      for (const relation of game.familyRelations.values()) {
        if (
          relation.alliance &&
          (relation.familyAId === family.id ||
            relation.familyBId === family.id)
        ) {
          count += 1;
        }
      }
      return count >= requirement.min;
    }
    case "relationsAtDepth": {
      let count = 0;
      for (const relation of game.familyRelations.values()) {
        if (
          relation.depth >= requirement.minDepth &&
          (relation.familyAId === family.id ||
            relation.familyBId === family.id)
        ) {
          count += 1;
        }
      }
      return count >= requirement.min;
    }
    case "industries":
      return family.industryContracts.length >= requirement.min;
    case "localRegions":
      return family.stats.localRegions.size >= requirement.min;
    case "industriesAndLocal":
      return (
        family.industryContracts.length >= requirement.industries &&
        family.stats.localRegions.size >= requirement.regions
      );
    case "completedTasks":
      return family.history.completedTasks.length >= requirement.min;
    case "majorTasks":
      return (
        family.history.completedTasks.filter((task) => task.major).length >=
        requirement.min
      );
    case "births":
      return family.stats.births >= requirement.min;
    case "influence":
      return family.resources.influence >= requirement.min;
    default:
      return false;
  }
}

export function assignFamilyAmbitions(game, chooseAmbition) {
  for (const family of game.families) {
    const candidates = game.ambitionDeck.splice(0, 2);
    if (!candidates.length) break;

    const selected =
      typeof chooseAmbition === "function"
        ? chooseAmbition({
            game,
            family,
            candidates,
            rng: game.rng,
          })
        : candidates[Math.floor(game.rng() * candidates.length)];

    const ambition =
      candidates.find((candidate) => candidate.id === selected?.id) ??
      candidates[0];

    family.ambition = {
      card: ambition,
      completed: false,
      revealed: false,
      completedRound: null,
      revealedRound: null,
    };

    for (const candidate of candidates) {
      if (candidate.id !== ambition.id) {
        game.ambitionDiscard.push(candidate);
      }
    }
  }
}

export function updateAmbitionCompletion(game, family) {
  if (!family.ambition?.card) return false;
  if (family.ambition.completed) return true;

  if (checkAmbition(game, family, family.ambition.card)) {
    family.ambition.completed = true;
    family.ambition.completedRound = game.round;
    return true;
  }

  return false;
}

export function revealCompletedAmbition(
  game,
  family,
  drawRewardCardChoice,
  chooseRewardCard,
) {
  if (!family.ambition?.completed || family.ambition.revealed) {
    return false;
  }

  family.ambition.revealed = true;
  family.ambition.revealedRound = game.round;
  family.resources.influence += 2;

  if (typeof drawRewardCardChoice === "function") {
    drawRewardCardChoice(game, family, 2, chooseRewardCard);
  }

  return true;
}
