(function () {
  'use strict';
  const G = window.Faultland, KEY = 'faultland-save-v1';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const color = {orange:'var(--orange)',blue:'var(--blue)',green:'var(--green)',purple:'var(--purple)',gold:'var(--orange)',gray:'#4d655b',red:'var(--red)'};
  const glyph = (id, tone = 'green') => window.GameArt.glyph(id,color[tone] || color.green);
  const icon = id => window.GameArt.icon(id);
  const rarity = item => G.RARITIES[item.rarity] || G.RARITIES.common;
  const shortNames = {shelter:'避难所',ruins:'废墟',market:'商店',water:'积水',anomaly:'裂隙',hospital:'医院',metro:'地铁',plant:'电厂',tower:'信号塔'};
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  let state, selected, selectedDie = 0, overlay = null, toastTimer, canSave = true;
  const PROFILE_KEY = 'faultland-achievements-v1', overlayStack = [];
  let unlocked = {};
  try { const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); for (const a of G.ACHIEVEMENTS) if (typeof saved?.[a.id] === 'string') unlocked[a.id] = saved[a.id]; } catch {}
  const COLLECTION_KEY='faultland-collection-v1', NOTIFICATION_KEY='faultland-achievement-notices-v1';
  let collection={cards:[],mutations:[]}, achievementTab='achievements', achievementStatus='all', achievementGroupFilter='all', collectionStatus='all', collectionRarity='all', collectionType='all', collectionQuery='', achievementQueue=[], achievementTimer, shownAchievement=null;
  try{const c=JSON.parse(localStorage.getItem(COLLECTION_KEY)||'{}');collection.cards=(Array.isArray(c.cards)?c.cards:[]).filter(id=>Object.hasOwn(G.CARDS,id));collection.mutations=(Array.isArray(c.mutations)?c.mutations:[]).filter(id=>Object.hasOwn(G.MUTATIONS,id));const q=JSON.parse(localStorage.getItem(NOTIFICATION_KEY)||'[]');if(Array.isArray(q))achievementQueue=[...new Set(q)].filter(id=>G.ACHIEVEMENTS.some(a=>a.id===id));}catch{}
  function achievementList(){
    const cardRarities=new Set(collection.cards.map(id=>G.CARDS[id].rarity)).size,legendaryCards=collection.cards.filter(id=>G.CARDS[id].rarity==='legendary').length;
    return G.achievements(state).map(a=>({...a,progress:a.field==='cardLibrary'?collection.cards.length:a.field==='mutationLibrary'?collection.mutations.length:a.field==='cardRarities'?Math.min(a.target,cardRarities):a.field==='legendaryCards'?Math.min(a.target,legendaryCards):a.progress}));
  }
  const achievementGroups={explore:{name:'探索',ids:['first_find','card_finder','explorer','core_keeper','dawn']},survive:{name:'生存',ids:['maker','first_production','awakened','first_upgrade','mastered_power']},combat:{name:'战斗',ids:['fighter','toxicologist','firekeeper','tool_until_breaks']},people:{name:'人际',ids:['helping_hand','betrayed','returned','field_aid','trader']},collection:{name:'收藏',ids:['card_library','mutation_library','rarity_spectrum','legendary_card']}};
  function achievementGroup(id){return Object.entries(achievementGroups).find(([,group])=>group.ids.includes(id))?.[0]||'explore';}
  function syncAchievements() {
    collection.cards=[...new Set([...collection.cards,...state.discovered.cards,...state.deck,...state.consumables])];
    collection.mutations=[...new Set([...collection.mutations,...state.discovered.mutations,...state.mutations])];
    const fresh=achievementList().filter(a=>a.progress>=a.target&&!unlocked[a.id]);
    for(const a of fresh){unlocked[a.id]=new Date().toISOString();achievementQueue.push(a.id);}
    try{localStorage.setItem(PROFILE_KEY,JSON.stringify(unlocked));localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));localStorage.setItem(NOTIFICATION_KEY,JSON.stringify(achievementQueue));}catch{canSave=false;}
  }
  function presentAchievement(){
    const box=$('achievement-notice'),a=G.ACHIEVEMENTS.find(a=>a.id===achievementQueue[0]);
    if(!a){box.classList.remove('visible');shownAchievement=null;return;}
    if(shownAchievement!==a.id){shownAchievement=a.id;box.innerHTML=`${glyph(a.icon)}<div><span>成就解锁</span><strong>${a.name}</strong><small>${a.desc}</small></div><button data-action="dismiss-achievement" aria-label="关闭成就通知">×</button>`;clearTimeout(achievementTimer);achievementTimer=setTimeout(dismissAchievement,6000);}
    (modal.open?modal:document.body).appendChild(box);box.classList.add('visible');
  }
  function dismissAchievement(){achievementQueue.shift();shownAchievement=null;clearTimeout(achievementTimer);try{localStorage.setItem(NOTIFICATION_KEY,JSON.stringify(achievementQueue));}catch{}presentAchievement();}
  function presentSurvival(){const box=$('survival-notice'),a=state.survivalAlert;box.classList.remove('warning','critical');if(!a){box.classList.remove('visible');return;}box.innerHTML=`${glyph(a.stat==='water'?'water':'hunger',a.severity==='critical'?'red':'orange')}<div><span>${a.severity==='critical'?'生存警报':'补给提醒'}</span><strong>${escape(a.title)}</strong><small>${escape(a.text)}</small></div><button data-action="dismiss-survival" aria-label="关闭生存提醒">×</button>`;(modal.open?modal:document.body).appendChild(box);box.classList.add('visible',a.severity);}
  function openOverlay(next) { if (overlay && overlay !== 'dismissed') overlayStack.push(overlay); overlay = next; renderOverlay(); }
  try { state = G.restore(localStorage.getItem(KEY)); } catch { canSave = false; }
  const firstVisit = !state;
  state ||= G.create(); selected = state.region?.position ?? state.position;
  const modal = $('modal');
  function mobileView(view, scroll = true) {
    if (!['explore', 'inventory', 'journal'].includes(view)) return;
    document.body.dataset.mobileView = view;
    document.querySelectorAll('[data-action="mobile-view"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === view)));
    if (scroll && window.matchMedia('(max-width: 740px)').matches) window.scrollTo({top:0,behavior:'instant'});
  }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); canSave = true; } catch { canSave = false; } $('save-note').textContent = canSave ? '◈ 进度自动保存在本机' : '◇ 当前浏览器无法存档，请勿关闭页面'; }
  function stat(id, label, symbol, tone) { const n = state[id],max=G.statCap(state,id); return `<div style="--vital-color:${n <= 20 ? 'var(--red)' : color[tone]}"><div class="vital-header"><span class="vital-title"><span class="symbol">${icon(symbol)}</span>${label}</span><span class="vital-number">${n} <span>/ ${max}</span></span></div><div class="bar" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${n}"><i style="--value:${n/max*100}%"></i></div></div>`; }
  function render() {
    $('world-clock').innerHTML = `<div class="day"><span>DAY</span> <b>${String(1 + Math.floor(state.turn / 12)).padStart(2,'0')}</b> <span>/ ${String(6 + (state.turn % 12)).padStart(2,'0')}:00</span></div><div class="clock-detail">${state.turn % 12 > 8 ? '黄昏将至' : '漫长的白昼'} · 行动 ${String(state.turn).padStart(3,'0')}</div>`;
    $('vitals').innerHTML = stat('hp','健康','heart','orange') + stat('food','饱食','hunger','gold') + stat('water','水分','water','blue') + stat('san','理智','brain','purple');
    $('energy').innerHTML=stat('energy','精力','energy','blue');
    const warnings = [['hp','健康危险'],['food','需要进食'],['water','需要饮水'],['san','濒临失控']].filter(([k]) => state[k] <= 20).map(([,t]) => t);if(state.weakness)warnings.push(`虚弱 ${['','I','II','III'][state.weakness]}${state.collapse!==null?` · ${state.collapse} 次行动后昏厥`:''}`);
    $('survival-warning').textContent = warnings.length ? '⚠ ' + warnings.join(' · ') : '';
    $('survivor-status').textContent = state.phase === 'dead' ? '信号消失' : state.phase === 'victory' ? '重见黎明' : warnings.length ? '状态不佳' : '尚存一息';
    $('scrap').textContent = `⚙ ${String(state.scrap).padStart(2,'0')}`;
    $('supplies').innerHTML=Object.entries(G.SUPPLY_EFFECTS).map(([id,[stat,n]])=>`<button class="supply" data-action="supply" data-id="${id}" aria-label="${G.ITEMS[id].name} ${state.supplies[id]} 份，${stat} +${n}" ${!['explore','combat'].includes(state.phase)||!state.supplies[id]||state[stat]>=G.statCap(state,stat)?'disabled':''}><span class="supply-count">×${state.supplies[id]}</span>${glyph(G.ITEMS[id].icon)}<span class="supply-name">${G.ITEMS[id].name}</span></button>`).join('');
    $('mutation-count').textContent=`${state.mutations.length} / ${Object.keys(G.MUTATIONS).length}`;
    $('mutations').innerHTML=state.mutations.map(id=>{const m=G.MUTATIONS[id],r=rarity(m),lv=G.mutationLevel(state,id);return `<button class="mutation-row mutation-link" data-action="detail" data-kind="mutation" data-id="${id}" style="--rarity-color:${r.color}">${glyph(m.icon,'purple')}<span>${m.name} <b class="rarity-label">${r.name}</b><small>${m.active?'主动 · 可生产卡牌':'被动 · 自动生效'} · Lv.${lv}/${m.maxLevel}</small></span></button>`;}).join('');
    renderMap();renderLocation();
    $('deck-count').textContent=`固有 ${state.deck.length} / 消耗 ${state.consumables.length}`;
    $('deck-preview').innerHTML=[...new Set(state.deck)].slice(0,5).map(id=>miniCard(id)).join('');
    $('cores').innerHTML = Array.from({length:3},(_,i) => `<span class="core-slot ${i < state.cores ? 'filled' : ''}">${i < state.cores ? glyph('core') : '◇'}</span>`).join('');
    $('core-count').textContent = `${state.cores} / 3`;
    document.querySelector('.mission-stamp').textContent = state.phase === 'victory' ? '已完成' : '待完成';
    $('objective-next').textContent = state.phase === 'victory' ? '✓ 信号恢复。你活到了黎明。' : state.cores === 3 ? '↗ 前往 F1 · 零号信号塔' : `↗ 探索灰雾，寻找剩余 ${3-state.cores} 处核心据点`;
    $('journal').innerHTML = state.logs.slice(0,12).map(l => `<div class="journal-entry ${escape(l.tone)}"><span class="time">DAY ${String(1+Math.floor(l.turn/12)).padStart(2,'0')} / ACT ${String(l.turn).padStart(3,'0')}</span><p>${escape(l.text)}</p></div>`).join('');
    $('seed-label').textContent = `世界种子 ${state.seed}`;
    save(); syncAchievements(); renderOverlay(); presentAchievement();presentSurvival();
  }
  const localInfo={entrance:['坍塌入口','shelter'],exit:['出口','arrow'],room:['废弃房间','ruins'],storage:['储物室','backpack'],boss:['核心守卫','anomaly']};
  function localAdjacent(i){const x=i%3,y=Math.floor(i/3);return [x>0?i-1:-1,x<2?i+1:-1,y>0?i-3:-1,y<2?i+3:-1].filter(n=>n>=0);}
  function renderMap(){
    const r=state.region,position=r?r.position:state.position,list=r?r.cells:state.map,nearby=r?localAdjacent(position):G.neighbors(position);
    $('map').classList.toggle('local-map',!!r);$('map').setAttribute('aria-label',r?r.name:'第七隔离区地图');
    $('map-title').textContent=r?'区域内部地图':'拾荒地图';
    document.querySelector('.axis-x').innerHTML=(r?['Ⅰ','Ⅱ','Ⅲ']:['A','B','C','D','E','F']).map(x=>`<span>${x}</span>`).join('');
    document.querySelector('.axis-x').classList.toggle('local-axis',!!r);
    $('map').innerHTML=list.map(t=>{const known=t.revealed,target=r?{name:localInfo[t.type][0],icon:localInfo[t.type][1],color:t.type==='boss'?'orange':'green'}:G.TERRAIN[t.type],here=t.id===position,next=nearby.includes(t.id);return `<button class="tile ${known?'':'fog'} ${here?'current':''} ${next?'reachable':''} ${t.id===selected?'selected':''} ${t.searched?'searched':''} ${t.cleared?'cleared':''} ${['hospital','metro','plant','tower','boss'].includes(t.type)?'landmark':''}" data-action="tile" data-id="${t.id}" ${known?'':'disabled'} aria-label="${r?'房间 '+(t.id+1):coord(t.id)} ${known?target.name:'未知区域'}${here?'，当前位置':''}${t.searched?'，已搜寻':''}" aria-pressed="${t.id===selected}"><span class="tile-coord">${r?t.id+1:coord(t.id)}</span>${known?glyph(target.icon,target.color)+`<span class="tile-name">${r?target.name:shortNames[t.type]}</span>`:'<span class="fog-mark">·</span>'}</button>`;}).join('');
    $('coordinates').textContent=r?`${r.name} / 房间 ${r.position+1}`:`坐标 ${coord(state.position)} / ${G.TERRAIN[state.map[state.position].type].name}`;
    $('explored').textContent=r?`已踏足 ${r.cells.filter(c=>c.visited).length} / 9`:`已发现 ${state.map.filter(t=>t.revealed).length} / 30`;
    $('region-exit').hidden=!r;
    if(r)$('region-exit').innerHTML=`<span>${G.canLeaveRegion(state)?'已找到出口，随时可以返回。':'入口坍塌：找到出口或踏遍全部房间后才能离开。'}</span><button class="secondary-button" data-action="leave-region" ${G.canLeaveRegion(state)&&state.phase==='explore'?'':'disabled'}>返回大地图</button>`;
  }
  function coord(i) { return String.fromCharCode(65+i%6) + (Math.floor(i/6)+1); }
  function miniCard(id, full = false) { const c = G.CARDS[id],r=rarity(c); return `<button data-action="detail" data-kind="card" data-id="${id}" class="mini-card rarity-${c.rarity}" style="--card-color:${color[c.color]};--rarity-color:${r.color}"><b class="rarity-label">${r.name}</b><div class="card-art">${glyph(c.icon,c.color)}</div><strong>${c.name}</strong><span>${full ? c.desc : c.category + ' / ' + c.school}</span>${full ? `<span>×${state.deck.filter(v => v === id).length} · ${c.rule}</span>` : ''}</button>`; }
  function renderLocation() {
    if(state.region){renderLocalLocation();return;}
    const t = state.map[selected], data = G.TERRAIN[t.type], here = selected === state.position, adjacent = G.neighbors(state.position).includes(selected), active = state.phase === 'explore';
    let actions;
    if (['dead','victory'].includes(state.phase)) actions = '<button class="primary-button" data-action="ending">查看本局结局 →</button>';
    else if (!here) actions = `<button class="primary-button" data-action="move" data-id="${selected}" ${!active || !adjacent ? 'disabled' : ''}>前往此区块 →</button><span class="action-hint">${adjacent ? '移动会消耗生存状态' : '只能移动到上下左右相邻区块'}</span>`;
    else if (t.type === 'shelter') actions = `<button class="primary-button" data-action="rest" ${!active || state.food < 8 || state.water < 10 || (state.hp === 100 && state.san === G.statCap(state,'san') && state.energy===G.statCap(state,'energy')) ? 'disabled' : ''}>休整 · 恢复健康、理智与精力</button><span class="action-hint">${state.hp === 100 && state.san === G.statCap(state,'san') ? '状态良好，选择相邻区块出发' : '−8 饱食 / −10 水分'}</span>`;
    else if(t.hasInterior)actions=`<button class="primary-button" data-action="enter-region" ${active?'':'disabled'}>进入区域内部 →</button><span class="action-hint">内部进度保留，找到出口才能返回。</span>`;
    else actions = `<button class="primary-button ${t.type === 'tower' ? 'danger-button' : ''}" data-action="search" ${!active || t.searched || (t.type === 'tower' && state.cores < 3) ? 'disabled' : ''}>${t.searched ? '区块已搜寻' : t.type === 'tower' ? '进入信号塔 →' : ['hospital','metro','plant'].includes(t.type) ? '深入据点 · 挑战守卫 →' : '搜寻物资 ↗'}</button><span class="action-hint">${t.type === 'tower' && state.cores < 3 ? '需要 3 枚异变核心' : t.searched ? '继续探索相邻区块' : '−2 饱食 / −3 水分 / ' + (t.type === 'anomaly' ? '−4' : '−1') + ' SAN'}</span>`;
    $('location').innerHTML = `<div class="location-top"><div class="location-title"><span class="location-icon">${glyph(data.icon,data.color)}</span><div><span class="tiny">${here ? '你的位置' : '目标区块'} / ${coord(selected)}</span><h3>${data.name}</h3></div></div><span class="location-tag">${t.cleared ? '已肃清' : data.kind}</span></div><p>${data.desc}</p><div class="location-actions">${actions}</div>`;
  }
  function renderLocalLocation(){
    const r=state.region,c=r.cells[selected],here=selected===r.position,adjacent=localAdjacent(r.position).includes(selected),[name,symbol]=localInfo[c.type],active=state.phase==='explore';
    const action=['dead','victory'].includes(state.phase)?'<button class="primary-button" data-action="ending">查看本局结算</button>':!here?`<button class="primary-button" data-action="move-local" data-id="${selected}" ${active&&adjacent?'':'disabled'}>前往房间 ${selected+1} →</button>`:`<button class="primary-button" data-action="search" ${active&&!c.searched?'':'disabled'}>${c.searched?'房间已查看':c.type==='boss'?'挑战核心守卫 →':'搜寻房间 →'}</button>`;
    $('location').innerHTML=`<div class="location-top"><div class="location-title">${glyph(symbol)}<div><span class="tiny">${r.name} / ${selected+1}</span><h3>${name}</h3></div></div><span class="location-tag">区域内部</span></div><div class="location-actions">${action}<span class="action-hint">${c.type==='boss'?'击败守卫，获得核心、补给和卡牌。':'移动 −3 饱食 / −4 水分 / −1 理智 / +6 精力'}</span></div>`;
  }
  function show(title, body, footer = '', eyebrow = 'SURVIVAL PROTOCOL', closable = true) {
    const preserveCombatScroll = !overlay && modal.open && modal.dataset.phase === 'combat' && state.phase === 'combat' && modal.dataset.round === String(state.combat.round);
    const combatScroll = preserveCombatScroll ? {top: modal.querySelector('.combat-zone')?.scrollTop || 0, left: modal.querySelector('.combat-hand')?.scrollLeft || 0} : null;
    modal.dataset.phase = overlay && overlay !== 'dismissed' ? 'menu' : state.searchResult ? 'loot' : state.reward ? 'reward' : state.attackNotice&&state.phase!=='combat' ? 'attack' : state.notice ? 'notice' : state.phase;
    modal.dataset.round = state.combat ? String(state.combat.round) : '';
    document.body.classList.add('dialog-open');
    const focused = document.activeElement?.dataset;
    const previous = focused ? { action: focused.action, id: focused.id } : null;
    $('modal-content').innerHTML = `<div class="modal-head"><div><div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2></div>${closable ? '<button class="close-button" data-action="close" aria-label="关闭弹窗">×</button>' : ''}</div>${body}${footer ? `<div class="modal-footer">${footer}</div>` : ''}`;
    if (!modal.open) modal.showModal();
    else if (previous?.action) {
      const match = Array.from(modal.querySelectorAll('button')).find(b => b.dataset.action === previous.action && b.dataset.id === previous.id && !b.disabled);
      (match || modal.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
    }
    presentAchievement();
    if (combatScroll) {
      modal.querySelector('.combat-zone').scrollTop = combatScroll.top;
      modal.querySelector('.combat-hand').scrollLeft = combatScroll.left;
    }
  }
  function close() {
    if (overlay && overlay !== 'dismissed') { overlay = overlayStack.pop() || null; renderOverlay(); return; }
    if (state.searchResult) { G.acknowledge(state,'searchResult');overlay=null;render();return; }
    if(state.reward){G.acknowledge(state,'reward');render();return;}
    if(state.attackNotice){G.acknowledge(state,'attackNotice');render();return;}
    if (state.notice) { G.acknowledge(state,'notice');render();return; }
    if (['combat','mutation','event'].includes(state.phase)) return;
    overlay = ['dead','victory'].includes(state.phase) ? 'dismissed' : null; modal.close();
  }
  function renderOverlay() {
    if (overlay && overlay !== 'dismissed') {
      if (typeof overlay === 'object') renderDetail(overlay.kind, overlay.id);
      else if (overlay === 'help') renderHelp();
      else if (overlay === 'new') renderNew();
      else if (overlay === 'craft') renderCraft();
      else if (overlay === 'deck' || overlay === 'inventory') renderInventory();
      else if (overlay === 'achievements') renderAchievements();
      else if (overlay === 'powers') renderPowers();
      return;
    }
    if (state.searchResult && ['explore','combat','event'].includes(state.phase)) { renderSearchResult(); return; }
    if(state.reward){renderReward();return;}
    if(state.attackNotice){renderAttackNotice();return;}
    if (state.notice) { renderNotice(); return; }
    if (state.phase === 'combat') { renderCombat(); return; }
    if (state.phase === 'mutation') { renderMutation(); return; }
    if (state.phase === 'event') { renderEvent(); return; }
    if (['dead','victory'].includes(state.phase) && overlay !== 'dismissed') { renderEnding(); return; }
    if (modal.open) modal.close();
  }
  function itemRow(kind, id, count, note = '') {
    const item = kind === 'card' ? G.CARDS[id] : G.ITEMS[id];
    return `<li><button class="loot-item" data-action="detail" data-kind="${kind}" data-id="${id}">${glyph(item.icon,item.color)}<div><strong>${item.name}</strong><span>${kind==='card'?`${rarity(item).name} · ${item.school}`:note || item.type} · 点击详情</span></div><b>+${count}</b></button></li>`;
  }
  function renderSearchResult() {
    const r = state.searchResult, place = G.TERRAIN[state.map[r.position].type].name+(r.localCell!==undefined?' / 房间 '+(r.localCell+1):'');
    const next = state.phase === 'combat' ? `搜寻惊动了${escape(state.combat.name)}，准备战斗！` : state.phase === 'event' ? `附近有动静：${G.EVENTS[state.event].title}。` : '收好物资后继续探索。一个地区可能连续发生多次遭遇。';
    show('搜寻收获', `<div class="modal-body loot-body"><p class="modal-copy">你在 <strong>${place} · ${coord(r.position)}</strong> 找到了：</p><ul class="loot-list">${itemRow('item','scrap',r.scrap)}${Object.entries(r.supplies).map(([id,n])=>itemRow('item',id,n)).join('')}${r.cards.map(id=>itemRow('card',id,1,'新发现的道具卡')).join('')}</ul><p class="loot-saved">✓ 全部收获已放入背包。点击物品查看用途。</p><p class="loot-encounter">${next}</p></div>`, `<button class="primary-button" data-action="close">确认收获 · ${state.phase === 'combat' ? '进入战斗' : state.phase === 'event' ? '查看遭遇' : '继续探索'} →</button>`, '这趟没白来');
  }
  function renderDetail(kind,id){
    if(kind==='mutation'){const m=G.MUTATIONS[id],r=rarity(m),lv=G.mutationLevel(state,id);show(m.name,`<div class="modal-body item-detail"><div class="detail-art">${glyph(m.icon,'purple')}</div><span class="detail-tag" style="--rarity-color:${r.color}">${r.name} · ${m.active?'主动异能':'被动异能'} · ${lv?`Lv.${lv}/${m.maxLevel}`:'尚未觉醒'}</span><p class="detail-description">${m.desc}</p>${m.levels?`<ol class="upgrade-list">${m.levels.map((text,i)=>`<li class="${lv>i?'active':''}"><b>Lv.${i+1}</b><span>${text}</span></li>`).join('')}</ol>`:''}${m.active&&lv?`<button class="primary-button" data-action="activate" data-id="${id}" ${G.canActivate(state,id)?'':'disabled'}>催发异能 · ${G.mutationCost(state,id)} 精力${state.phase==='combat'?' + 1 行动值':''}</button>`:''}<p class="modal-copy">战斗胜利后的异变节点可以觉醒新异能，或升级尚未满级的异能。</p></div>`,'<button class="primary-button" data-action="close">返回上一页</button>','身体里的另一种可能');return;}
    const card=kind==='card',item=card?G.CARDS[id]:G.ITEMS[id];if(!item){close();return;}
    const pocket=card&&item.consumable,owned=card?(pocket?state.consumables:state.deck).filter(c=>c===id).length:id==='scrap'?state.scrap:id==='core'?state.cores:state.supplies[id];
    const usable=!card&&Object.hasOwn(G.SUPPLY_EFFECTS,id),canUse=usable&&['explore','combat'].includes(state.phase)&&owned>0&&state[G.SUPPLY_EFFECTS[id][0]]<G.statCap(state,G.SUPPLY_EFFECTS[id][0]);
    show(item.name,`<div class="modal-body item-detail"><div class="detail-art">${glyph(item.icon,item.color)}</div><span class="detail-tag" style="--rarity-color:${card?rarity(item).color:''}">${card?`${rarity(item).name} · ${item.category} · ${item.school}`:item.type} · 持有 ${owned}</span><p class="detail-description">${item.desc}</p>${card?`<p class="detail-rule">${icon('dice')} ${item.rule}</p><p class="modal-copy">${pocket?(item.durability?`耐久卡会保留到耐久耗尽；每张新卡拥有 ${item.durability} 点完整耐久。`:'消耗卡放在随身卡包，使用后消失，未使用的会跨回合保留。'):'固有卡使用后进入弃牌堆，洗牌后继续使用，不会消失。'}</p>`:`<p class="modal-copy">${item.note}</p>`}<div class="detail-actions">${usable?`<button class="primary-button" data-action="detail-use" data-id="${id}" ${canUse?'':'disabled'}>使用一份</button>`:''}${pocket?`<button class="primary-button" data-action="pocket-use" data-id="${id}" ${G.canUsePocket(state,id)?'':'disabled'}>使用${item.durability?'一次':'一张'}</button>${state.event==='merchant'?`<button class="secondary-button" data-action="sell-card" data-id="${id}" ${owned?'':'disabled'}>出售一张 · ${item.sell} 零件</button>`:''}`:''}<button class="secondary-button" data-action="inventory">去往背包 ${icon('arrow')}</button><button class="secondary-button" data-action="craft">去往工作台 ${icon('wrench')}</button>${card&&!pocket?`<button class="secondary-button" data-action="salvage" data-id="${id}" ${owned>=2&&state.deck.length>5&&state.phase==='explore'?'':'disabled'}>分解多余的一张 · 获得 2 零件</button><small>保留同名卡至少 1 张、固有卡组至少 5 张。</small>`:''}</div></div>`,'<button class="primary-button" data-action="close">返回上一页</button>','捡来的，也有用处');
  }
  function pocketEffect(c){return c.effects?c.desc:c.stat?`${{food:'饱食',energy:'精力'}[c.stat]} +${c.amount}`:c.effect==='poison'?`中毒 +${c.amount}`:c.effect==='damage'?`伤害 ${c.amount}`:c.effect==='ignite'?`点燃 +${c.amount}`:c.effect==='shield'?`护盾 +${c.amount}`:c.effect==='stimulant'?`精力 +${c.amount} / 行动 +1`:'增加 2 枚骰子';}
  function pocketMarkup(){return `<div class="pocket-cards">${state.consumables.length?state.consumables.map((id,i)=>{const c=G.CARDS[id],r=rarity(c),uses=state.pocketUses?.[i]??c.durability??1;return `<div class="hand-slot" data-zone="pocket" data-index="${i}"><button class="pocket-card rarity-${c.rarity}" data-action="pocket-use" data-id="${id}" data-index="${i}" style="--rarity-color:${r.color}" ${G.canUsePocket(state,id,i)?'':'disabled'}><b class="rarity-label">${r.name}</b>${glyph(c.icon,c.color)}<strong>${c.name}</strong><span>${pocketEffect(c)}</span><small>${c.durability?`耐久 ${uses}/${c.durability}`:'消耗卡 · 使用后消失'}</small></button><button class="text-button" data-action="detail" data-kind="card" data-id="${id}">详情 / 交易</button>${grip(i,'pocket')}</div>`;}).join(''):'<p class="empty-pocket">卡包暂时为空。催发异能就能生产一张。</p>'}</div>`;}
  function abilityMarkup(){return `<div class="ability-cards">${state.mutations.filter(id=>G.MUTATIONS[id].active).map(id=>{const m=G.MUTATIONS[id],r=rarity(m),lv=G.mutationLevel(state,id);return `<button class="ability-card rarity-${m.rarity}" data-action="activate" data-id="${id}" style="--rarity-color:${r.color}" ${G.canActivate(state,id)?'':'disabled'}><b class="rarity-label">${r.name} · Lv.${lv}</b>${glyph(m.icon,'purple')}<strong>${m.name}</strong><span>生产 ${G.CARDS[m.produces].name}${lv>=3?' ×2':''}</span><small>${G.mutationCost(state,id)} 精力${state.phase==='combat'?' · 1 行动值':''}</small></button>`;}).join('')}<button class="ability-card recover-card" data-action="recover-energy" ${state.energy<G.statCap(state,'energy')&&['explore','combat'].includes(state.phase)&&(state.phase!=='combat'||state.combat.ap>0&&!state.combat.breathed)?'':'disabled'}>${glyph('brain','blue')}<strong>调整呼吸</strong><span>精力 +18</span><small>${state.phase==='combat'?'1 行动值 · 每回合一次':'耗时一步 · −2 饱食 / −3 水分'}</small></button></div>`;}
  function renderPowers(){show('异能工坊',`<div class="modal-body"><div class="power-meter">${stat('energy','全局精力','energy','blue')}</div><p class="modal-copy">精力随行动恢复。生产的消耗卡放入卡包，可在战斗内外使用或交易。</p>${abilityMarkup()}<h3 class="section-title">随身消耗卡 · ${state.consumables.length}</h3>${pocketMarkup()}</div>`,'<button class="primary-button" data-action="close">返回探索</button>','脑洞，也能填饱肚子');}
  function renderReward(){const r=state.reward;show(r.title,`<div class="modal-body loot-body"><p class="modal-copy">${escape(r.text)}</p><ul class="loot-list">${r.items.map(i=>itemRow(i.kind,i.id,i.count)).join('')}</ul><p class="loot-saved">✓ 已入包，确认和刷新不会重复发放。</p></div>`,`<button class="primary-button" data-action="close">确认收获 · ${state.phase==='mutation'?'选择异能':state.phase==='victory'?'查看结算':'继续冒险'} →</button>`,'战利品清单');}
  function attackPopupMarkup(){
    const a=state.attackNotice,blocked=Math.min(a.intent,a.shield);
    return `<div class="attack-popover-layer" role="alertdialog" aria-modal="true" aria-labelledby="attack-popover-title"><section class="attack-popover"><div class="attack-popover-head">${glyph('knife','orange')}<div><span>敌方行动</span><h3 id="attack-popover-title">${escape(a.enemy)}发动攻击</h3></div></div>${a.poisonTick||a.burnTick?`<p class="dot-receipt">回合开始：${a.poisonTick?`中毒 −${a.poisonTick}`:''}${a.poisonTick&&a.burnTick?' · ':''}${a.burnTick?`燃烧 −${a.burnTick}`:''}</p>`:''}<div class="attack-equation"><span>攻击 <b>${a.intent}</b></span><i>−</i><span>护盾 <b>${blocked}</b></span><i>=</i><span class="damage">受伤 <b>${a.damage}</b></span></div>${a.mind||a.starvation?`<p class="attack-extra">${a.mind?`SAN −${a.mind}`:''}${a.mind&&a.starvation?' · ':''}${a.starvation?`饥渴伤害 −${a.starvation}`:''}</p>`:''}<div class="attack-health"><span>健康 ${a.hpBefore}</span>${icon('arrow')}<strong>${a.hpAfter}</strong></div><button class="primary-button" data-action="close">${state.phase==='dead'?'查看本局结算':'继续战斗'} →</button></section></div>`;
  }
  function renderAttackNotice(){if(state.phase==='combat'){renderCombat();return;}show('敌方最后一击',`<div class="modal-body">${attackPopupMarkup()}</div>`,'','敌方行动报告',false);}
  function grip(index, zone) { return `<button class="card-grip" data-index="${index}" data-zone="${zone}" aria-label="拖动第 ${index+1} 张卡牌排序，也可按左右方向键">⠿ <span>拖动排序</span></button>`; }
  function renderInventory() {
    show('拾荒者的全部家当', `<div class="modal-body"><p class="modal-copy">${state.deck.length} 张固有卡和 ${state.consumables.length} 张消耗卡。点击查看详情；拖动手柄整理卡组，战斗时也能整理手牌。</p><div class="inventory-items">${Object.entries(G.ITEMS).map(([id,i])=>`<button data-action="detail" data-kind="item" data-id="${id}">${glyph(i.icon)}<strong>${i.name}</strong><span>×${id==='scrap'?state.scrap:id==='core'?state.cores:state.supplies[id]}</span></button>`).join('')}</div><p class="modal-copy">${state.phase==='explore'?'拖动卡组只改变排列，战斗开始时仍会洗牌。':'当前遭遇中可查看卡组，结束遭遇后可整理。'}</p><h3 class="section-title">固有卡牌 · 使用后循环</h3><div class="deck-full">${state.deck.map((id,i)=>`<div class="hand-slot" data-index="${i}" data-zone="deck">${miniCard(id)}${state.phase==='explore'?grip(i,'deck'):''}</div>`).join('')}</div><h3 class="section-title">消耗卡牌 · 用一张少一张</h3>${pocketMarkup()}<h3 class="section-title">催发异能</h3>${abilityMarkup()}</div>`, '<button class="secondary-button" data-action="craft">去往工作台</button><button class="primary-button" data-action="close">整理完毕</button>', '口袋里的底气');
  }
  function applyCollectionSearch(value=collectionQuery){
    const input=$('collection-search');if(!input)return;collectionQuery=value;const query=value.trim().toLocaleLowerCase();let visible=0;
    modal.querySelectorAll('.collection-card').forEach(card=>{card.hidden=Boolean(query&&!card.dataset.search.includes(query));if(!card.hidden)visible++;});
    const count=$('collection-visible');if(count)count.textContent=`当前显示 ${visible} 项`;let empty=$('collection-search-empty');
    if(!visible&&modal.querySelector('.collection-card')){if(!empty){empty=document.createElement('div');empty.id='collection-search-empty';empty.className='collection-empty';empty.innerHTML=`${glyph('eye')}<strong>没有找到对应记录</strong><span>换个名称、流派或效果关键词试试。</span>`;modal.querySelector('.collection-grid')?.appendChild(empty);}}else empty?.remove();
  }
  function renderAchievements(){
    const allAchievements=achievementList(),completed=allAchievements.filter(a=>unlocked[a.id]).length;
    const tabData=[['achievements','成就',`${completed}/${allAchievements.length}`],['cards','卡牌',`${collection.cards.length}/${Object.keys(G.CARDS).length}`],['mutations','异能',`${collection.mutations.length}/${Object.keys(G.MUTATIONS).length}`]];
    const tabs=`<div class="collection-tabs">${tabData.map(([id,name,count])=>`<button data-action="achievement-tab" data-id="${id}" aria-pressed="${achievementTab===id}"><span>${name}</span><b>${count}</b></button>`).join('')}</div>`;
    let body='';
    if(achievementTab==='achievements'){
      const percent=Math.round(completed/allAchievements.length*100),next=allAchievements.filter(a=>!unlocked[a.id]).sort((a,b)=>b.progress/b.target-a.progress/a.target)[0];
      const filtered=allAchievements.filter(a=>(achievementStatus==='all'||(achievementStatus==='unlocked')===Boolean(unlocked[a.id]))&&(achievementGroupFilter==='all'||achievementGroup(a.id)===achievementGroupFilter));
      const statusFilters=[['all','全部'],['unlocked','已解锁'],['locked','进行中']],groupFilters=[['all','全部类别'],...Object.entries(achievementGroups).map(([id,group])=>[id,group.name])];
      body=`<section class="collection-dashboard achievement-dashboard"><div class="completion-ring" style="--completion:${percent*3.6}deg"><div><strong>${percent}%</strong><span>完成度</span></div></div><div class="dashboard-copy"><span class="eyebrow">ACHIEVEMENT RECORD</span><h3>${completed===allAchievements.length?'整本手记已经写满':next?`下一枚徽记：${next.name}`:'继续在废土留下记录'}</h3><p>解锁记录跨局保存；未完成项目显示本局或累计进度。</p><div class="dashboard-metrics"><span><b>${completed}</b><small>已解锁</small></span><span><b>${allAchievements.length-completed}</b><small>待完成</small></span><span><b>${Object.keys(achievementGroups).length}</b><small>成就类别</small></span></div></div></section><div class="filter-stack"><div class="filter-row" aria-label="成就状态">${statusFilters.map(([id,name])=>`<button class="filter-chip" data-action="achievement-status" data-id="${id}" aria-pressed="${achievementStatus===id}">${name}</button>`).join('')}</div><div class="filter-row" aria-label="成就类别">${groupFilters.map(([id,name])=>`<button class="filter-chip secondary-filter" data-action="achievement-group" data-id="${id}" aria-pressed="${achievementGroupFilter===id}">${name}</button>`).join('')}</div></div><div class="result-line"><strong>${filtered.length} 项记录</strong><span>永久徽记不会因重新开局消失</span></div><div class="achievement-grid">${filtered.length?filtered.map(a=>{const done=Boolean(unlocked[a.id]),group=achievementGroups[achievementGroup(a.id)],value=done?a.target:a.progress,p=Math.min(100,Math.round(value/a.target*100)),date=done?new Date(unlocked[a.id]).toLocaleDateString('zh-CN'):'';return `<article class="achievement ${done?'unlocked':''}"><div class="achievement-emblem">${glyph(a.icon)}<span>${done?'✓':'◇'}</span></div><div class="achievement-copy"><div class="achievement-title"><span>${group.name}</span><h3>${a.name}</h3></div><p>${a.desc}</p><div class="achievement-progress"><span>${done?`解锁于 ${date}`:`${value} / ${a.target}`}</span><b>${done?'完成':`${p}%`}</b></div><progress value="${value}" max="${a.target}" aria-label="${a.name}"></progress></div></article>`;}).join(''):`<div class="collection-empty">${glyph('journal')}<strong>这里暂时没有符合条件的记录</strong><span>换一个分类继续查看。</span></div>`}</div>`;
    }else{
      const cards=achievementTab==='cards',defs=cards?G.CARDS:G.MUTATIONS,known=collection[achievementTab],knownSet=new Set(known),entries=Object.entries(defs),total=entries.length,percent=Math.round(known.length/total*100);
      const rarityStats=Object.entries(G.RARITIES).map(([id,r])=>({id,r,total:entries.filter(([,item])=>item.rarity===id).length,known:entries.filter(([key,item])=>item.rarity===id&&knownSet.has(key)).length}));
      const typeValues=cards?[...new Set(entries.map(([,item])=>item.school))].sort((a,b)=>a.localeCompare(b,'zh-CN')).map(id=>[id,id]):[['active','主动异能'],['passive','被动异能']];
      const filtered=entries.filter(([id,item])=>(collectionStatus==='all'||(collectionStatus==='known')===knownSet.has(id))&&(collectionRarity==='all'||item.rarity===collectionRarity)&&(collectionType==='all'||(cards?item.school===collectionType:(collectionType==='active')===Boolean(item.active)))).sort((a,b)=>Number(knownSet.has(b[0]))-Number(knownSet.has(a[0]))||Object.keys(G.RARITIES).indexOf(a[1].rarity)-Object.keys(G.RARITIES).indexOf(b[1].rarity));
      const visible=filtered.filter(([,item])=>!collectionQuery.trim()||`${item.name} ${item.desc} ${item.school||''} ${rarity(item).name}`.toLocaleLowerCase().includes(collectionQuery.trim().toLocaleLowerCase())).length;
      body=`<section class="collection-dashboard"><div class="completion-ring" style="--completion:${percent*3.6}deg"><div><strong>${percent}%</strong><span>收集率</span></div></div><div class="dashboard-copy"><span class="eyebrow">${cards?'SCAVENGED CARD ARCHIVE':'MUTATION OBSERVATORY'}</span><h3>${known.length} / ${total} ${cards?'张卡牌':'项异能'}</h3><p>${cards?'拾取、战利品、交易与异能生产都会写入图鉴。':'异变节点觉醒后永久登记，等级仍以当前轮回为准。'}</p></div></section><div class="rarity-ledger">${rarityStats.map(x=>`<button data-action="collection-rarity" data-id="${x.id}" aria-pressed="${collectionRarity===x.id}" style="--rarity-color:${x.r.color}"><span>${x.r.name}</span><strong>${x.known}/${x.total}</strong><i><b style="width:${x.total?x.known/x.total*100:0}%"></b></i></button>`).join('')}</div><div class="collection-tools"><label class="collection-search">${icon('eye')}<input id="collection-search" type="search" value="${escape(collectionQuery)}" placeholder="搜索名称、流派或效果" autocomplete="off"></label><div class="collection-selects"><div class="filter-row">${[['all','全部'],['known','已收集'],['missing','未收集']].map(([id,name])=>`<button class="filter-chip" data-action="collection-status" data-id="${id}" aria-pressed="${collectionStatus===id}">${name}</button>`).join('')}</div><label><span>${cards?'流派':'类型'}</span><select id="collection-type"><option value="all">全部${cards?'流派':'类型'}</option>${typeValues.map(([id,name])=>`<option value="${escape(id)}" ${collectionType===id?'selected':''}>${name}</option>`).join('')}</select></label></div></div><div class="result-line"><strong id="collection-visible">当前显示 ${visible} 项</strong><span>点击已收集项目查看完整详情</span></div><div class="collection-grid">${filtered.length?filtered.map(([id,item])=>{const r=rarity(item),isKnown=knownSet.has(id),search=`${item.name} ${item.desc} ${item.school||''} ${r.name}`.toLocaleLowerCase(),hidden=collectionQuery.trim()&&!search.includes(collectionQuery.trim().toLocaleLowerCase());return `<button class="collection-card rarity-${item.rarity} ${isKnown?'collected':'undiscovered'}" data-action="detail" data-kind="${cards?'card':'mutation'}" data-id="${id}" data-search="${escape(search)}" style="--rarity-color:${r.color}" ${isKnown?'':'disabled'} ${hidden?'hidden':''}><b class="rarity-label">${r.name}</b><span class="collection-art">${isKnown?glyph(item.icon,cards?item.color:'purple'):glyph('question')}</span><strong>${item.name}</strong><span>${cards?`${item.category} · ${item.school}`:`${item.active?'主动':'被动'} · 最高 Lv.${item.maxLevel}`}</span><small>${isKnown?'✓ 已登记 · 查看详情':cards?'尚未收集':'尚未觉醒'}</small></button>`;}).join(''):`<div class="collection-empty">${glyph('backpack')}<strong>这个筛选下没有记录</strong><span>调整稀有度或收集状态再看看。</span></div>`}</div>`;
    }
    show('拾荒成就册',`<div class="modal-body collection-book">${tabs}${body}</div>`,`<button class="primary-button" data-action="dismiss-achievements">${['dead','victory'].includes(state.phase)?'关闭成就页 · 回看废土':'收好成就册 · 返回游戏'}</button>`,'走过的路，不会白走');
    if(achievementTab!=='achievements')applyCollectionSearch(collectionQuery);
  }
  function renderNotice() {
    const n=state.notice;
    show(n.title, `<div class="modal-body"><div class="event-portrait ${n.tone}">${glyph(n.tone==='danger'?'shield':'heart')}</div><p class="modal-copy">${escape(n.text)}</p>${n.items.length?`<ul class="loot-list">${n.items.map(i=>itemRow(i.kind,i.id,i.count)).join('')}</ul>`:''}</div>`, '<button class="primary-button" data-action="close">记下这次相遇 · 继续探索 →</button>', '废土上的人与事');
  }
  function renderHelp() {
    show('废土生存指南', `<div class="modal-body"><div class="help-grid"><div><h3>01 / 探索区块</h3><p>点击亮起的相邻区块，再点击「前往此区块」。进入后搜寻物资，可能遇见怪物或异常事件。迷雾会随你的脚步揭开；普通区块物资只能搜寻一次，但可能连续发生战斗、商人和选择事件。医院、地铁和部分废墟会进入内部小地图，踏进出口会直接返回大地图。</p></div><div><h3>02 / 照顾自己</h3><p>饱食或饮水降到 20 时会提醒；归零后每次行动分别损失 5 / 8 健康并叠加虚弱。虚弱 II 减少骰子，虚弱 III 减少行动值并启动昏厥倒计时。补回食物和水可以中止倒计时。</p></div><div><h3>03 / 把运气变成武器</h3><p>战斗每回合抽 5 张卡、投 3 枚六面骰。固有卡消耗骰子并循环；普通消耗卡使用后消失，耐久卡可以连续使用。中毒与燃烧在敌方行动前结算；流血随直接攻击触发，减速会压低敌方意图。敌方攻击只显示中央小窗。</p></div><div><h3>04 / 从拾荒者到异能者</h3><p>第 1、3、5、7、9 次击败怪物可从四项异变中觉醒或升级一项。当前 ${Object.keys(G.CARDS).length} 张卡牌分为十种流派和五档稀有度；${Object.keys(G.MUTATIONS).length} 项异能中包含主动生产与被动强化。</p></div></div><div class="help-note">搜寻有机会发现卡牌，或遇到 ${Object.keys(G.EVENTS).length} 类商人、救助、交换与异常事件。救人可能遭到背叛，也可能在之后收到回报。卡牌和异能收集库按实际内容量自动扩展。精力基础上限 100，随行动恢复，部分异能可提高上限。</div></div>`, '<button class="primary-button" data-action="close">我准备好了 · 进入废土 →</button>', '欢迎来到《我在末世捡垃圾》');
  }
  function renderNew() { show('开始新的轮回', '<div class="modal-body"><p class="modal-copy">当前这一局将被替换。下一张地图、下一次遭遇，也许会给你一个不同的明天。</p><label class="input-label" for="new-seed">世界种子（可选，留空随机生成）</label><input class="seed-input" id="new-seed" maxlength="32" placeholder="例如：最后一罐桃子" autocomplete="off"></div>', '<button class="secondary-button" data-action="close">继续当前一局</button><button class="primary-button" data-action="confirm-new">踏入新的废土 →</button>', 'ANOTHER LIFE'); }
  function renderCraft() {
    show('临时工作台', `<div class="modal-body"><p class="modal-copy" style="margin-bottom:18px">可用零件：${state.scrap}。${state.phase!=='explore'?'当前遭遇结束后才能制作。':''}废土上的每一件垃圾，都有第二次生命。</p><div class="recipe-list">${[['food','罐头','饱食 +35',3,'food'],['water','净水','水分 +35',3,'bottle'],['med','急救包','健康 +30',4,'med'],['coffee','浓缩咖啡','精力 +30',4,'coffee'],['molotov','燃烧瓶卡牌','直接伤害并附加燃烧；固有卡',6,'firebottle'],['venom_ampoule','浓缩毒囊','附加 10 层中毒；消耗卡',5,'toxin'],['reinforced_crowbar','异化撬棍','9 点伤害；耐久 3',8,'crowbar'],['firestarter','防风打火机','引燃燃料；耐久 3',7,'lighter'],['armor_plate','骨质护甲片','护盾 +10；耐久 2',7,'armor']].map(([id,name,desc,cost,icon]) => `<div class="recipe">${glyph(icon)}<div><h3>${name}</h3><p>${desc}</p><button class="secondary-button" data-action="make" data-id="${id}" ${state.scrap < cost || state.phase !== 'explore' ? 'disabled' : ''}>${cost} 零件 · 制作</button></div></div>`).join('')}</div></div>`, '<button class="primary-button" data-action="close">收起工具</button>', 'MAKE SOMETHING OUT OF NOTHING');
  }
  const pipPositions = {1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
  function dieMarkup(value,index) { return `<button class="die ${index === selectedDie ? 'selected' : ''} ${value ? '' : 'used'}" data-action="die" data-id="${index}" aria-label="骰子 ${index+1}：${value || '已使用'}${index === selectedDie ? '，已选中' : ''}" aria-pressed="${index === selectedDie}" ${!value ? 'disabled' : ''}>${value ? pipPositions[value].map(p => `<i class="pip" style="grid-column:${(p-1)%3+1};grid-row:${Math.ceil(p/3)}"></i>`).join('') : '—'}</button>`; }
  function renderCombat() {
    const b = state.combat;
    if (!b.dice[selectedDie]) selectedDie = b.dice.findIndex(Boolean);
    const die = b.dice[selectedDie] || 0;
    const cards = b.hand.map((id,i) => { const c=G.CARDS[id],r=rarity(c),parity=c.effects?.find(e=>['parityDamage','parityShield'].includes(e.kind))?.parity,energyCost=c.effects?.find(e=>e.kind==='energyCost')?.base||0,enabled=die>=c.min&&(!parity||die%2===(parity==='odd'?1:0))&&state.energy>=energyCost&&(id!=='spark'||state.san>3)&&(id!=='dice_rig'||b.dice.filter(Boolean).length<6); return `<div class="hand-slot" data-index="${i}" data-zone="hand"><button class="combat-card school-${c.school} rarity-${c.rarity}" data-action="play" data-id="${i}" style="--card-color:${color[c.color]};--rarity-color:${r.color}" ${enabled ? '' : 'disabled'} aria-label="${c.name}，${c.desc}，${c.rule}"><span class="card-type">${r.name} / ${c.school}</span><span class="card-art">${glyph(c.icon,c.color)}</span><h3>${c.name}</h3><span class="card-desc">${c.desc}</span><span class="card-rule">${c.rule}${id === 'spark' && state.san <= 3 ? ' · SAN 不足' : energyCost>state.energy?' · 精力不足':''}</span></button>${grip(i,'hand')}</div>`; }).join('');
    const pocketCards = state.consumables.map((id,i) => { const c=G.CARDS[id],r=rarity(c),uses=state.pocketUses?.[i]??c.durability??1,enabled=G.canUsePocket(state,id,i);return `<div class="hand-slot pocket-slot" data-index="${i}" data-zone="pocket"><button class="combat-card consumable-combat-card school-${c.school} rarity-${c.rarity}" data-action="pocket-use" data-id="${id}" data-index="${i}" style="--card-color:${color[c.color]};--rarity-color:${r.color}" ${enabled?'':'disabled'} aria-label="${c.name}，${c.desc}"><span class="card-type">${r.name} / ${c.school}</span><span class="card-art">${glyph(c.icon,c.color)}</span><h3>${c.name}</h3><span class="card-desc">${c.desc}</span><span class="card-rule">无需骰子 · ${c.durability?`耐久 ${uses}/${c.durability}`:'使用后消失'}</span></button>${grip(i,'pocket')}</div>`;}).join('');
    const latest = state.logs[0];
    const poisonWidth=Math.min(b.poison,b.hp)/b.maxHp*100,poisonLeft=(b.hp-Math.min(b.poison,b.hp))/b.maxHp*100;
    const statuses=`${b.poison?`<span class="status-chip poison">中毒 ${b.poison}</span>`:''}${b.fuel?`<span class="status-chip fuel">燃料 ${b.fuel}</span>`:''}${b.burn?`<span class="status-chip burn">燃烧 ${b.burn}</span>`:''}${b.bleed?`<span class="status-chip bleed">流血 ${b.bleed}</span>`:''}${b.slow?`<span class="status-chip slow">减速 ${b.slow}</span>`:''}${b.vulnerable?`<span class="status-chip vulnerable">易伤 ${b.vulnerable}</span>`:''}`;
    show('异变接触', `<div class="combat-zone"><div class="enemy-stage"><div class="enemy-art" aria-hidden="true"><img src="assets/mutant.png" alt="盘踞废墟的异变体"></div><div class="enemy-info"><div class="eyebrow">${b.kind === 'tower' ? 'THE FINAL ECHO' : b.kind === 'normal' ? 'HOSTILE DETECTED' : 'CORE GUARDIAN'} / ROUND ${String(b.round).padStart(2,'0')}</div><h3>${escape(b.name)}</h3><div class="enemy-hp"><div class="bar"><i class="enemy-health-fill" style="--value:${b.hp/b.maxHp*100}%"></i>${b.poison?`<i class="enemy-poison-fill" style="--poison-left:${poisonLeft}%;--poison-width:${poisonWidth}%"></i>`:''}</div><span>${b.hp} / ${b.maxHp}</span></div><div class="enemy-statuses">${statuses||'<span class="status-chip clear">无持续状态</span>'}</div><div class="enemy-intent">↯ 敌方意图：下回合造成 <b>${b.intent}</b> 伤害${state.weakness?`，虚弱使伤害 +${state.weakness*2}`:''}${b.mind ? `，以及 ${b.mind} SAN 损失` : ''}</div></div></div><div class="combat-player"><span class="hp">♡ 健康 <strong>${state.hp}</strong></span><span class="san">✧ SAN <strong>${state.san}</strong></span><span class="armor">◇ 护盾 <strong>${b.shield}</strong></span>${state.weakness?`<span class="weakness">▽ 虚弱 <strong>${['','I','II','III'][state.weakness]}</strong></span>`:''}<button data-action="supply" data-id="med" ${!state.supplies.med || state.hp === 100 ? 'disabled' : ''}>急救 +30（${state.supplies.med}）</button><span class="combat-meters">饱食 ${state.food} / 水分 ${state.water}${state.collapse!==null?` · ${state.collapse} 次行动后昏厥`:''}</span><button data-action="supply" data-id="food" ${!state.supplies.food || state.food === 100 ? 'disabled' : ''}>罐头（${state.supplies.food}）</button><button data-action="supply" data-id="water" ${!state.supplies.water || state.water === 100 ? 'disabled' : ''}>净水（${state.supplies.water}）</button></div><div class="battle-energy"><span>${icon('energy')} 精力 <b>${state.energy}/${G.statCap(state,'energy')}</b></span><span>行动值 <b>${b.ap}/3</b></span><button class="secondary-button" data-action="supply" data-id="coffee" ${state.supplies.coffee&&state.energy<G.statCap(state,'energy')?'':'disabled'}>咖啡 +30（${state.supplies.coffee}）</button></div><div class="dice-section"><div><div class="dice-label">命运骰子 <span>选择一枚，驱动道具</span></div><div class="dice-tray">${b.dice.map(dieMarkup).join('')}</div></div><div class="dice-tools"><button class="secondary-button" data-action="reroll" ${!die || b.rerolls <= 0 ? 'disabled' : ''}>⟳ 重掷选中骰子</button><p>本回合还可重掷 ${b.rerolls} 次</p></div></div><div class="combat-hand">${cards}${pocketCards}</div><h3 class="section-title">催发异能 · 每回合 3 点行动值</h3>${abilityMarkup()}<div class="combat-guide">${die ? `已选择 <strong>${die} 点</strong> · 点击亮起的固有卡；消耗卡无需骰子。` : '骰子已用尽，仍可使用消耗卡或催发异能。'}<br>中毒与燃烧在敌方行动前结算；流血在受到直接攻击时触发；减速降低下回合意图。耐久卡会保留到耐久归零。</div></div><div class="combat-log ${latest.tone}">${escape(latest.text)}</div>${state.attackNotice?attackPopupMarkup():''}`, `<span class="tiny">抽牌堆 ${b.draw.length} / 弃牌堆 ${b.discard.length} · 固有卡循环 · 消耗卡另存</span><button class="secondary-button" data-action="flee" ${b.kind === 'tower' ? 'disabled' : ''}>撤退 · 需要骰点 ≥3</button><button class="primary-button" data-action="end-round">结束回合 · 敌方行动 →</button>`, 'FIGHT FOR ANOTHER TOMORROW', false);
    if(state.attackNotice)modal.querySelector('.attack-popover button')?.focus({preventScroll:true});
  }
  function renderMutation() {const ids=state.mutationOffer?.length?state.mutationOffer:Object.keys(G.MUTATIONS).filter(id=>G.mutationLevel(state,id)<G.MUTATIONS[id].maxLevel);show('有些改变，已经不可逆。', `<div class="modal-body"><p class="modal-copy" style="margin-bottom:20px">从四项随机异变中选择一项。已觉醒且未满级的异能可能再次出现；选择后恢复 8 SAN。</p><div class="mutation-choices">${ids.map(id=>{const m=G.MUTATIONS[id],r=rarity(m),lv=G.mutationLevel(state,id);return `<button class="mutation-choice rarity-${m.rarity}" data-action="mutate" data-id="${id}" style="--rarity-color:${r.color}"><b class="rarity-label">${r.name}</b>${glyph(m.icon,'purple')}<h3>${m.name}</h3><p>${m.desc}</p><small>${lv?`升级 Lv.${lv} → Lv.${lv+1}：${m.levels?.[lv]||'效果增强'}`:`觉醒 Lv.1：${m.levels?.[0]||'解锁异能'}`}</small></button>`;}).join('')}</div></div>`, '', 'MUTATION AWAKENED', false); }
  function renderEvent() {
    const e=G.EVENTS[state.event], merchant=state.event==='merchant';
    show(e.title, `<div class="modal-body"><div class="event-portrait">${glyph(e.icon)}</div><p class="modal-copy">${e.text}</p>${merchant?`<div class="merchant-wallet">${icon('wrench')} 可用零件：${state.scrap}</div><div class="merchant-stock">${state.eventData.stock.map((v,i)=>{const item=v.kind==='card'?G.CARDS[v.id]:G.ITEMS[v.id];return `<article class="merchant-item"><button data-action="detail" data-kind="${v.kind==='card'?'card':'item'}" data-id="${v.id}">${glyph(item.icon,item.color)}<strong>${item.name}</strong><span>${v.kind==='card'?`${rarity(item).name} · ${item.school}`:'补给'} · 点击详情</span></button><span>剩余 ${v.remaining} 份</span><button class="secondary-button" data-action="trade" data-id="${i}" ${v.remaining>0&&state.scrap>=v.price?'':'disabled'}>${v.remaining?`${v.price} 零件 · 购买`:'已售罄'}</button></article>`;}).join('')}</div>`:''}${merchant?`<h3 class="section-title">出售消耗卡 · 换点零件</h3><div class="sell-list">${[...new Set(state.consumables)].map(id=>`<button class="secondary-button" data-action="sell-card" data-id="${id}">${G.CARDS[id].name} ×${state.consumables.filter(c=>c===id).length} · 售价 ${G.CARDS[id].sell}</button>`).join('')||'<p class="modal-copy">没有可出售的消耗卡。固有卡不在出售范围内。</p>'}</div>`:''}<div class="event-options">${G.eventChoices(state).map(c=>`<button class="${c.id==='leave'?'secondary':'primary'}-button" data-action="event" data-id="${c.id}" ${c.available?'':'disabled'}>${c.title}<small>${c.desc}${!c.available?' · 条件不足':''}</small></button>`).join('')}</div></div>`, '', '路上，什么都有可能发生', false);
  }
  function renderEnding() {
    const won=state.phase==='victory', p=state.personality || G.personality(state);
    show(won?'黎明，终于到来。':'这一次，先走到这里。', `<div class="modal-body ending"><p>${escape(state.logs[0].text)}</p><div class="personality-card"><span class="eyebrow">你的本局拾荒人格</span>${glyph(p.icon)}<h3>${p.name}</h3><p>${p.desc}</p><div class="personality-evidence">${p.evidence}</div><small>根据本局选择与行动倾向生成的游戏称号</small></div><div class="end-stats"><div><strong>${state.turn}</strong><span>生存行动</span></div><div><strong>${state.kills}</strong><span>击败异变体</span></div><div><strong>${state.cores}/3</strong><span>回收核心</span></div></div><p class="tiny">世界种子：${escape(state.seed)}</p></div>`, '<button class="secondary-button" data-action="dismiss-ending">回看废土</button><button class="secondary-button" data-action="achievements">查看成就</button><button class="primary-button" data-action="new">重新出发 →</button>', won?'明天，还值得期待':'生存手记 · 本局结算', false);
  }
  function act(fn, ...args) { const previous = state.phase; if (!fn(state,...args)) { toast('现在无法执行这个行动。'); return; } selected = state.region?.position ?? state.position; overlay = null; overlayStack.length = 0; if (previous !== 'combat' && state.phase === 'combat') selectedDie = 0; render(); }
  document.addEventListener('click', event => {
    if (dragClick && performance.now()<dragClick.until && Math.hypot(event.clientX-dragClick.x,event.clientY-dragClick.y)<8) { dragClick=null;return; }
    dragClick=null;
    const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
    const a = button.dataset.action, id = button.dataset.id;
    if(a==='dismiss-achievement'){dismissAchievement();return;}
    if(a==='dismiss-survival'){G.acknowledge(state,'survivalAlert');render();return;}
    if (a === 'mobile-view') mobileView(id);
    else if (a === 'tile') { selected = Number(id); render(); }
    else if (a === 'move') act(G.move, Number(id));
    else if(a==='move-local')act(G.moveRegion,Number(id));
    else if(a==='leave-region')act(G.leaveRegion);
    else if(a==='enter-region')act(G.enterRegion);
    else if(a==='activate'){
      const inCombat=state.phase==='combat';
      if(G.activate(state,id)){
        render();
        if(inCombat)requestAnimationFrame(()=>modal.querySelector('.combat-hand .pocket-slot:last-child')?.scrollIntoView({block:'nearest',inline:'end',behavior:'smooth'}));
      }
    }
    else if(a==='recover-energy'){if(G.recoverEnergy(state))render();}
    else if(a==='pocket-use'){if(G.usePocket(state,id,Number(button.dataset.index)))render();}
    else if(a==='sell-card'){if(G.sellCard(state,id))render();}
    else if(a==='achievement-tab'){achievementTab=id;collectionStatus='all';collectionRarity='all';collectionType='all';collectionQuery='';renderAchievements();}
    else if(a==='achievement-status'){achievementStatus=id;renderAchievements();}
    else if(a==='achievement-group'){achievementGroupFilter=id;renderAchievements();}
    else if(a==='collection-status'){collectionStatus=id;renderAchievements();}
    else if(a==='collection-rarity'){collectionRarity=collectionRarity===id?'all':id;renderAchievements();}
    else if(a==='dismiss-achievements'){
      overlayStack.length=0;
      if(['dead','victory'].includes(state.phase)){overlay='dismissed';modal.close();}
      else{overlay=null;renderOverlay();}
    }
    else if (a === 'search') act(G.search);
    else if (a === 'rest') act(G.rest);
    else if (a === 'supply') act(G.supply, id);
    else if (a === 'die') { selectedDie = Number(id); renderCombat(); }
    else if (a === 'play') act(G.play, Number(id), selectedDie);
    else if (a === 'reroll') act(G.reroll, selectedDie);
    else if (a === 'end-round') { selectedDie = 0; act(G.endRound); }
    else if (a === 'flee') act(G.flee);
    else if (a === 'mutate') act(G.mutate,id);
    else if (a === 'event') act(G.chooseEvent,id);
    else if (a === 'detail') openOverlay({kind:button.dataset.kind,id});
    else if (a === 'detail-use') { if (G.supply(state,id)) render(); }
    else if (a === 'salvage') { if (G.salvage(state,id)) { render(); toast('已分解一张多余卡牌，零件 +2。'); } }
    else if (a === 'trade') { if (G.trade(state,Number(id))) { render(); toast('交易完成，物品已放入背包。'); } }
    else if (a === 'make') { if (G.craft(state,id)) { render(); toast('制作完成，已放入背包。'); } }
    else if (a === 'confirm-new') { const seed = $('new-seed').value.trim(); state = G.create(seed); selected = state.position; selectedDie = 0; overlay = null; overlayStack.length = 0; mobileView('explore'); render(); toast('新的轮回开始了。'); }
    else if (a === 'close') close();
    else if (a === 'dismiss-ending') { overlay = 'dismissed'; modal.close(); }
    else if (a === 'ending') { overlay = null; renderEnding(); }
    else if (['help','new','craft','deck','inventory','achievements','powers'].includes(a)) openOverlay(a);
  });
  document.addEventListener('input',event=>{if(event.target.id==='collection-search')applyCollectionSearch(event.target.value);});
  document.addEventListener('change',event=>{if(event.target.id==='collection-type'){collectionType=event.target.value;renderAchievements();}});
  let drag = null, dragClick = null, backTouch = null;
  // Handle a deliberate touch on Back without depending on a synthetic mouse click
  // after a drag. Native click remains available for mouse and keyboard users.
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('[data-action="close"]');
    if(event.pointerType==='touch' && button && !button.disabled)
      backTouch={button,pointer:event.pointerId,x:event.clientX,y:event.clientY};
  });
  document.addEventListener('pointermove',event=>{
    if(backTouch && Math.hypot(event.clientX-backTouch.x,event.clientY-backTouch.y)>8)backTouch=null;
  });
  document.addEventListener('pointerup',event=>{
    const touch=backTouch;backTouch=null;
    if(touch && touch.pointer===event.pointerId && touch.button.contains(event.target)){
      dragClick={x:event.clientX,y:event.clientY,until:performance.now()+500};close();
    }
  });
  document.addEventListener('pointercancel',()=>{backTouch=null;});
  function dragTarget(x,y) {
    const slots = [...modal.querySelectorAll(`.hand-slot[data-zone="${drag.zone}"]`)];
    const hit = slots.reduce((best,el) => {
      const r=el.getBoundingClientRect(), distance=Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);
      return !best || distance<best.distance ? {el,distance} : best;
    },null)?.el;
    slots.forEach(el=>el.classList.toggle('drop-target',el===hit));
    if(hit) drag.to=Number(hit.dataset.index);
  }
  document.addEventListener('pointerdown', event => {
    const handle=event.target.closest('.card-grip');
    if(!handle || (event.pointerType==='mouse' && event.button!==0)) return;
    drag={handle,zone:handle.dataset.zone,from:Number(handle.dataset.index),to:Number(handle.dataset.index),pointer:event.pointerId};
    handle.setPointerCapture(event.pointerId);handle.closest('.hand-slot').classList.add('dragging');
  });
  document.addEventListener('pointermove', event => {
    if(!drag || drag.pointer!==event.pointerId) return;
    event.preventDefault();
    const tray=drag.handle.closest('.combat-hand');
    if(tray){const r=tray.getBoundingClientRect();if(event.clientX>r.right-45)tray.scrollLeft+=20;else if(event.clientX<r.left+45)tray.scrollLeft-=20;}
    dragTarget(event.clientX,event.clientY);
  });
  function finishDrag(event) {
    if(!drag || drag.pointer!==event.pointerId) return;
    const d=drag;drag=null;
    modal.querySelectorAll('.dragging,.drop-target').forEach(el=>el.classList.remove('dragging','drop-target'));
    if(event.type!=='pointercancel' && G.reorder(state,d.from,d.to,d.zone)) {
      dragClick={x:event.clientX,y:event.clientY,until:performance.now()+500};
      // Let the browser release capture and finish this touch before replacing its target.
      save();requestAnimationFrame(()=>{render();toast('卡牌顺序已调整。');});
    }
  }
  document.addEventListener('pointerup',finishDrag);
  document.addEventListener('pointercancel',finishDrag);
  document.addEventListener('keydown',event=>{
    const h=event.target.closest('.card-grip');
    if(!h || !['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const to=Number(h.dataset.index)+(event.key==='ArrowLeft'?-1:1),zone=h.dataset.zone;
    if(G.reorder(state,Number(h.dataset.index),to,zone)){render();modal.querySelector(`.card-grip[data-zone="${zone}"][data-index="${to}"]`)?.focus();}
  });
  modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
  modal.addEventListener('close', () => { if (!modal.open) document.body.classList.remove('dialog-open'); });
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); });
  render();
  if (firstVisit) toast('欢迎回到废土。点击亮起的相邻区块出发；右上角 ? 查看玩法。');
})();
