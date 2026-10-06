function renderOffices(){return `<div class="office-grid">${state.offices.map(o=>{let holder="背景NPC";if(o.open)holder="空缺・開放任命";else if(o.holderFamily){const p=familyById(o.holderFamily);holder=p?`${p.name}・${o.holderChar}`:"背景NPC";}else if(o.importantNpc)holder=o.id;return `<div class="office ${o.open?"open":""}"><strong>${o.name} Lv${o.level}</strong><span class="panel-sub">任命能力：${L.abilities[o.ability]}</span><div class="holder">${holder}</div></div>`;}).join("")}</div>`;}
function renderFamilyTabs(){return `<div class="family-tabs">${state.players.map((p,i)=>`<button class="family-tab ${i===state.activePlayerIndex?"active":""}" onclick="showFamilyModal(${i})">${p.name}</button>`).join("")}</div>`;}
function renderFamilyDetail(p){const legends=evaluateLegends(p);return `<div class="resource-row">${Object.entries(p.resources).map(([k,v])=>`<div class="resource"><span>${L.resources[k]}${k==="influence"?` <span class="test-chip">TEST</span>`:""}</span><b>${v}</b></div>`).join("")}</div>
  <div style="margin-top:10px"><strong>產業：</strong>${p.industries.map(i=>`${i.type}@${i.region}`).join("、")||"無"}</div>
  <div class="legend-grid" style="margin-top:10px">${legends.map(x=>`<div class="legend ${x.done?"done":x.blocked?"blocked":""}"><strong>${x.name}</strong><br>${x.note}</div>`).join("")}</div>
  <div class="characters">${p.characters.map(c=>renderCharacter(p,c)).join("")}</div>`;}
function renderCharacter(p,c){const abs=Object.entries(c.abilities||{}).map(([k,v])=>`<span class="ability">${L.abilities[k]} ${v}</span>`).join("");return `<div class="character ${c.alive?"":"dead"}"><div class="title"><span>${c.id}${c.title?`・${c.title}`:""}</span><span>${c.sex}</span></div><div class="meta">第${c.gen||"外"}代・${L.stages[c.stage]}・資歷${c.seniority||0}<br>位置：${c.location}　官職：${c.office||"—"}${c.marriedTo?`<br>配偶：${c.marriedTo}`:""}</div><div class="abilities">${abs||`<span class="ability">能力未啟用</span>`}</div></div>`;}
function renderActions(p){const can=state.phase==="actions"&&!state.ended;return `<div class="panel-sub">每家每回合3次主要行動，採輪流一人一次。需要人物的主要行動，同一人物每回合最多2次。</div><div class="action-grid" style="margin-top:8px">
  <button class="secondary" ${!can||p.fundraiseUsed?"disabled":""} onclick="fundraise()">家族｜籌款 +1錢</button>
  <button class="secondary" ${!can||p.resources.money<2?"disabled":""} onclick="buyFood()">地方｜購糧 2錢→1糧</button>
  <button class="secondary" ${!can||p.industries.length>=3||p.resources.money<2||p.eventMarkers.waterConflict?"disabled":""} onclick="openIndustryModal()">地方｜取得產業</button>
  <button class="secondary" ${!can||p.resources.money<1||p.resources.dependents<1||p.resources.troops>=3?"disabled":""} onclick="openTroopModal()">軍事｜整備家兵</button>
  <button class="secondary" ${!can?"disabled":""} onclick="openMoveModal()">免費操作｜人物移動</button>
  <button class="secondary" ${!can?"disabled":""} onclick="openTroopMoveModal()">軍事｜移動家兵</button>
  <button class="secondary" ${!can?"disabled":""} onclick="openAppointmentModal()">任官｜政務官空缺</button>
  <button class="secondary" ${!can?"disabled":""} onclick="openMarriageModal()">婚姻｜玩家家族通婚</button>
  <button class="secondary" ${!can||!state.world.currentEvent?.ability?"disabled":""} onclick="openEventResponseModal()">${state.world.currentEvent?.action||"事件"}｜應對本回合事件</button>
  <button class="ghost" ${!can?"disabled":""} onclick="passAction()">放棄這次行動</button>
</div>`;}
function renderHand(p){return `<div class="hand">${p.hand.map((c,i)=>`<div class="card"><strong>${c.name}</strong>${c.text}<div style="margin-top:6px"><button class="ghost" onclick="discardHandCard(${i})">棄置</button></div></div>`).join("")||"<span class='panel-sub'>沒有手牌</span>"}</div><p class="footer-note">從第2回合開始每回合抽1張，上限5。48張抽完後目前規則沒有重洗；網站會停抽並記錄警告。</p>`;}
function renderIndustrySupply(){return Object.entries(state.world.industrySupply).map(([k,v])=>`<span class="piece">${k} ×${v}</span>`).join(" ");}
