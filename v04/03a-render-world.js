function renderGame(){
  const p=activePlayer();
  app.innerHTML=`<div class="app-shell"><header class="topbar"><div><h1>${L.title} <span class="badge">V04</span></h1><div class="top-status">第 ${state.round} 回合・${state.actionRound}/3 輪主要行動<br>目前：<strong>${p.name}</strong>　世界：${state.world.status}　有效◆ ${state.effectiveDiamonds}/4</div></div><div class="spacer"></div><button class="ghost" onclick="showRules()">規則速查</button><button class="ghost" onclick="showDiceTool()">骰表工具</button><button class="ghost" onclick="exportLog()">匯出紀錄</button><button class="danger-btn" onclick="renderMenu()">離開</button></header>
  <main class="game-layout"><div class="board-column">
    ${renderKnownIssueBanner()}<div class="world-grid"><section class="panel">${renderWorldEvent()}</section><section class="panel">${renderCrisisControl()}</section></div>
    <section class="panel"><h2>密林世界地圖</h2><div class="panel-sub">花京是花川子地點：相鄰地區不能直接進花京；已在花川者可免費進花京，但若本次行動才剛從外地進花川，同一次行動不能再免費進京。</div>${renderMap()}</section>
    <section class="panel"><h2>官職板</h2>${renderOffices()}</section>
    <section class="panel"><h2>家族狀態</h2>${renderFamilyTabs()}${renderFamilyDetail(p)}</section>
  </div><aside class="side-column"><section class="panel"><h3>目前行動</h3>${renderActions(p)}</section><section class="panel"><h3>${p.name} 手牌</h3>${renderHand(p)}</section><section class="panel"><h3>公共產業供應</h3>${renderIndustrySupply()}</section><section class="panel"><h3>測試紀錄</h3><div class="log">${state.log.map(x=>`<div class="log-entry">${x}</div>`).join("")}</div></section></aside></main></div>`;
}
function renderKnownIssueBanner(){return `<section class="panel warning"><strong>第一測已知缺口</strong><div class="panel-sub">①【世代顯達】現有內容缺少足夠 Lv2+ 任命通道，可能無法穩定完成。②【影響力】目前沒有足夠合法消耗口。③48張家族牌在4–5人局可能於終局前抽乾。這些暫不自動補規則。</div></section>`;}
function renderWorldEvent(){const e=state.world.currentEvent;if(!e)return `<h2>世界事件</h2><p>事件牌堆已空。</p>`;return `<h2>本回合事件</h2><article class="event-card ${e.crisis?"crisis":""} ${e.type==="war"?"war":""}"><div class="event-title"><span>${e.name}</span><span class="diamond">${e.diamond?"◆":""}</span></div><div class="rule-text">${e.text}</div></article>`;}
function renderCrisisControl(){const c=state.world.crisis;return `<h2>《王座上的少年》</h2><div class="panel-sub">本局暗中略去的節點：${state.world.currentEvent?.id==="anger"||c.resolved?({gate:"宮門前的沉默",lamp:"燈火直到深夜",letter:"來自松原的信"}[c.omitted]||"未揭示"):"未揭示"}</div>
  <table class="small-table"><tr><th>人物</th><th>目前立場</th></tr><tr><td>侍衛統領</td><td>${stanceText(c.guard)}</td></tr><tr><td>機要大臣</td><td>${stanceText(c.minister)}</td></tr><tr><td>松原舊部</td><td>${stanceText(c.follower)}</td></tr></table>
  <div class="button-row" style="margin-top:8px"><button class="secondary" onclick="editCrisisStances()">手動記錄節點結果</button>${canFinishCrisis()?`<button class="primary" onclick="finishCrisisManual()">完成危機結果／重整</button>`:""}</div>
  <p class="footer-note">危機節點可用網站骰表結算，但人物選擇、政治承諾、保全與清算仍以桌上規則為準；網站不擅自補未定細節。</p>`;}
function stanceText(v){return v==="king"?"密林王":v==="uncle"?"王叔":"中立";}
function canFinishCrisis(){const c=state.world.crisis;if(!c.route||c.resolved)return false;if(c.route==="rebellion")return state.world.currentEvent?.id==="battle";return true;}
function renderMap(){const regions=["松原","白樺坡","星原","雙峰","麥原","紅葉嶺","月狹道","花川","花京","果園谷","柳灣","蘆葦澤","柳岸"];return `<div class="map">${regions.map(r=>renderRegion(r)).join("")}</div>`;}
function renderRegion(r){
  let pieces=[];state.players.forEach(p=>{
    if(r===p.root)pieces.push(`<span class="piece root">${p.name}根基</span>`);
    if(r===p.root&&p.resources.dependents>0)pieces.push(`<span class="piece dep">${p.name}依附×${p.resources.dependents}</span>`);
    const tr=p.troopsByRegion?.[r]||0;if(tr>0)pieces.push(`<span class="piece troop">${p.name}家兵×${tr}</span>`);
    p.characters.filter(c=>c.alive&&c.location===r).forEach(c=>pieces.push(`<span class="piece person">${p.name} ${c.id}</span>`));
  });
  const cl=r==="花京"?"capital":OUTER_REGIONS.includes(r)?"outer":"";
  const allowed=INDUSTRY_ALLOWED[r];return `<div class="region ${cl}"><h4>${r}</h4><div class="small">${allowed?"產業："+allowed.join("／"):r==="花京"?"花川內的首都子地點":"不開一般產業"}</div><div class="piece-list">${pieces.join("")||`<span class="small">—</span>`}</div></div>`;
}
