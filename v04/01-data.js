const app = document.getElementById("app");
const L = window.L;

const ABILITY_TABLE = {
  1:{failure:[1,2,3,4],success:[5,6],great:[],triumph:[]},
  2:{failure:[1,2,3],success:[4,5],great:[6],triumph:[]},
  3:{failure:[1,2],success:[3,4],great:[5],triumph:[6]},
  4:{failure:[1],success:[2,3,4],great:[5],triumph:[6]},
  5:{failure:[1],success:[2,3],great:[4,5],triumph:[6]}
};
const RESULT_RANK={failure:0,success:1,great:2,triumph:3};
const STAGE_ORDER=["child","youth","adult","prime1","prime2","old"];
const GENERAL_EXECUTOR=new Set(["adult","prime1","prime2","old"]);
const CORE_REGIONS=["花川","松原","雙峰","麥原","白樺坡","柳灣","果園谷","蘆葦澤"];
const OUTER_REGIONS=["星原","紅葉嶺","月狹道","柳岸"];
const ADJ={
  "花川":["雙峰","麥原","果園谷","蘆葦澤"],
  "松原":["雙峰","麥原","白樺坡","星原"],
  "雙峰":["松原","麥原","花川","果園谷"],
  "麥原":["松原","雙峰","白樺坡","柳灣","花川"],
  "白樺坡":["松原","麥原","星原","紅葉嶺"],
  "柳灣":["麥原","蘆葦澤"],
  "果園谷":["雙峰","花川","月狹道"],
  "蘆葦澤":["花川","柳灣","柳岸"],
  "星原":["松原","白樺坡"],"紅葉嶺":["白樺坡"],"月狹道":["果園谷"],"柳岸":["蘆葦澤"]
};
const INDUSTRY_ALLOWED={
  "花川":["釀坊","工坊","商隊"],"松原":["牧場","農莊"],"雙峰":["農莊","牧場","工坊"],
  "麥原":["農莊","釀坊","商隊"],"白樺坡":["牧場","工坊"],"柳灣":["農莊","商隊","釀坊"],
  "果園谷":["農莊","釀坊","工坊"],"蘆葦澤":["農莊","商隊"]
};
const INDUSTRY_YIELD={"農莊":"food","牧場":"food","釀坊":"money","商隊":"money","工坊":"money"};
const INDUSTRY_SUPPLY={"農莊":4,"牧場":3,"釀坊":3,"商隊":3,"工坊":3};

function C(id, sex, stage, abilities, seniority, office, location, gen, extra={}){
  return {id,sex,stage,abilities,seniority,office:office||null,location,gen,alive:true,moveUsed:false,actionsUsed:0,
    marriedTo:extra.marriedTo||null,growth:extra.growth||null,adultBase:extra.adultBase||null,birthFamily:extra.birthFamily||null,
    controller:extra.controller||null,title:extra.title||null,gameBorn:!!extra.gameBorn};
}

const FAMILY_DATA={
  owl:{name:"夜梟家",animal:"夜梟",root:"花川",resources:{money:4,food:2,influence:3,dependents:1,troops:0},industries:["釀坊","工坊"],office:"政務官",politicalMarriages:0,
    chars:[
      C("A1","男","old",{command:1,governance:4,royalFavor:3,social:3,reputation:4},4,null,"花川",1),
      C("A2","男","prime2",{command:2,governance:4,royalFavor:2,social:2,reputation:4},3,null,"花川",2),
      C("A3","男","prime1",{command:3,governance:3,royalFavor:2,social:4,reputation:2},2,null,"花川",2,{marriedTo:"N1"}),
      C("A4","男","adult",{command:1,governance:4,royalFavor:3,social:2,reputation:2},1,"政務官","花京",3),
      C("A5","男","youth",{},0,null,"花川",3,{growth:"governance",adultBase:{command:2,governance:4,royalFavor:2,social:3,reputation:3}}),
      C("A6","女","adult",{command:4,governance:2,royalFavor:1,social:3,reputation:2},1,null,"花京",3),
      C("A7","男","child",{},0,null,"花川",3,{growth:"royalFavor",adultBase:{command:2,governance:3,royalFavor:3,social:2,reputation:3}}),
      C("N1","女","prime1",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,null,"花川",0,{marriedTo:"A3",birthFamily:"外部家族"})
    ]},
  deer:{name:"白鹿家",animal:"白鹿",root:"麥原",resources:{money:3,food:3,influence:3,dependents:2,troops:1},industries:["農莊"],office:"機要官",politicalMarriages:1,
    chars:[
      C("B1","男","old",{command:2,governance:3,royalFavor:3,social:4,reputation:4},4,null,"麥原",1),
      C("B2","男","prime2",{command:2,governance:3,royalFavor:3,social:4,reputation:4},2,null,"麥原",2),
      C("B3","男","prime1",{command:4,governance:2,royalFavor:2,social:3,reputation:3},2,null,"麥原",2),
      C("B4","男","prime1",{command:1,governance:3,royalFavor:4,social:4,reputation:3},2,"機要官","花京",3,{marriedTo:"N2"}),
      C("B5","女","adult",{command:2,governance:2,royalFavor:2,social:5,reputation:3},1,null,"花京",3),
      C("B6","男","adult",{command:3,governance:4,royalFavor:1,social:2,reputation:2},1,null,"麥原",3),
      C("B7","男","youth",{},0,null,"麥原",3,{growth:"social",adultBase:{command:3,governance:2,royalFavor:2,social:4,reputation:2}}),
      C("N2","女","adult",{command:1,governance:3,royalFavor:3,social:4,reputation:4},1,null,"花京",0,{marriedTo:"B4",birthFamily:"重要政治家族"})
    ]},
  fox:{name:"銀狐家",animal:"銀狐",root:"花川",resources:{money:2,food:2,influence:3,dependents:1,troops:1},industries:["工坊"],office:"王前大臣",politicalMarriages:0,
    chars:[
      C("C1","男","old",{command:2,governance:3,royalFavor:4,social:3,reputation:5},5,null,"花京",1,{title:"王爵"}),
      C("C2","男","prime2",{command:2,governance:3,royalFavor:4,social:3,reputation:4},3,null,"花川",2),
      C("C3","男","prime1",{command:2,governance:4,royalFavor:5,social:3,reputation:4},4,"王前大臣","花京",2,{marriedTo:"N3"}),
      C("C4","男","adult",{command:4,governance:2,royalFavor:3,social:2,reputation:3},1,null,"花川",3),
      C("C5","女","adult",{command:1,governance:3,royalFavor:3,social:4,reputation:4},1,null,"花京",3),
      C("C6","男","adult",{command:2,governance:4,royalFavor:3,social:3,reputation:3},1,null,"花京",3),
      C("C7","男","youth",{},0,null,"花川",3,{growth:"royalFavor",adultBase:{command:2,governance:3,royalFavor:4,social:2,reputation:4}}),
      C("N3","女","prime1",{command:1,governance:3,royalFavor:3,social:4,reputation:3},1,null,"花京",0,{marriedTo:"C3",birthFamily:"外部家族"})
    ]},
  bear:{name:"山熊家",animal:"山熊",root:"松原",resources:{money:2,food:4,influence:2,dependents:3,troops:2},industries:["牧場"],office:"松原守護官",politicalMarriages:0,
    chars:[
      C("D1","男","old",{command:4,governance:2,royalFavor:2,social:2,reputation:4},4,null,"松原",1),
      C("D2","男","prime2",{command:4,governance:3,royalFavor:2,social:2,reputation:3},3,"松原守護官","松原",2),
      C("D3","男","prime1",{command:2,governance:4,royalFavor:2,social:3,reputation:3},2,null,"松原",2),
      C("D4","男","adult",{command:5,governance:2,royalFavor:1,social:2,reputation:2},1,null,"松原",3,{marriedTo:"N4"}),
      C("D5","女","adult",{command:2,governance:2,royalFavor:2,social:4,reputation:3},1,null,"花京",3),
      C("D6","男","adult",{command:3,governance:4,royalFavor:2,social:2,reputation:2},1,null,"松原",3),
      C("D7","男","youth",{},0,null,"松原",3,{growth:"command",adultBase:{command:4,governance:2,royalFavor:2,social:3,reputation:3}}),
      C("D8","男","child",{},0,null,"松原",4,{growth:"governance",adultBase:{command:3,governance:3,royalFavor:2,social:3,reputation:2}}),
      C("N4","女","adult",{command:2,governance:3,royalFavor:2,social:4,reputation:3},1,null,"松原",0,{marriedTo:"D4",birthFamily:"外部家族"})
    ]},
  beaver:{name:"河狸家",animal:"河狸",root:"麥原",resources:{money:5,food:2,influence:2,dependents:2,troops:1},industries:["農莊","釀坊"],office:"麥原守護官",politicalMarriages:0,
    chars:[
      C("E1","男","old",{command:2,governance:4,royalFavor:2,social:3,reputation:3},3,null,"麥原",1),
      C("E2","男","prime2",{command:2,governance:5,royalFavor:2,social:3,reputation:3},3,"麥原守護官","麥原",2,{marriedTo:"N5"}),
      C("E3","男","prime1",{command:3,governance:3,royalFavor:2,social:4,reputation:2},2,null,"麥原",2),
      C("E4","男","adult",{command:2,governance:4,royalFavor:3,social:2,reputation:2},1,null,"麥原",3),
      C("E5","女","youth",{},0,null,"麥原",3,{growth:"governance",adultBase:{command:2,governance:4,royalFavor:2,social:3,reputation:2}}),
      C("E6","男","adult",{command:4,governance:2,royalFavor:2,social:3,reputation:3},1,null,"花京",3),
      C("N5","女","prime1",{command:1,governance:3,royalFavor:3,social:4,reputation:3},1,null,"麥原",0,{marriedTo:"E2",birthFamily:"外部家族"})
    ]},
  badger:{name:"獾家",animal:"獾",root:"雙峰",resources:{money:3,food:3,influence:2,dependents:3,troops:1},industries:["農莊"],office:"雙峰守護官",politicalMarriages:0,
    chars:[
      C("F1","男","old",{command:3,governance:3,royalFavor:2,social:3,reputation:4},3,null,"雙峰",1),
      C("F2","男","prime2",{command:3,governance:3,royalFavor:2,social:2,reputation:3},2,null,"雙峰",2),
      C("F3","男","prime2",{command:3,governance:4,royalFavor:2,social:3,reputation:3},3,"雙峰守護官","雙峰",2),
      C("F4","男","prime1",{command:2,governance:4,royalFavor:1,social:3,reputation:2},1,null,"雙峰",3,{marriedTo:"N6"}),
      C("F5","男","adult",{command:4,governance:2,royalFavor:2,social:2,reputation:2},1,null,"雙峰",3),
      C("F6","女","adult",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,null,"花京",3),
      C("F7","男","adult",{command:2,governance:3,royalFavor:4,social:2,reputation:2},1,null,"花京",3),
      C("F8","男","youth",{},0,null,"雙峰",3,{growth:"reputation",adultBase:{command:3,governance:3,royalFavor:2,social:3,reputation:3}}),
      C("N6","女","adult",{command:2,governance:3,royalFavor:2,social:3,reputation:3},1,null,"雙峰",0,{marriedTo:"F4",birthFamily:"外部家族"})
    ]},
  crow:{name:"烏鴉家",animal:"烏鴉",root:"柳灣",resources:{money:4,food:2,influence:4,dependents:1,troops:0},industries:["商隊"],office:"政務總管",politicalMarriages:0,
    chars:[
      C("G1","男","prime2",{command:2,governance:5,royalFavor:4,social:4,reputation:4},4,"政務總管","花京",1),
      C("G2","男","prime1",{command:3,governance:3,royalFavor:3,social:4,reputation:3},2,null,"柳灣",2,{marriedTo:"N7"}),
      C("G3","男","adult",{command:4,governance:2,royalFavor:2,social:3,reputation:2},1,null,"柳灣",2),
      C("G4","男","adult",{command:2,governance:3,royalFavor:3,social:3,reputation:2},1,null,"柳灣",3),
      C("G5","女","child",{},0,null,"柳灣",3,{growth:"governance",adultBase:{command:2,governance:4,royalFavor:3,social:3,reputation:2}}),
      C("G6","男","child",{},0,null,"柳灣",3,{growth:"social",adultBase:{command:3,governance:2,royalFavor:3,social:4,reputation:2}}),
      C("N7","女","prime1",{command:1,governance:3,royalFavor:2,social:4,reputation:3},1,null,"柳灣",0,{marriedTo:"G2",birthFamily:"外部家族"})
    ]}
};

const OFFICE_DATA=[
  {id:"政務官A",name:"政務官",level:1,ability:"governance",holderFamily:"owl",holderChar:"A4"},
  {id:"政務官B",name:"政務官",level:1,ability:"governance",open:true},
  {id:"機要官",name:"機要官",level:2,ability:"royalFavor",holderFamily:"deer",holderChar:"B4"},
  {id:"政務總管",name:"政務總管",level:3,ability:"governance",holderFamily:"crow",holderChar:"G1"},
  {id:"王前大臣",name:"王前大臣",level:4,ability:"royalFavor",holderFamily:"fox",holderChar:"C3"},
  {id:"任官總管",name:"任官總管",level:4,ability:"reputation",npc:true},
  {id:"侍衛統領",name:"侍衛統領",level:4,ability:"command",importantNpc:true},
  {id:"機要大臣",name:"機要大臣",level:4,ability:"royalFavor",importantNpc:true},
  {id:"花京總管",name:"花京總管",level:4,ability:"governance",npc:true},
  {id:"首席大臣",name:"首席大臣",level:5,ability:"governance",npc:true},
  ...["松原","雙峰","麥原","白樺坡","柳灣","果園谷","蘆葦澤"].map(r=>({id:r+"守護官",name:r+"守護官",level:3,ability:"governance",region:r,
    holderFamily:r==="松原"?"bear":r==="雙峰"?"badger":r==="麥原"?"beaver":null,
    holderChar:r==="松原"?"D2":r==="雙峰"?"F3":r==="麥原"?"E2":null,npc:!["松原","雙峰","麥原"].includes(r)}))
];

const FAMILY_CARDS=[
  ["王前引薦","若普通花京政治通道已存在，提供本次進入鑰匙；不能創造任命通道或越過硬門檻。"],
  ["熟人遞話","對一名重要NPC提供一次私人關係接觸鑰匙；不能直接改變立場。"],
  ["地方舊識","提供一次核心地區普通地方事件進入鑰匙；不等於地方根基。"],
  ["媒妁牽線","開啟一次與重要背景家族／NPC的婚姻通道；名望門檻仍存在。"],
  ["官署門路","實際任命通道已存在時提供進入鑰匙；不能把空缺變成任命。"],
  ["邊地舊識","提供與星原／紅葉嶺／月狹道或相關領主的接觸鑰匙。"],
  ["備妥文書","治理判定失敗後重骰一次，必須接受新結果。"],
  ["私下斡旋","針對人物／家族的交際判定失敗後重骰一次，必須接受新結果。"],
  ["反覆勘察","非正式戰鬥的軍事／安全統率判定前，2D6取高。"],
  ["借道而行","一次正常人物／家兵移動忽略普通事件造成的臨時道路中斷。"],
  ["旁支來援","普通家族／地方事件可由場外旁支代行；仍支付主要行動，治理或交際視為2。"],
  ["托人求情","危機清算明文可保全時提供一次私人關係保全鑰匙。"]
].map(([name,text])=>({name,text}));

const TURMOIL_EVENTS=[
  {id:"grainPrice",name:"花京的糧價漲了",diamond:true,ability:"governance",action:"地方",text:"花京人物或適合的行政／財糧官職可介入。花1地方主要行動，以治理判定；擲前可支付1糧改為2D6取高。成功以上解決；若回合末仍未解決，在花京有人物的各家族失去1錢。"},
  {id:"roadPeople",name:"沿路而來的人們",diamond:false,ability:"governance",action:"地方",text:"家族在目標核心地區有根基，且有可作一般執行人物者在地，可花1地方主要行動治理。成功後留下1批暫居人口；下一次有效◆時若根基仍在，轉為1依附戶。"},
  {id:"homeLetter",name:"故鄉捎來的信",diamond:true,ability:null,action:null,text:"揭示時，開局根基地區沒有可作一般執行人物的家族放置標記。◆生產時仍有標記者，該根基1個產業本次不生產。人物在◆前回到根基即可移除。"},
  {id:"waterConflict",name:"用水引起的衝突",diamond:true,ability:"governance",action:"地方",text:"所有有地方根基的家族放置標記；有標記時不能取得產業。根基地區的可執行人物可花1地方行動治理；成功以上移除自己的標記。"},
  {id:"northWind",name:"北風帶來消息",diamond:true,ability:"command",action:"軍事",text:"松原／白樺坡的可執行人物，或適合的邊地安全官職可花1軍事主要行動，以統率判定。成功以上解決；未解決則下一回合第一次從松原／白樺坡移出家兵時，每家最多只能移1個。"},
  {id:"creek",name:"溪水不再順流",diamond:true,ability:"governance",action:"地方",text:"每個擁有農莊的家族放置標記。農莊所在地／根基的可執行人物可花1地方行動治理；成功以上移除。◆時仍有標記者，選1個農莊本次不生產。"},
  {id:"mountainRoad",name:"山路斷了",diamond:false,ability:"governance",action:"地方",text:"本牌在場時，雙峰—花川不視為相鄰。位於兩地之一的可執行人物可花1地方行動治理；擲前可付1錢改為2D6取高，成功以上恢復。"},
  {id:"northGroup",name:"從北方來的隊伍",diamond:false,ability:"social",action:"地方",text:"根基在松原／白樺坡，或有可執行人物在該地的家族可選落腳地，花1地方行動，以交際判定。成功後成為1批暫居人口；下次有效◆時若該地有根基，轉為1依附戶。"},
  {id:"envoy",name:"遠方領主的使者",diamond:true,ability:"social",action:"政治",text:"花京中名望3+的可執行人物可接觸。花1政治主要行動，以交際判定；成功以上取得【遠方領主】關係鑰匙。"},
  {id:"calm",name:"風聲暫歇",diamond:true,ability:null,action:null,text:"沒有通道、獎勵或懲罰。若本回合◆有效，照正常有效◆流程推進世界。"}
];
const WAR_EVENTS=[
  {id:"refugees",name:"路上都是往南走的人",diamond:false,text:"將1批逃難人口放在花川。花川有地方根基的家族可花1地方行動＋1糧接納；下次有效◆時若根基仍在，轉為1依附戶。"},
  {id:"fire",name:"遠處一整夜都是火光",diamond:false,text:"每個在松原有產業的家族標記1個產業。可由松原的可執行人物花1地方行動治理；成功移除。回合末仍標記者，該產業下一次有效◆不生產。"},
  {id:"unsafeRoad",name:"沒有人敢走那條路",diamond:false,text:"松原—雙峰暫時不視為相鄰。位於兩地之一的可執行人物可花1軍事主要行動，以統率判定；成功以上恢復。"},
  {id:"grainWagon",name:"糧車沒有到",diamond:false,text:"在松原有家兵者需要送糧鑰匙並支付1糧維持；沒有成功送糧者回合末解散1個松原家兵。"},
  {id:"cityGate",name:"城門前擠滿了人",diamond:false,text:"花川→花京的免費進入暫停。花川或花京的可執行人物可花1地方行動治理；擲前可付1糧改為2D6取高，成功恢復。"},
  {id:"noSpring",name:"今年沒有春耕",diamond:true,text:"若◆有效，本次所有農莊不生產；其他產業、生育、資歷、老化與死亡照常。"}
];
const CRISIS_CARDS={
  start:{id:"crisisStart",name:"王座上的少年",text:"少年密林王試圖真正掌權；王叔仍掌握舊有勢力。玩家可以保持中立，也可以逐步做出政治承諾。",crisis:true},
  decision:{id:"decision",name:"少年的初次決斷",text:"危機正式進入公開政治階段。依照局部混洗規則，第一個未知節點即將出現。",crisis:true},
  gate:{id:"gate",name:"宮門前的沉默",text:"侍衛統領初始中立。支持任一方的家族可用交際爭取；最終可在危機控制區手動設定侍衛統領立場。",crisis:true},
  lamp:{id:"lamp",name:"燈火直到深夜",text:"機要大臣初始支持少年密林王。王叔方可嘗試策反；密林王方可防守。最終可在危機控制區手動設定機要大臣立場。",crisis:true},
  letter:{id:"letter",name:"來自松原的信",text:"王叔舊部初始支持王叔。密林王方只能把他爭取到中立，不能變成支持密林王。最終可在危機控制區手動設定其立場。",crisis:true},
  anger:{id:"anger",name:"少年密林王的怒火",text:"依三個節點目前立場判定：侍衛統領支持王叔→宮變；否則松原舊部仍支持王叔→逃往松原並公開叛亂；否則少年密林王成功收權。",crisis:true},
  banner:{id:"banner",name:"松原升起旗幟",text:"世界環境轉為【戰亂】。將1張普通戰亂事件與《旗幟來到花川》局部洗混，決戰前因此只會出現0或1張普通戰亂事件。",crisis:true},
  battle:{id:"battle",name:"旗幟來到花川",text:"進行最終決戰。第一測網站不擅自替玩家決定參戰者與保全；請使用統率骰工具結算，然後在危機控制區選擇勝方。",crisis:true}
};
