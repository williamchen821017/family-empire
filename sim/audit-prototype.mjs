import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const jsonOnly = process.argv.includes("--json");
const strict = process.argv.includes("--strict");

const checks = [
  {
    id: "SYNC-RESOURCE-DEPENDENTS",
    severity: "known-gap",
    description: "Prototype still contains removed dependents/依附戶 resource.",
    files: ["language.js", "v04/01-data.js", "v04/04a-actions.js", "v04/05-settlement.js"],
    needles: ["dependents", "依附戶"]
  },
  {
    id: "SYNC-TIME-EFFECTIVE-DIAMOND",
    severity: "known-gap",
    description: "Prototype still uses effective-diamond / consecutive-diamond invalidation logic.",
    files: ["v04/02-state-setup.js", "v04/05-settlement.js"],
    needles: ["effectiveDiamonds", "previousRoundEffectiveDiamond", "有效◆"]
  },
  {
    id: "SYNC-HAND-OLD-CARDS",
    severity: "known-gap",
    description: "Prototype still contains hand cards that were removed from the current V04 line.",
    files: ["v04/01-data.js"],
    needles: ["熟人遞話", "官署門路", "邊地舊識", "私下斡旋"]
  },
  {
    id: "SYNC-LEGEND-WEALTH-8",
    severity: "known-gap",
    description: "Prototype still checks 家業豐足 with money+food >= 8 instead of current TEST threshold.",
    files: ["v04/06-ui-end.js"],
    needles: [">=8"]
  },
  {
    id: "SYNC-MARRIAGE-OPENING-PROGRESS",
    severity: "known-gap",
    description: "Prototype still carries opening politicalMarriages into legend progress.",
    files: ["v04/01-data.js", "v04/02-state-setup.js", "v04/06-ui-end.js"],
    needles: ["politicalMarriages"]
  },
  {
    id: "SYNC-BIRTH-MULTIPLE-PER-DIAMOND",
    severity: "known-gap",
    description: "Prototype birth settlement still iterates eligible marriages rather than enforcing one important-birth check per family per diamond.",
    files: ["v04/05-settlement.js"],
    needles: ["function attemptBirths", "p.characters.forEach(h=>"]
  },
  {
    id: "SYNC-TITLE-OLD-ROYAL-TITLE",
    severity: "known-gap",
    description: "Prototype still uses old 王爵 special-case string.",
    files: ["v04/01-data.js", "v04/05-settlement.js"],
    needles: ["王爵"]
  },
  {
    id: "SYNC-EVENT-OLD-NAMES",
    severity: "known-gap",
    description: "Prototype still contains renamed war-event titles.",
    files: ["v04/01-data.js"],
    needles: ["從北方來的隊伍", "路上都是往南走的人", "遠處一整夜都是火光", "沒有人敢走那條路"]
  },
  {
    id: "SYNC-OWL-OLD-SETUP",
    severity: "known-gap",
    description: "Prototype owl setup still shows the pre-T2 influence/industry configuration.",
    files: ["v04/01-data.js"],
    needles: ['influence:3,dependents:1,troops:0', 'industries:["釀坊","工坊"]']
  }
];

const findings = [];
for (const check of checks) {
  const hits = [];
  for (const rel of check.files) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      hits.push({ file: rel, missing: true });
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const needle of check.needles) {
      if (text.includes(needle)) hits.push({ file: rel, needle });
    }
  }
  if (hits.length) findings.push({ ...check, hits });
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: "prototype-audit",
  status: findings.length ? "known-sync-gaps-found" : "no-known-gap-patterns-found",
  findings
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Prototype audit: ${findings.length} known sync-gap groups found.`);
  for (const f of findings) {
    console.log(`- [${f.severity}] ${f.id}: ${f.description}`);
    for (const hit of f.hits) console.log(`    ${hit.file}${hit.needle ? ` :: ${hit.needle}` : " :: MISSING"}`);
  }
  console.log("\nThese findings are warnings by default because the user explicitly allowed the browser Prototype to remain unsynchronized.");
}

if (strict && findings.some(f => f.severity === "violation")) process.exitCode = 1;
