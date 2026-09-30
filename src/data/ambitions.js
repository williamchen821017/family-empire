export const AMBITION_TEMPLATES = Object.freeze([
  {
    id: "three_officials",
    title: "使三人皆列朝班",
    requirement: { type: "officialCount", min: 3 },
    actionWeights: { seek_office: 6, take_task: 2, propose_alliance: 1 },
  },
  {
    id: "one_key_office",
    title: "登一要職，以振家聲",
    requirement: { type: "keyOfficialCount", min: 1 },
    actionWeights: { seek_office: 7, take_task: 1 },
  },
  {
    id: "two_generation_office",
    title: "使兩世相承，皆有仕進",
    requirement: { type: "officeGenerations", min: 2 },
    actionWeights: { seek_office: 6, marriage: 1 },
  },
  {
    id: "three_marriage_families",
    title: "結姻三姓，以廣門望",
    requirement: { type: "marriageFamilies", min: 3 },
    actionWeights: { marriage: 7, propose_alliance: 2 },
  },
  {
    id: "two_alliances",
    title: "締盟二家，以通聲援",
    requirement: { type: "activeAlliances", min: 2 },
    actionWeights: { propose_alliance: 7, marriage: 2 },
  },
  {
    id: "deep_relations",
    title: "厚交二門，使往來益深",
    requirement: { type: "relationsAtDepth", minDepth: 3, min: 2 },
    actionWeights: { marriage: 5, propose_alliance: 5 },
  },
  {
    id: "three_industries",
    title: "廣置田業，以裕家資",
    requirement: { type: "industries", min: 3 },
    actionWeights: { acquire_industry: 7, gather_money: 3, establish_local_power: 1 },
  },
  {
    id: "two_local_regions",
    title: "經營二州，以固鄉望",
    requirement: { type: "localRegions", min: 2 },
    actionWeights: { establish_local_power: 7, acquire_industry: 4, seek_office: 1 },
  },
  {
    id: "wealth_and_local",
    title: "廣業立基，使家資鄉望並進",
    requirement: { type: "industriesAndLocal", industries: 3, regions: 2 },
    actionWeights: { acquire_industry: 6, establish_local_power: 6, gather_money: 2 },
  },
  {
    id: "three_tasks",
    title: "成三事，以著家名",
    requirement: { type: "completedTasks", min: 3 },
    actionWeights: { take_task: 7, propose_alliance: 1 },
  },
  {
    id: "one_major_task",
    title: "立一大功，以顯門楣",
    requirement: { type: "majorTasks", min: 1 },
    actionWeights: { take_task: 8 },
  },
  {
    id: "five_tasks",
    title: "屢任其事，使勳名相繼",
    requirement: { type: "completedTasks", min: 5 },
    actionWeights: { take_task: 8 },
  },
  {
    id: "three_births",
    title: "延嗣三人，使宗支不絕",
    requirement: { type: "births", min: 3 },
    actionWeights: { marriage: 7, propose_alliance: 1 },
  },
  {
    id: "high_influence",
    title: "廣結人望，使門聲大著",
    requirement: { type: "influence", min: 10 },
    actionWeights: { take_task: 4, marriage: 3, propose_alliance: 3, seek_office: 2 },
  },
  {
    id: "two_current_officials",
    title: "使二人並列朝班",
    requirement: { type: "currentOfficialCount", min: 2 },
    actionWeights: { seek_office: 7 },
  },
]);

export function createAmbitionDeck(rng) {
  const deck = AMBITION_TEMPLATES.map((ambition) => ({
    ...ambition,
    requirement: { ...ambition.requirement },
    actionWeights: { ...ambition.actionWeights },
  }));

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
