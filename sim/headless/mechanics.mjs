import { ABILITY_TABLE, RESULT_RANK, EXECUTOR_STAGES } from "./data.mjs";

export function isExecutor(c) {
  return !!c && c.alive && EXECUTOR_STAGES.has(c.stage) && !c.exitedPolitics;
}

export function rollAbility(value, rng, dice = 1) {
  const rolls = Array.from({ length: dice }, () => rng.d6());
  const roll = Math.max(...rolls);
  const row = ABILITY_TABLE[value] || ABILITY_TABLE[1];
  let result = "failure";
  for (const key of ["failure", "success", "great", "triumph"]) if (row[key].includes(roll)) result = key;
  return { value, dice, rolls, roll, result, rank: RESULT_RANK[result] };
}

export function bumpActionMetric(player, type) {
  player.metrics.actions[type] = (player.metrics.actions[type] || 0) + 1;
}

export function ensureChoice(choice, options, label) {
  if (!options.length) return null;
  if (choice === null || choice === undefined) throw new Error(`No choice provided for ${label}`);
  const key = typeof choice === "string" ? choice : choice.id;
  const found = options.find(x => x.id === key);
  if (!found) throw new Error(`Illegal choice for ${label}: ${key}`);
  return found;
}
