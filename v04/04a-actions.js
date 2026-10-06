function completeAction(label){const p=activePlayer();state.actionsTakenThisRound++;log(`${p.name}：${label}`);advanceAction();}
function advanceAction(){
  const n=state.players.length;let pos=state.activePlayerIndex;
  pos=(pos+1)%n;
  if(pos===state.firstPlayerIndex){state.actionRound++;if(state.actionRound>3){settleRound();return;}}
  state.activePlayerIndex=pos;renderGame();
}
function passAction(){completeAction("放棄主要行動");}
function fundraise(){const p=activePlayer();if(p.fundraiseUsed)return;p.fundraiseUsed=true;p.resources.money++;completeAction("籌款，錢幣 +1");}
function buyFood(){const p=activePlayer();if(p.resources.money<2)return;p.resources.money-=2;p.resources.food++;completeAction("購糧，支付2錢，糧食 +1");}
function openIndustryModal(){const p=activePlayer(),allowed=INDUSTRY_ALLOWED[p.root]||[];const avail=allowed.filter(t=>state.world.industrySupply[t]>0);showModal(`<h2>取得產業</h2><p>根基：${p.root}；支付2錢，不擲骰。家族產業上限3。</p><div class="button-row">${avail.map(t=>`<button class="secondary" onclick="acquireIndustry('${t}')">${t}（供應${state.world.industrySupply[t]}）</button>`).join("")||"沒有可取得的產業"}</div>`);}
function acquireIndustry(t){const p=activePlayer();if(p.resources.money<2||p.industries.length>=3||state.world.industrySupply[t]<=0)return;p.resources.money-=2;state.world.industrySupply[t]--;p.industries.push({id:`${p.familyId}-${Date.now()}`,type:t,region:p.root,skipNextProduction:false});closeModal();completeAction(`取得${t}@${p.root}`);}
function openTroopModal(){const p=activePlayer();const chars=p.characters.filter(c=>isExecutor(c)&&c.location===p.root&&c.actionsUsed<2);showModal(`<h2>整備家兵</h2><p>需要根基、至少1依附戶、當地可執行人物、1錢；不擲骰。</p>${selectCharButtons(chars,"prepareTroop")}`);}
function prepareTroop(id){const p=activePlayer(),c=charById(p,id);if(!c||p.resources.money<1||p.resources.dependents<1||p.resources.troops>=3)return;c.actionsUsed++;p.resources.money--;p.resources.troops++;p.troopsByRegion[p.root]=(p.troopsByRegion[p.root]||0)+1;closeModal();completeAction(`${c.id} 在${p.root}整備家兵 +1`);}
function openMoveModal(){const p=activePlayer();const chars=p.characters.filter(c=>isExecutor(c)&&(!c.moveUsed||c.location==="花川"));showModal(`<h2>人物移動（不消耗主要行動）</h2><p>每名人物每回合正常只有一次主動移動；可先移動，再執行需要到場的主要行動。已在花川者可免費進花京且不消耗這次主動移動。</p><div class="field"><label>人物</label><select id="move-char">${chars.map(c=>`<option value="${c.id}">${c.id}｜${c.location}${c.moveUsed?"｜已用主動移動":""}</option>`).join("")}</select></div><button class="primary" onclick="chooseMoveDestination()">下一步</button>`);}
function chooseMoveDestination(){const p=activePlayer(),id=document.getElementById("move-char").value,c=charById(p,id);let dest=[];
  if(c.location==="花川"){
    if(!state.world.flags.cityGate)dest.push("花京");
    if(!c.moveUsed)dest.push(...(ADJ["花川"]||[]));
  }else if(!c.moveUsed){
    if(c.location==="花京")dest=["花川"];else dest=ADJ[c.location]||[];
  }
  dest=dest.filter(d=>!edgeBlocked(c.location,d));
  showModal(`<h2>${c.id} 從 ${c.location} 移動</h2><div class="button-row">${dest.map(d=>`<button class="secondary" onclick="moveCharacter('${id}','${d}')">${d}${c.location==="花川"&&d==="花京"?"（免費進京）":""}</button>`).join("")||"目前沒有合法目的地"}</div><p class="footer-note">外地→花川使用正常主動移動；必須等之後自己的行動時機，才能再免費進花京。</p>`);
}
function edgeBlocked(a,b){const pair=new Set([a,b]);if(state.world.flags.mountainRoad&&pair.has("雙峰")&&pair.has("花川"))return true;if(state.world.flags.unsafeRoad&&pair.has("松原")&&pair.has("雙峰"))return true;return false;}
function moveCharacter(id,dest){const p=activePlayer(),c=charById(p,id);if(!c)return;const freeCapital=c.location==="花川"&&dest==="花京"&&!state.world.flags.cityGate;if(!freeCapital&&c.moveUsed)return;c.location=dest;if(!freeCapital)c.moveUsed=true;log(`${p.name} ${c.id} 移動至${dest}${freeCapital?"（免費進京）":""}`);closeModal();renderGame();}
