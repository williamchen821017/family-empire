function evaluateLegends(p){
  const aliveMales=p.characters.filter(c=>c.alive&&c.sex==="男"&&c.gen>0);const gens=new Set(p.characters.filter(c=>c.gen>0).map(c=>c.gen));const gameBorn=p.characters.some(c=>c.gameBorn);
  const branchLikely=aliveMales.filter(c=>c.gen>=2).length>=2;
  const flourish=gens.has(4)&&gameBorn&&branchLikely;
  const genQual={};p.characters.forEach(c=>{if(c.gen>0&&c.seniority>=3)genQual[c.gen]=true;});let illustrious=false;for(let g=1;g<=3;g++)if(genQual[g]&&genQual[g+1]&&genQual[g+2])illustrious=true;
  const marriageCount=p.politicalMarriages+(p.marriageTargets?.size||0);const marriage=marriageCount>=3;
  const wealth=p.industries.length>=3&&(p.resources.money+p.resources.food)>=8;
  return [
    {name:"枝繁葉茂",done:flourish,note:`4代:${gens.has(4)?"✓":"—"}　本局出生:${gameBorn?"✓":"—"}　兩支可續:${branchLikely?"暫判✓":"待檢"}`},
    {name:"世代顯達",done:illustrious,blocked:!illustrious,note:illustrious?"三個連續世代皆有資歷3+":"⚠ 目前任命通道可能不足"},
    {name:"家門相連",done:marriage,note:`重要政治婚姻／目標：約 ${marriageCount}/3；仍需跨至少兩代人工確認`},
    {name:"家業豐足",done:wealth,note:`產業 ${p.industries.length}/3；錢+糧 ${p.resources.money+p.resources.food}/8`}
  ];
}

function showFamilyModal(i){const p=state.players[i];showModal(`<h2>${p.name}</h2>${renderFamilyDetail(p)}`);}
function showDiceTool(){showModal(`<h2>能力判定工具</h2><div class="field"><label>能力值</label><select id="dice-ability">${[1,2,3,4,5].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>骰數</label><select id="dice-count"><option value="1">1D6</option><option value="2">2D6取高</option></select></div><button class="primary" onclick="runDiceTool()">擲骰</button><div id="dice-output"></div>`);}
function runDiceTool(){const a=+document.getElementById("dice-ability").value,n=+document.getElementById("dice-count").value,r=rollAbility(a,n);document.getElementById("dice-output").innerHTML=`<div class="dice-result ${resultClass(r.result)}">${r.rolls.join("、")} → ${r.roll}<br>${resultLabel(r.result)}</div>`;}
function editCrisisStances(){const c=state.world.crisis;showModal(`<h2>手動記錄危機節點結果</h2>${stanceField("guard","侍衛統領",c.guard,["neutral","king","uncle"])}${stanceField("minister","機要大臣",c.minister,["king","uncle"])}${stanceField("follower","松原舊部",c.follower,["uncle","neutral"])}<button class="primary" onclick="saveCrisisStances()">儲存</button>`);}
function stanceField(id,label,value,opts){return `<div class="field"><label>${label}</label><select id="stance-${id}">${opts.map(o=>`<option value="${o}" ${o===value?"selected":""}>${stanceText(o)}</option>`).join("")}</select></div>`;}
function saveCrisisStances(){const c=state.world.crisis;c.guard=document.getElementById("stance-guard").value;c.minister=document.getElementById("stance-minister").value;c.follower=document.getElementById("stance-follower").value;log(`危機立場更新：侍衛=${stanceText(c.guard)}、機要=${stanceText(c.minister)}、松原舊部=${stanceText(c.follower)}`);closeModal();renderGame();}
function showRules(){showModal(`<h2>V04 第一測速查</h2><ul><li>每家每回合3次主要行動，輪流一人一次。</li><li>可作一般執行人物：成年、壯年Ⅰ、壯年Ⅱ、老年；小孩／少年不可。</li><li>同一人物每回合最多2次需要人物的主要行動；正常主動移動最多1次。</li><li>有效◆順序：產業→生育→資歷→老化→原本已老年者死亡判定；新生兒不在同次◆老化。</li><li>第4次有效◆取得終局資格；若大危機未完，完成危機後才終局。</li><li>花京是花川子地點；外地不能一步直達花京。</li></ul><p class="footer-note">網站只自動處理已能明確程式化的規則；危機保全、背景NPC婚姻等仍需按牌面／桌上約定手動處理。</p>`);}
function showKnownIssues(){showModal(`<h2>目前批量壓力測試發現</h2><ol><li><strong>世代顯達：</strong>目前缺少足夠的 Lv2+ 任命通道，七家都沒有穩定路徑完成。</li><li><strong>家業豐足：</strong>2–3人局若專心衝產業，門檻非常容易達成；5人局才會被有限 Tile 明顯拉開。</li><li><strong>家族牌：</strong>48張在4–5人局以目前約12回合長度會抽乾，尚未定是否重洗棄牌。</li><li><strong>影響力：</strong>開局有2–4點，但現行已完成內容幾乎沒有合法消耗口。</li><li><strong>出生性別：</strong>尚未定生成方法；網站成功出生時暫記「?」，不自造機率。</li></ol>`);}
function showResultThen(done,r,label){showModal(`<h2>${label}</h2><div class="dice-result ${resultClass(r.result)}">${r.rolls.join("、")} → ${r.roll}<br>${resultLabel(r.result)}</div><div class="button-row" style="margin-top:10px"><button class="primary" id="result-ok">完成</button></div>`);document.getElementById("result-ok").onclick=()=>{closeModal();done();};}
function showEndGame(){const rows=state.players.map(p=>{const ls=evaluateLegends(p),n=ls.filter(x=>x.done).length;return `<tr><td>${p.name}</td><td>${n}</td><td>${ls.filter(x=>x.done).map(x=>x.name).join("、")||"無"}</td></tr>`;}).join("");showModal(`<h2>終局｜家族傳奇</h2><table class="small-table"><tr><th>家族</th><th>完成</th><th>傳奇</th></tr>${rows}</table><p>完成項目最多者勝；同數量共同勝利。至少1項的歷史站位門檻仍標【TEST】。</p><button class="secondary" onclick="exportLog()">匯出這局紀錄</button>`,true);}
function showModal(html,locked=false){const old=document.querySelector(".modal-backdrop");if(old)old.remove();const d=document.createElement("div");d.className="modal-backdrop";d.innerHTML=`<div class="modal">${html}${locked?"":`<div class="button-row" style="margin-top:14px"><button class="ghost" onclick="closeModal()">關閉</button></div>`}</div>`;document.body.appendChild(d);if(!locked)d.onclick=e=>{if(e.target===d)closeModal();};}
function closeModal(){document.querySelector(".modal-backdrop")?.remove();}
function exportLog(){if(!state)return;const payload={version:"V04-playtest",round:state.round,effectiveDiamonds:state.effectiveDiamonds,world:state.world.status,players:state.players.map(p=>({family:p.name,resources:p.resources,industries:p.industries,legends:evaluateLegends(p)})),log:state.log};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`family-empire-playtest-r${state.round}.json`;a.click();URL.revokeObjectURL(a.href);}

renderMenu();
