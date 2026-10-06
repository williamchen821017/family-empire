let state=null;
let setupState={count:null,seats:[],firstSeat:0,selectionOrder:[],cursor:0,chosen:{}};

function clone(v){return JSON.parse(JSON.stringify(v));}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function d6(){return Math.floor(Math.random()*6)+1;}
function rollAbility(value,dice=1){const rolls=Array.from({length:dice},d6);const roll=Math.max(...rolls);const row=ABILITY_TABLE[value]||ABILITY_TABLE[1];let result="failure";for(const k of ["failure","success","great","triumph"])if(row[k].includes(roll))result=k;return{rolls,roll,result};}
function resultLabel(r){return({failure:"失敗",success:"成功",great:"大成功",triumph:"凱旋"})[r]||r;}
function resultClass(r){return r==="failure"?"result-failure":r==="success"?"result-success":r==="great"?"result-great":"result-triumph";}
function isExecutor(c){return c&&c.alive&&GENERAL_EXECUTOR.has(c.stage);}
function familyById(id){return state.players.find(p=>p.familyId===id);}
function charById(p,id){return p.characters.find(c=>c.id===id);}
function activePlayer(){return state.players[state.activePlayerIndex];}
function log(msg){state.log.unshift(`R${state.round}・${msg}`);state.log=state.log.slice(0,220);}

function renderMenu(){
  app.innerHTML=`<div class="app-shell"><main class="menu"><section class="hero">
    <span class="badge">${L.prototype}</span><h1>${L.title}</h1><h2>${L.subtitle}</h2>
    <p>這是依目前 V04 已定規則重建的瀏覽器第一測。它不是最終遊戲：目前已知【世代顯達任命通道不足】、【影響力用途不足】、【4–5人局48張家族牌可能抽乾】等問題，網站會保留警示而不擅自補規則。</p>
    <div class="button-row"><button class="primary" onclick="renderCountSetup()">建立第一測</button><button class="secondary" onclick="showKnownIssues()">先看已知測試問題</button></div>
  </section></main></div>`;
}
function renderCountSetup(){
  app.innerHTML=`<main class="setup"><section class="hero"><h2>1. 選擇玩家人數</h2><p>第一測支援 2–5 人，同一台裝置輪流操作。</p><div class="button-row">${[2,3,4,5].map(n=>`<button class="secondary" onclick="beginFamilyDraft(${n})">${n} 人</button>`).join("")}</div></section></main>`;
}
function beginFamilyDraft(n){
  setupState.count=n;setupState.seats=Array.from({length:n},(_,i)=>`玩家 ${i+1}`);setupState.firstSeat=Math.floor(Math.random()*n);
  const actionOrder=Array.from({length:n},(_,k)=>(setupState.firstSeat+k)%n);
  setupState.selectionOrder=[...actionOrder].reverse();setupState.cursor=0;setupState.chosen={};renderFamilyDraft();
}
function renderFamilyDraft(){
  const seat=setupState.selectionOrder[setupState.cursor];
  const selectedIds=new Set(Object.values(setupState.chosen));
  app.innerHTML=`<main class="setup"><section class="hero"><h2>2. 選擇家族</h2>
    <p>本局第一玩家：<strong>玩家 ${setupState.firstSeat+1}</strong>。依規則由末位先選、第一玩家最後選。</p>
    <p>現在由 <strong>玩家 ${seat+1}</strong> 選擇。</p>
    <div class="family-picker">${Object.entries(FAMILY_DATA).map(([id,f])=>`<button class="family-choice ${selectedIds.has(id)?"selected":""}" ${selectedIds.has(id)?"disabled":""} onclick="draftFamily(${seat},'${id}')"><h3>${f.name}</h3><p>根基：${f.root}　官職：${f.office}</p><p>錢${f.resources.money}・糧${f.resources.food}・影響${f.resources.influence}・依附${f.resources.dependents}・家兵${f.resources.troops}</p><p>產業：${f.industries.join("／")}</p></button>`).join("")}</div>
    <div class="button-row" style="margin-top:16px"><button class="ghost" onclick="renderMenu()">取消</button></div>
  </section></main>`;
}
function draftFamily(seat,id){setupState.chosen[seat]=id;setupState.cursor++;if(setupState.cursor>=setupState.count)startGame();else renderFamilyDraft();}

function createFamilyDeck(){let deck=[];FAMILY_CARDS.forEach(c=>{for(let i=0;i<4;i++)deck.push({...c,instance:`${c.name}-${i}-${Math.random()}`});});return shuffle(deck);}
function buildEventDeck(){
  let deck=shuffle(TURMOIL_EVENTS.map(e=>({...e,type:"turmoil"})));
  const decision={...CRISIS_CARDS.decision,type:"crisis"};
  const pos=1+Math.floor(Math.random()*3);deck.splice(pos,0,decision);return deck;
}
function insertCrisisNext(card,minPos,maxPos){const pos=Math.min(state.world.eventDeck.length, Math.max(0,minPos-1+Math.floor(Math.random()*(maxPos-minPos+1))));state.world.eventDeck.splice(pos,0,{...card,type:"crisis"});}
function startGame(){
  const players=Array.from({length:setupState.count},(_,seat)=>{
    const familyId=setupState.chosen[seat],fd=FAMILY_DATA[familyId];
    return {seat,familyId,name:fd.name,root:fd.root,resources:clone(fd.resources),industries:fd.industries.map((type,i)=>({id:`${familyId}-start-${i}`,type,region:fd.root,skipNextProduction:false})),
      characters:fd.chars.map(c=>({...clone(c),controller:familyId})),hand:[],discard:[],fundraiseUsed:false,politicalMarriages:fd.politicalMarriages,marriageTargets:new Set(),relationshipKeys:[],tempPopulation:[],eventMarkers:{},troopsByRegion:{[fd.root]:fd.resources.troops},commitment:{side:null,level:0}};
  });
  const offices=clone(OFFICE_DATA);
  offices.forEach(o=>{if(o.holderFamily&&!players.some(p=>p.familyId===o.holderFamily)){o.holderFamily=null;o.holderChar=null;o.npc=true;}});
  state={players,round:1,firstPlayerIndex:setupState.firstSeat,activePlayerIndex:setupState.firstSeat,actionRound:1,phase:"actions",actionsTakenThisRound:0,officeContests:{},
    effectiveDiamonds:0,previousRoundEffectiveDiamond:false,world:{status:"動盪",eventDeck:buildEventDeck(),currentEvent:null,activeEvents:[],flags:{mountainRoad:false,unsafeRoad:false,cityGate:false},familyDeck:createFamilyDeck(),familyDiscard:[],industrySupply:clone(INDUSTRY_SUPPLY),crisis:{omitted:null,nodes:[],nextNodeIndex:0,guard:"neutral",minister:"king",follower:"uncle",route:null,resolved:false}},
    offices,log:[],ended:false,knownIssues:[]};
  state.players.forEach(p=>p.industries.forEach(i=>state.world.industrySupply[i.type]=Math.max(0,state.world.industrySupply[i.type]-1)));
  const nodes=shuffle([CRISIS_CARDS.gate,CRISIS_CARDS.lamp,CRISIS_CARDS.letter]);state.world.crisis.omitted=nodes.pop().id;state.world.crisis.nodes=nodes;
  state.players.forEach(p=>{for(let i=0;i<3;i++)drawFamilyCard(p,true);});
  log(`開局：${players.map(p=>p.name).join("、")}。三個危機節點暗中略去一張。`);
  beginRound(true);
}
function drawFamilyCard(p,setup=false){
  if(p.hand.length>=5&&!setup)return;
  if(!state.world.familyDeck.length){log(`⚠ 家族牌堆已抽乾，${p.name} 無牌可抽（目前規則尚未定重洗）。`);return;}
  p.hand.push(state.world.familyDeck.shift());
}
function beginRound(first=false){
  if(state.ended)return;
  state.phase="actions";state.actionRound=1;state.activePlayerIndex=state.firstPlayerIndex;state.actionsTakenThisRound=0;
  state.players.forEach(p=>{p.fundraiseUsed=false;p.characters.forEach(c=>{c.actionsUsed=0;c.moveUsed=false;});});
  if(!first)state.players.forEach(p=>{if(p.hand.length<5)drawFamilyCard(p);});
  drawWorldEvent();renderGame();
}
function drawWorldEvent(){
  if(!state.world.eventDeck.length){log("⚠ 世界事件牌堆已空；第一測尚未定義重洗。");state.world.currentEvent=null;return;}
  const e=state.world.eventDeck.shift();state.world.currentEvent=e;
  log(`世界事件：${e.name}${e.diamond?" ◆":""}`);
  if(e.id==="decision"){insertCrisisNext(state.world.crisis.nodes[0],2,4);}
  if(e.id===state.world.crisis.nodes[0]?.id){insertCrisisNext(state.world.crisis.nodes[1],2,3);}
  if(e.id===state.world.crisis.nodes[1]?.id){insertCrisisNext(CRISIS_CARDS.anger,1,3);}
  if(e.id==="anger")resolveAngerRoute();
  if(e.type==="war")state.world.status="戰亂";
  if(e.id==="mountainRoad")state.world.flags.mountainRoad=true;
  if(e.id==="unsafeRoad")state.world.flags.unsafeRoad=true;
  if(e.id==="cityGate")state.world.flags.cityGate=true;
  initializeEventMarkers(e);
}
function initializeEventMarkers(e){
  if(!e)return;
  if(e.id==="homeLetter")state.players.forEach(p=>{if(!p.characters.some(c=>c.controller===p.familyId&&isExecutor(c)&&c.location===p.root))p.eventMarkers.homeLetter=true;});
  if(e.id==="waterConflict")state.players.forEach(p=>p.eventMarkers.waterConflict=true);
  if(e.id==="creek")state.players.forEach(p=>{if(p.industries.some(i=>i.type==="農莊"))p.eventMarkers.creek=true;});
}
function resolveAngerRoute(){
  const c=state.world.crisis;
  if(c.guard==="uncle")c.route="coup";else if(c.follower==="uncle")c.route="rebellion";else c.route="king";
  if(c.route==="king"){log("危機路線：少年密林王成功收權。請完成結果牌與重整後手動標記危機完成。 ");}
  if(c.route==="coup")log("危機路線：宮變。請使用危機控制區與統率骰工具完成一次決定性對抗。 ");
  if(c.route==="rebellion"){
    state.world.status="戰亂";log("危機路線：王叔逃往松原，公開叛亂。世界轉為【戰亂】。");
    const ordinary={...WAR_EVENTS[Math.floor(Math.random()*WAR_EVENTS.length)],type:"war"};
    const pair=Math.random()<.5?[{...CRISIS_CARDS.battle,type:"crisis"},ordinary]:[ordinary,{...CRISIS_CARDS.battle,type:"crisis"}];
    state.world.eventDeck.unshift(...pair);state.world.eventDeck.unshift({...CRISIS_CARDS.banner,type:"crisis"});
  }
}
