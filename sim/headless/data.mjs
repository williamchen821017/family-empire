export const ABILITY_TABLE = {
  1: { failure: [1,2,3,4], success: [5,6], great: [], triumph: [] },
  2: { failure: [1,2,3], success: [4,5], great: [6], triumph: [] },
  3: { failure: [1,2], success: [3,4], great: [5], triumph: [6] },
  4: { failure: [1], success: [2,3,4], great: [5], triumph: [6] },
  5: { failure: [1], success: [2,3], great: [4,5], triumph: [6] }
};

export const RESULT_RANK = { failure: 0, success: 1, great: 2, triumph: 3 };
export const STAGE_ORDER = ["child", "youth", "adult", "prime1", "prime2", "old"];
export const EXECUTOR_STAGES = new Set(["adult", "prime1", "prime2", "old"]);

export const ADJACENCY = {
  花川: ["雙峰", "麥原", "果園谷", "蘆葦澤"],
  松原: ["雙峰", "麥原", "白樺坡", "星原"],
  雙峰: ["松原", "麥原", "花川", "果園谷"],
  麥原: ["松原", "雙峰", "白樺坡", "柳灣", "花川"],
  白樺坡: ["松原", "麥原", "星原", "紅葉嶺"],
  柳灣: ["麥原", "蘆葦澤"],
  果園谷: ["雙峰", "花川", "月狹道"],
  蘆葦澤: ["花川", "柳灣", "柳岸"],
  星原: ["松原", "白樺坡"],
  紅葉嶺: ["白樺坡"],
  月狹道: ["果園谷"],
  柳岸: ["蘆葦澤"]
};

export const INDUSTRY_ALLOWED = {
  花川: ["釀坊", "工坊", "商隊"],
  松原: ["牧場", "農莊"],
  雙峰: ["農莊", "牧場", "工坊"],
  麥原: ["農莊", "釀坊", "商隊"],
  白樺坡: ["牧場", "工坊"],
  柳灣: ["農莊", "商隊", "釀坊"],
  果園谷: ["農莊", "釀坊", "工坊"],
  蘆葦澤: ["農莊", "商隊"]
};

export const INDUSTRY_YIELD = {
  農莊: "food",
  牧場: "food",
  釀坊: "money",
  商隊: "money",
  工坊: "money"
};

export const ORDINARY_EVENTS = [
  { id: "home-letter", name: "故鄉捎來的信", diamond: true, openingPeaceful: true },
  { id: "spring-market", name: "春日市集", diamond: true, openingPeaceful: true },
  { id: "road-people", name: "沿路而來的人們", diamond: false, openingPeaceful: true },
  { id: "calm", name: "風聲暫歇", diamond: true, openingPeaceful: true },
  { id: "old-merit", name: "王廷追敘舊功", diamond: true },
  { id: "envoy", name: "遠方領主的使者", diamond: true },
  { id: "royal-road", name: "王道整修", diamond: false },
  { id: "grain-price", name: "花京的糧價漲了", diamond: true },
  { id: "water-conflict", name: "用水引起的衝突", diamond: false },
  { id: "mountain-road", name: "山路斷了", diamond: false }
];

function ch(id, sex, stage, stats, seniority, location, gen, extra = {}) {
  return {
    id, sex, stage, stats, seniority, location, gen,
    branch: extra.branch ?? null,
    fatherId: extra.fatherId ?? null,
    spouseId: extra.spouseId ?? null,
    growth: extra.growth ?? null,
    adultBase: extra.adultBase ?? null,
    officeLevel: extra.officeLevel ?? 0,
    inService: !!extra.inService,
    exitedPolitics: !!extra.exitedPolitics,
    titleTier: extra.titleTier ?? 0,
    birthFamilyId: extra.birthFamilyId ?? null
  };
}

/**
 * TEST SNAPSHOT for headless testing only.
 * Family resources reflect the current 2026-10-20 implementation-status mirror.
 * Character stat blocks are retained from the V04 data model where no later decision changed them.
 * This is not a rules authority document.
 */
export const FAMILY_SETUPS = {
  owl: {
    name: "夜梟家", root: "花川", resources: { money: 4, food: 2, influence: 2, troops: 0 }, industries: ["釀坊"],
    chars: [
      ch("A1","男","old",{command:1,governance:4,royalFavor:3,social:3,reputation:4},4,"花川",1,{branch:"A-root"}),
      ch("A2","男","prime2",{command:2,governance:4,royalFavor:2,social:2,reputation:4},3,"花川",2,{fatherId:"A1",branch:"A2"}),
      ch("A3","男","prime1",{command:3,governance:3,royalFavor:2,social:4,reputation:2},2,"花川",2,{fatherId:"A1",branch:"A3",spouseId:"N1"}),
      ch("A4","男","adult",{command:1,governance:4,royalFavor:3,social:2,reputation:2},1,"花京",3,{fatherId:"A2",branch:"A2",officeLevel:1,inService:true}),
      ch("A5","男","youth",{},0,"花川",3,{fatherId:"A2",branch:"A2",growth:"governance",adultBase:{command:2,governance:4,royalFavor:2,social:3,reputation:3}}),
      ch("A6","女","adult",{command:4,governance:2,royalFavor:1,social:3,reputation:2},1,"花京",3,{fatherId:"A3",branch:"A3"}),
      ch("A7","男","child",{},0,"花川",3,{fatherId:"A3",branch:"A3",growth:"royalFavor",adultBase:{command:2,governance:3,royalFavor:3,social:2,reputation:3}}),
      ch("N1","女","prime1",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,"花川",0,{spouseId:"A3",birthFamilyId:"external-N1"})
    ]
  },
  deer: {
    name: "白鹿家", root: "麥原", resources: { money: 3, food: 3, influence: 3, troops: 1 }, industries: ["農莊"],
    chars: [
      ch("B1","男","old",{command:2,governance:3,royalFavor:3,social:4,reputation:4},4,"麥原",1,{branch:"B-root"}),
      ch("B2","男","prime2",{command:2,governance:3,royalFavor:3,social:4,reputation:4},2,"麥原",2,{fatherId:"B1",branch:"B2",inService:true}),
      ch("B3","男","prime1",{command:4,governance:2,royalFavor:2,social:3,reputation:3},2,"麥原",2,{fatherId:"B1",branch:"B3"}),
      ch("B4","男","prime1",{command:1,governance:3,royalFavor:4,social:4,reputation:3},2,"花京",3,{fatherId:"B2",branch:"B2",spouseId:"N2",officeLevel:2,inService:true}),
      ch("B5","女","adult",{command:2,governance:2,royalFavor:2,social:5,reputation:3},1,"花京",3,{fatherId:"B3",branch:"B3"}),
      ch("B6","男","adult",{command:3,governance:4,royalFavor:1,social:2,reputation:2},1,"麥原",3,{fatherId:"B3",branch:"B3",inService:true}),
      ch("B7","男","youth",{},0,"麥原",3,{fatherId:"B2",branch:"B2",growth:"social",adultBase:{command:3,governance:2,royalFavor:2,social:4,reputation:2}}),
      ch("N2","女","adult",{command:1,governance:3,royalFavor:3,social:4,reputation:4},1,"花京",0,{spouseId:"B4",birthFamilyId:"external-N2"})
    ]
  },
  fox: {
    name: "銀狐家", root: "花川", resources: { money: 3, food: 2, influence: 3, troops: 1 }, industries: ["工坊"],
    chars: [
      ch("C1","男","old",{command:2,governance:3,royalFavor:4,social:3,reputation:5},5,"花京",1,{branch:"C-root",titleTier:5}),
      ch("C2","男","prime2",{command:2,governance:3,royalFavor:4,social:3,reputation:4},3,"花川",2,{fatherId:"C1",branch:"C2",inService:true}),
      ch("C3","男","prime1",{command:2,governance:4,royalFavor:5,social:3,reputation:4},4,"花京",2,{fatherId:"C1",branch:"C3",spouseId:"N3",officeLevel:4,inService:true}),
      ch("C4","男","adult",{command:4,governance:2,royalFavor:3,social:2,reputation:3},1,"花川",3,{fatherId:"C2",branch:"C2"}),
      ch("C5","女","adult",{command:1,governance:3,royalFavor:3,social:4,reputation:4},1,"花京",3,{fatherId:"C2",branch:"C2",inService:true}),
      ch("C6","男","adult",{command:2,governance:4,royalFavor:3,social:3,reputation:3},1,"花京",3,{fatherId:"C3",branch:"C3"}),
      ch("C7","男","youth",{},0,"花川",3,{fatherId:"C3",branch:"C3",growth:"royalFavor",adultBase:{command:2,governance:3,royalFavor:4,social:2,reputation:4}}),
      ch("N3","女","prime1",{command:1,governance:3,royalFavor:3,social:4,reputation:3},1,"花京",0,{spouseId:"C3",birthFamilyId:"external-N3"})
    ]
  },
  bear: {
    name: "山熊家", root: "松原", resources: { money: 2, food: 4, influence: 3, troops: 2 }, industries: ["牧場"],
    chars: [
      ch("D1","男","old",{command:4,governance:2,royalFavor:2,social:2,reputation:4},4,"松原",1,{branch:"D-root"}),
      ch("D2","男","prime2",{command:4,governance:3,royalFavor:2,social:2,reputation:3},3,"松原",2,{fatherId:"D1",branch:"D2",officeLevel:3,inService:true}),
      ch("D3","男","prime1",{command:2,governance:4,royalFavor:2,social:3,reputation:3},2,"松原",2,{fatherId:"D1",branch:"D3",inService:true}),
      ch("D4","男","adult",{command:5,governance:2,royalFavor:1,social:2,reputation:2},1,"松原",3,{fatherId:"D2",branch:"D2",spouseId:"N4"}),
      ch("D5","女","adult",{command:2,governance:2,royalFavor:2,social:4,reputation:3},1,"花京",3,{fatherId:"D2",branch:"D2",inService:true}),
      ch("D6","男","adult",{command:3,governance:4,royalFavor:2,social:2,reputation:2},1,"松原",3,{fatherId:"D3",branch:"D3"}),
      ch("D7","男","youth",{},0,"松原",3,{fatherId:"D3",branch:"D3",growth:"command",adultBase:{command:4,governance:2,royalFavor:2,social:3,reputation:3}}),
      ch("D8","男","child",{},0,"松原",4,{fatherId:"D4",branch:"D2",growth:"governance",adultBase:{command:3,governance:3,royalFavor:2,social:3,reputation:2}}),
      ch("N4","女","adult",{command:2,governance:3,royalFavor:2,social:4,reputation:3},1,"松原",0,{spouseId:"D4",birthFamilyId:"external-N4"})
    ]
  },
  beaver: {
    name: "河狸家", root: "麥原", resources: { money: 5, food: 3, influence: 2, troops: 1 }, industries: ["農莊", "釀坊"],
    chars: [
      ch("E1","男","old",{command:2,governance:4,royalFavor:2,social:3,reputation:3},3,"麥原",1,{branch:"E-root"}),
      ch("E2","男","prime2",{command:2,governance:5,royalFavor:2,social:3,reputation:3},3,"麥原",2,{fatherId:"E1",branch:"E2",spouseId:"N5",officeLevel:3,inService:true}),
      ch("E3","男","prime1",{command:3,governance:3,royalFavor:2,social:4,reputation:2},2,"麥原",2,{fatherId:"E1",branch:"E3",inService:true}),
      ch("E4","男","adult",{command:2,governance:4,royalFavor:3,social:2,reputation:2},1,"麥原",3,{fatherId:"E2",branch:"E2",inService:true}),
      ch("E5","女","youth",{},0,"麥原",3,{fatherId:"E2",branch:"E2",growth:"governance",adultBase:{command:2,governance:4,royalFavor:2,social:3,reputation:2}}),
      ch("E6","男","adult",{command:4,governance:2,royalFavor:2,social:3,reputation:3},1,"花京",3,{fatherId:"E3",branch:"E3"}),
      ch("N5","女","prime1",{command:1,governance:3,royalFavor:3,social:4,reputation:3},1,"麥原",0,{spouseId:"E2",birthFamilyId:"external-N5"})
    ]
  },
  badger: {
    name: "獾家", root: "雙峰", resources: { money: 3, food: 3, influence: 2, troops: 1 }, industries: ["農莊"],
    chars: [
      ch("F1","男","old",{command:3,governance:3,royalFavor:2,social:3,reputation:4},3,"雙峰",1,{branch:"F-root"}),
      ch("F2","男","prime2",{command:3,governance:3,royalFavor:2,social:2,reputation:3},2,"雙峰",2,{fatherId:"F1",branch:"F2",inService:true}),
      ch("F3","男","prime2",{command:3,governance:4,royalFavor:2,social:3,reputation:3},3,"雙峰",2,{fatherId:"F1",branch:"F3",officeLevel:3,inService:true}),
      ch("F4","男","prime1",{command:2,governance:4,royalFavor:1,social:3,reputation:2},1,"雙峰",3,{fatherId:"F2",branch:"F2",spouseId:"N6",inService:true}),
      ch("F5","男","adult",{command:4,governance:2,royalFavor:2,social:2,reputation:2},1,"雙峰",3,{fatherId:"F2",branch:"F2"}),
      ch("F6","女","adult",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,"花京",3,{fatherId:"F2",branch:"F2"}),
      ch("F7","男","adult",{command:2,governance:3,royalFavor:4,social:2,reputation:2},1,"花京",3,{fatherId:"F3",branch:"F3"}),
      ch("F8","男","youth",{},0,"雙峰",3,{fatherId:"F3",branch:"F3",growth:"reputation",adultBase:{command:3,governance:3,royalFavor:2,social:3,reputation:3}}),
      ch("N6","女","adult",{command:2,governance:3,royalFavor:2,social:3,reputation:3},1,"雙峰",0,{spouseId:"F4",birthFamilyId:"external-N6"})
    ]
  },
  crow: {
    name: "烏鴉家", root: "柳灣", resources: { money: 5, food: 3, influence: 4, troops: 0 }, industries: ["商隊"],
    chars: [
      ch("G1","男","prime2",{command:2,governance:5,royalFavor:4,social:4,reputation:4},4,"花京",1,{branch:"G-root",officeLevel:3,inService:true}),
      ch("G2","男","prime1",{command:3,governance:3,royalFavor:3,social:4,reputation:3},2,"柳灣",2,{fatherId:"G1",branch:"G2",spouseId:"N7",inService:true}),
      ch("G3","男","adult",{command:4,governance:2,royalFavor:2,social:3,reputation:2},1,"柳灣",2,{fatherId:"G1",branch:"G3",inService:true}),
      ch("G4","男","adult",{command:2,governance:3,royalFavor:3,social:3,reputation:2},1,"柳灣",3,{fatherId:"G2",branch:"G2"}),
      ch("G5","女","child",{},0,"柳灣",3,{fatherId:"G2",branch:"G2",growth:"governance",adultBase:{command:2,governance:4,royalFavor:3,social:3,reputation:2}}),
      ch("G6","男","child",{},0,"柳灣",3,{fatherId:"G3",branch:"G3",growth:"social",adultBase:{command:3,governance:2,royalFavor:3,social:4,reputation:2}}),
      ch("N7","女","prime1",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,"柳灣",0,{spouseId:"G2",birthFamilyId:"external-N7"})
    ]
  }
};

export const MAIN_BRANCHES = {
  owl: ["A2", "A3"], deer: ["B2", "B3"], fox: ["C2", "C3"], bear: ["D2", "D3"],
  beaver: ["E2", "E3"], badger: ["F2", "F3"], crow: ["G2", "G3"]
};
