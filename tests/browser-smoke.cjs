// Optional real-browser smoke test using Chrome's private debugging pipe.
// Start `npm start` first. No third-party packages or open debugging ports.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const G = require('../engine.js');
const preview = process.env.FAULTLAND_QA_URL || 'http://127.0.0.1:4173/';
const qa = path.resolve(__dirname, '../.qa');
fs.mkdirSync(qa, {recursive:true});
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(qa,'smoke-profile-'));
const args = ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-pipe',`--user-data-dir=${profile}`];
if (process.env.FAULTLAND_QA_NO_SANDBOX === '1') args.push('--no-sandbox');
const child = spawn(chrome,args,{stdio:['ignore','ignore','ignore','pipe','pipe'],windowsHide:true});
let seq=0, buffer='', sessionId, failure;
const runtimeErrors=[];
const pending=new Map();
child.on('error', error=>{ failure=error; for(const {reject} of pending.values()) reject(error); });
child.stdio[4].on('data', chunk=>{
  buffer+=chunk.toString();
  let end;
  while((end=buffer.indexOf('\0'))>=0){
    const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);
    if(message.method==='Runtime.exceptionThrown')runtimeErrors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
    const item=pending.get(message.id);
    if(item){pending.delete(message.id);clearTimeout(item.timer);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result);}
  }
});
function call(method,params={},session=sessionId){
  return new Promise((resolve,reject)=>{
    if(failure){reject(failure);return;}
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timed out: ${method}`));},15000);
    pending.set(id,{resolve,reject,timer});
    child.stdio[3].write(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})})+'\0');
  });
}
async function evaluate(expression){
  const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails) throw new Error(r.exceptionDetails.text+': '+r.exceptionDetails.exception?.description);
  return r.result.value;
}
async function ready(){
  for(let i=0;i<40;i++){
    if(await evaluate('Boolean(document.querySelector(".tile"))')) return;
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('Game did not render');
}
const click=selector=>evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw new Error('Missing button: '+${JSON.stringify(selector)});if(b.disabled)throw new Error('Disabled button: '+${JSON.stringify(selector)});b.click();return true;})()`);
async function screenshot(name){await new Promise(r=>setTimeout(r,250));const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(qa,name),Buffer.from(r.data,'base64'));}
async function noOverflow(){const dims=await evaluate('({width:innerWidth,document:document.documentElement.scrollWidth})');assert.ok(dims.document<=dims.width,JSON.stringify(dims));return dims;}
async function tap(selector){
  const point=await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw new Error('Unavailable touch target');b.scrollIntoView({block:'nearest',inline:'nearest'});const r=b.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const hit=document.elementFromPoint(x,y);if(!hit||!b.contains(hit))throw new Error('Touch target obscured: '+${JSON.stringify(selector)});return {x,y};})()`);
  await new Promise(resolve=>setTimeout(resolve,100));
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
  await new Promise(resolve=>setTimeout(resolve,60));
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await new Promise(resolve=>setTimeout(resolve,100));
}
async function swipeHand(){
  const p=await evaluate('(()=>{const r=document.querySelector(".combat-hand").getBoundingClientRect();return {x:r.right-25,y:r.y+65};})()');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});
  for(let i=1;i<=6;i++){
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-i*32,y:p.y,id:1}]});
    await new Promise(r=>setTimeout(r,20));
  }
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await new Promise(r=>setTimeout(r,250));
  assert.ok(await evaluate('document.querySelector(".combat-hand").scrollLeft>0'),'Hand must scroll under a touch swipe');
}
async function loadRun(s){
  await evaluate(`localStorage.setItem('faultland-save-v1',${JSON.stringify(JSON.stringify(s))})`);
  await call('Page.reload');await ready();
}
const readRun=()=>evaluate("JSON.parse(localStorage.getItem('faultland-save-v1'))");
function findRun(predicate){
  for(let i=0;i<3000;i++){const s=G.create('ui-events-'+i);G.move(s,19);G.search(s);if(predicate(s))return s;}
  throw new Error('Could not find scenario');
}
async function dragCard(zone,from,to){
  const points=await evaluate(`(()=>{
    const a=document.querySelector('.card-grip[data-zone="${zone}"][data-index="${from}"]');a.scrollIntoView({block:'center',inline:'start'});
    const b=document.querySelector('.card-grip[data-zone="${zone}"][data-index="${to}"]');
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return [{x:ar.x+ar.width/2,y:ar.y+ar.height/2},{x:br.x+br.width/2,y:br.y+br.height/2}];
  })()`);
  assert.ok(points.every(p=>p.y>0&&p.y<844&&p.x>0&&p.x<390),'Drag endpoints must be on screen');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...points[0],id:1}]});
  for(let i=1;i<=8;i++)await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:points[0].x+(points[1].x-points[0].x)*i/8,y:points[0].y+(points[1].y-points[0].y)*i/8,id:1}]});
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await new Promise(resolve=>setTimeout(resolve,350));
}
(async()=>{
  const target=await call('Target.createTarget',{url:'about:blank'},null);
  sessionId=(await call('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await call('Page.enable');await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:preview});await ready();
  // Reset through the visible new-run UI, preserving the normal storage flow.
  await click('[data-action="new"]');
  await evaluate('document.getElementById("new-seed").value="ui-smoke"');
  await click('[data-action="confirm-new"]');
  assert.equal(await evaluate('document.querySelectorAll(".tile").length'),30);
  await noOverflow();await screenshot('desktop.png');
  await click('[data-action="help"]');
  assert.match(await evaluate('document.getElementById("modal-title").textContent'),/生存指南/);
  await click('#modal [data-action="close"]');
  await click('[data-action="craft"]');await click('[data-action="make"][data-id="water"]');
  assert.match(await evaluate('document.getElementById("modal-content").textContent'),/可用零件：4/);
  await click('#modal [data-action="close"]');
  await click('[data-action="deck"]');
  assert.equal(await evaluate('document.querySelectorAll(".deck-full .mini-card").length'),12);
  await click('#modal [data-action="close"]');
  // Verify narrow viewport layout; device metrics avoid Chrome's minimum window size.
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const mobile=await noOverflow();await screenshot('mobile.png');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".supply-panel")).display'),'none');
  await tap('[data-action="mobile-view"][data-id="inventory"]');
  assert.equal(await evaluate('document.body.dataset.mobileView'),'inventory');
  await tap('#supplies [data-action="supply"][data-id="food"]');
  await tap('[data-action="craft"]');
  await tap('[data-action="make"][data-id="med"]');
  await tap('#modal [data-action="close"]');
  await screenshot('mobile-inventory.png');
  await tap('[data-action="mobile-view"][data-id="journal"]');
  assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".objective-panel")).display'),'none');
  await tap('[data-action="mobile-view"][data-id="explore"]');
  const s=G.create('ui-smoke'), goal=s.map.find(t=>t.type==='hospital').id;
  while(s.position!==goal){
    const x=s.position%6,tx=goal%6;
    const next=x<tx?s.position+1:x>tx?s.position-1:s.position<goal?s.position+6:s.position-6;
    await tap(`[data-action="tile"][data-id="${next}"]`);
    await tap(`[data-action="move"][data-id="${next}"]`);
    G.move(s,next);
  }
  assert.equal(await evaluate('document.querySelectorAll(".local-map .tile").length'),9);
  await tap('[data-action="tile"][data-id="1"]');await tap('[data-action="move-local"][data-id="1"]');
  await tap('[data-action="tile"][data-id="4"]');await tap('[data-action="move-local"][data-id="4"]');
  await tap('[data-action="search"]');
  assert.equal(await evaluate('document.querySelectorAll(".die").length'),3);
  assert.equal(await evaluate('document.querySelectorAll(".combat-card").length'),5);
  await noOverflow();await screenshot('mobile-combat.png');
  const beforePower=await readRun();
  await tap('.ability-card[data-id="endless_chips"]');
  const afterPower=await readRun();
  assert.equal(afterPower.combat.ap,beforePower.combat.ap-1);
  assert.equal(afterPower.energy,beforePower.energy-18);
  assert.deepEqual(afterPower.combat.dice,beforePower.combat.dice);
  assert.ok(await evaluate('Boolean(document.querySelector(".combat-hand .consumable-combat-card[data-id=chips_card]"))'));
  assert.equal(await evaluate('document.querySelectorAll(".combat-card").length'),6);
  await new Promise(resolve=>setTimeout(resolve,450));
  assert.ok(await evaluate('(()=>{const c=document.querySelector(".consumable-combat-card[data-id=chips_card]").getBoundingClientRect(),h=document.querySelector(".combat-hand").getBoundingClientRect();return c.right>h.left&&c.left<h.right;})()'));
  await screenshot('mobile-combat-produced-card.png');
  const before=await evaluate('document.querySelector(".enemy-info").textContent');
  await call('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelector(".enemy-info").textContent'),before);
  await tap('[data-action="reroll"]');
  assert.equal(await evaluate('document.querySelector("[data-action=reroll]").disabled'),true);
  const beforeDrag=await readRun();await dragCard('hand',0,1);const afterDrag=await readRun();
  const sorted=[...beforeDrag.combat.hand];sorted.splice(1,0,sorted.splice(0,1)[0]);
  assert.deepEqual(afterDrag.combat.hand,sorted);assert.deepEqual(afterDrag.combat.dice,beforeDrag.combat.dice);
  assert.equal(afterDrag.rng,beforeDrag.rng);assert.equal(afterDrag.combat.hp,beforeDrag.combat.hp);
  await swipeHand();
  await tap('.combat-card:not(:disabled)');
  assert.equal(await evaluate('document.querySelectorAll(".die.used").length'),1);
  await tap('[data-action="end-round"]');
  assert.match(await evaluate('document.getElementById("modal-title").textContent'),/异变接触/);
  assert.match(await evaluate('document.getElementById("attack-popover-title").textContent'),/发动攻击/);
  assert.ok(await evaluate('Boolean(document.querySelector(".attack-equation .damage b"))'));
  assert.ok(await evaluate('Boolean(document.querySelector(".attack-popover-layer")&&document.querySelector(".enemy-stage"))'));
  assert.ok(await evaluate('document.querySelector(".attack-popover").getBoundingClientRect().width<420'));
  assert.ok(await evaluate('document.querySelector(".attack-popover").contains(document.activeElement)'));
  await screenshot('mobile-enemy-attack.png');
  await tap('#modal [data-action="close"]');
  assert.match(await evaluate('document.querySelector(".enemy-info").textContent'),/ROUND 02/);
  assert.equal(await evaluate('document.querySelectorAll(".die.used").length'),0);
  const build=await readRun();build.combat.hand=['toxic_needle','fuel_can','lighter'];build.combat.dice=[6,6,6];build.combat.poison=0;build.combat.burn=0;build.combat.fuel=0;build.consumables=['reinforced_crowbar'];build.pocketUses=[3];
  await loadRun(build);
  await tap('.combat-card[data-action="play"][data-id="0"]');
  assert.match(await evaluate('document.querySelector(".status-chip.poison").textContent'),/中毒 9/);
  assert.ok(await evaluate('document.querySelector(".enemy-poison-fill").getBoundingClientRect().width>0'));
  await evaluate('document.querySelector(".combat-zone").scrollTop=0');await screenshot('mobile-poison-bar.png');
  await tap('.consumable-combat-card[data-id="reinforced_crowbar"]');
  assert.match(await evaluate('document.querySelector(".consumable-combat-card[data-id=reinforced_crowbar] .card-rule").textContent'),/耐久 2\/3/);
  assert.equal((await readRun()).pocketUses[0],2);
  await screenshot('mobile-combat-archetypes.png');
  for(const [width,height] of [[320,568],[375,667],[667,375]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await noOverflow();
    const fits=await evaluate('(()=>{const d=document.getElementById("modal"),b=document.querySelector("[data-action=end-round]"),r=b.getBoundingClientRect();return d.scrollWidth<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.height>=44;})()');
    assert.ok(fits,'Battle end-turn control must fit on short portrait and landscape screens');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await noOverflow();await screenshot('desktop-combat.png');
  // Direct-file delivery must work without the preview server or external assets.
  const {pathToFileURL}=require('node:url');
  await call('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../index.html')).href});
  await ready();
  assert.equal(await evaluate('document.querySelectorAll(".tile").length'),30);
  await click('[data-action="help"]');
  assert.match(await evaluate('document.getElementById("modal-title").textContent'),/生存指南/);
  await click('#modal [data-action="close"]');
  for(const [width,height] of [[320,568],[375,667],[430,932],[667,375],[768,1024]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
    await noOverflow();
    if(width<741){
      const hit=await evaluate('(()=>{const b=document.querySelector(".mobile-nav button");const r=b.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight;})()');
      assert.ok(hit,'Navigation must remain a visible 44px touch target');
    }else{
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".mobile-nav")).display'),'none');
      assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".supply-panel")).display'),'none');
    }
  }
  // Loot receipts must precede encounters, survive reload, and never award twice.
  for(const seed of ['loot-0','loot-3','loot-4']){
    const width=seed==='loot-0'?1440:390;
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<741});
    await click('[data-action="new"]');
    await evaluate(`document.getElementById('new-seed').value=${JSON.stringify(seed)}`);
    await click('[data-action="confirm-new"]');
    await click('[data-action="tile"][data-id="19"]');
    await click('[data-action="move"][data-id="19"]');
    await click('[data-action="search"]');
    const expected=G.create(seed);G.move(expected,19);G.search(expected);
    assert.equal(await evaluate('document.getElementById("modal-title").textContent'),'搜寻收获');
    const rows=await evaluate('Array.from(document.querySelectorAll(".loot-item")).map(x=>({name:x.querySelector("strong").textContent,count:x.querySelector("b").textContent}))');
    assert.deepEqual(rows,[{name:'零件',count:'+'+expected.searchResult.scrap},...Object.entries(expected.searchResult.supplies).map(([id,count])=>({name:G.ITEMS[id].name,count:'+'+count})),...expected.searchResult.cards.map(id=>({name:G.CARDS[id].name,count:'+1'}))]);
    assert.equal(await evaluate('document.querySelectorAll(".enemy-stage").length'),0);
    const totals=await evaluate('({scrap:document.getElementById("scrap").textContent,food:document.querySelector("#supplies [data-id=food]").getAttribute("aria-label"),deck:document.getElementById("deck-count").textContent})');
    await call('Page.reload');await ready();
    assert.equal(await evaluate('document.getElementById("modal-title").textContent'),'搜寻收获');
    await noOverflow();
    await screenshot(seed==='loot-0'?'desktop-loot.png':seed==='loot-4'?'mobile-loot-encounter.png':'mobile-loot.png');
    if(seed==='loot-3'){
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    }else if(width<741)await tap('#modal [data-action="close"]');
    else await click('#modal .primary-button[data-action="close"]');
    assert.equal(await evaluate('document.querySelectorAll(".loot-item").length'),expected.phase==='explore'?rows.length:0);
    if(expected.phase==='combat'){
      assert.equal(await evaluate('document.querySelector(".enemy-info h3").textContent'),expected.combat.name);
    }else if(expected.phase==='event') assert.equal(await evaluate('document.getElementById("modal-title").textContent'),G.EVENTS[expected.event].title);
    else assert.equal(await evaluate('document.getElementById("modal").open'),false);
    await call('Page.reload');await ready();
    assert.equal(await evaluate('document.querySelectorAll(".loot-item").length'),0);
    assert.deepEqual(await evaluate('({scrap:document.getElementById("scrap").textContent,food:document.querySelector("#supplies [data-id=food]").getAttribute("aria-label"),deck:document.getElementById("deck-count").textContent})'),totals);
  }
  // Drill into loot, navigate to crafting / inventory, and return without acknowledging the receipt.
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const calm=findRun(s=>s.phase==='explore'&&s.searchResult.cards.length);await loadRun(calm);
  await tap('.loot-item[data-id="scrap"]');
  assert.match(await evaluate('document.querySelector(".detail-description").textContent'),/齿轮/);
  await screenshot('mobile-item-detail.png');await tap('#modal [data-action="craft"]');
  await tap('[data-action="make"][data-id="water"]');
  assert.equal((await readRun()).scrap,calm.scrap-3);
  await tap('#modal [data-action="close"]');assert.equal(await evaluate('document.getElementById("modal-title").textContent'),'零件');
  await tap('#modal [data-action="inventory"]');
  const preDeck=await readRun();await dragCard('deck',1,2);const postDeck=await readRun();
  const expectedDeck=[...preDeck.deck];expectedDeck.splice(2,0,expectedDeck.splice(1,1)[0]);
  assert.deepEqual(postDeck.deck,expectedDeck);assert.equal(postDeck.rng,preDeck.rng);
  await tap('#modal [data-action="close"]');await tap('#modal [data-action="close"]');
  assert.equal(await evaluate('document.getElementById("modal-title").textContent'),'搜寻收获');
  await tap('.loot-item[data-kind="card"]');assert.ok(await evaluate('Boolean(document.querySelector(".detail-rule"))'));
  await tap('#modal [data-action="close"]');await tap('#modal [data-action="close"]');
  assert.equal(await evaluate('document.querySelector(\'.tile[data-id="19"]\').classList.contains("searched")'),true);
  await tap('.mobile-nav [data-action="achievements"]');
  await evaluate('(()=>{const notice=document.getElementById("achievement-notice");if(notice.classList.contains("visible"))notice.querySelector("button").click();})()');
  assert.equal(await evaluate('document.querySelectorAll(".achievement").length'),G.ACHIEVEMENTS.length);
  assert.ok(await evaluate('document.querySelectorAll(".achievement.unlocked").length>0'));assert.ok(await evaluate('Boolean(document.querySelector(".completion-ring"))'));
  assert.equal(await evaluate('document.querySelectorAll(\'[data-action="achievement-group"]\').length'),6);await tap('[data-action="achievement-group"][data-id="combat"]');
  assert.equal(await evaluate('document.querySelectorAll(".achievement").length'),4);await screenshot('mobile-achievements.png');
  await tap('#modal [data-action="close"]');
  const persistent=await evaluate("localStorage.getItem('faultland-achievements-v1')");await loadRun(G.create('fresh-achievement'));
  assert.equal(await evaluate("localStorage.getItem('faultland-achievements-v1')"),persistent);
  // A genuine rolled merchant: receipt first, details, purchases, persistence, then depart.
  const merchant=findRun(s=>s.event==='merchant');await loadRun(merchant);await tap('#modal [data-action="close"]');
  assert.equal(await evaluate('document.getElementById("modal-title").textContent'),G.EVENTS.merchant.title);
  await screenshot('mobile-merchant.png');await noOverflow();
  const stockIndex=merchant.eventData.stock.findIndex(v=>v.price<=merchant.scrap);
  await tap(`[data-action="trade"][data-id="${stockIndex}"]`);const bought=await readRun();
  assert.equal(bought.scrap,merchant.scrap-merchant.eventData.stock[stockIndex].price);
  await call('Page.reload');await ready();assert.deepEqual((await readRun()).eventData,bought.eventData);
  await tap('[data-action="event"][data-id="leave"]');await tap('#modal [data-action="close"]');
  // Rescue followed by a deferred return visit, including a reload between the two.
  const injured=findRun(s=>{if(s.event!=='injured'||s.encounterQueue.length)return false;const c=G.restore(s);G.chooseEvent(c,'help');return c.pending[0]?.kind==='aid';});
  await loadRun(injured);await tap('#modal [data-action="close"]');await screenshot('mobile-event.png');
  await tap('[data-action="event"][data-id="help"]');assert.equal((await readRun()).stats.helped,1);
  await call('Page.reload');await ready();await tap('#modal [data-action="close"]');
  let rescued=await readRun();const due=rescued.pending[0].due;
  while(rescued.travel<due){const next=rescued.position===19?25:19;await tap(`[data-action="tile"][data-id="${next}"]`);await tap(`[data-action="move"][data-id="${next}"]`);rescued=await readRun();}
  assert.equal(rescued.stats.futureAid,1);assert.match(await evaluate('document.getElementById("modal-title").textContent'),/回声/);
  const aidTotals=rescued.supplies;await call('Page.reload');await ready();assert.deepEqual((await readRun()).supplies,aidTotals);await tap('#modal [data-action="close"]');
  const team=findRun(s=>s.event==='rescue_team'&&!s.encounterQueue.length);await loadRun(team);await tap('#modal [data-action="close"]');
  await tap('[data-action="event"][data-id="share"]');assert.equal((await readRun()).stats.donated,1);
  // End screen uses real recorded behavior; achievement menu returns to the ending.
  const ending=G.create('ending-fixture');ending.phase='victory';ending.cores=3;ending.stats.helped=4;ending.logs.unshift({turn:0,tone:'good',text:'信号塔归于沉寂。'});
  await loadRun(ending);assert.equal(await evaluate('document.querySelector(".personality-card h3").textContent'),'废土守灯人');
  await screenshot('mobile-ending.png');await tap('#modal [data-action="achievements"]');await tap('#modal [data-action="dismiss-achievements"]');
  assert.equal(await evaluate('document.getElementById("modal").open'),false);
  assert.equal(await evaluate('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)'),true);
  // Entering the discovered local exit returns to the 30-tile world immediately.
  const exitRun=G.create('ui-direct-exit'),parent=exitRun.map.find(t=>t.type==='hospital').id;
  exitRun.position=parent;G.enterRegion(exitRun);const exit=exitRun.region.exit,near=exit-3;
  exitRun.region.position=near;exitRun.region.cells[near].visited=true;exitRun.region.cells[near].revealed=true;exitRun.region.cells[exit].revealed=true;
  await loadRun(exitRun);await tap(`[data-action="tile"][data-id="${exit}"]`);await tap(`[data-action="move-local"][data-id="${exit}"]`);
  assert.equal((await readRun()).region,null);assert.equal(await evaluate('document.querySelectorAll(".tile").length'),30);
  assert.equal(await evaluate('document.getElementById("map-title").textContent'),'拾荒地图');
  // A completed achievement appears as a dismissible notification, not a blocking page.
  await evaluate("localStorage.removeItem('faultland-achievements-v1');localStorage.removeItem('faultland-achievement-notices-v1');localStorage.removeItem('faultland-collection-v1')");
  const achievementRun=G.create('achievement-popup');achievementRun.stats.searches=1;
  await loadRun(achievementRun);assert.ok(await evaluate('document.getElementById("achievement-notice").classList.contains("visible")'));
  assert.match(await evaluate('document.getElementById("achievement-notice").textContent'),/这趟没白来/);
  await tap('[data-action="dismiss-achievement"]');
  // Critical hunger/dehydration is visible, dismissible and stays dismissed after reload.
  const starving=G.create('ui-survival-warning');starving.food=1;starving.water=1;G.move(starving,19);
  await loadRun(starving);assert.ok(await evaluate('document.getElementById("survival-notice").classList.contains("visible")'));
  assert.match(await evaluate('document.getElementById("survival-notice").textContent'),/见底|虚弱/);assert.match(await evaluate('document.getElementById("survival-warning").textContent'),/虚弱 I/);
  await screenshot('mobile-survival-critical.png');await tap('[data-action="dismiss-survival"]');assert.equal((await readRun()).survivalAlert,null);
  await call('Page.reload');await ready();assert.equal(await evaluate('document.getElementById("survival-notice").classList.contains("visible")'),false);
  // The permanent collection exposes the full dynamic card count and rarity labels; a known legendary opens details.
  await evaluate("localStorage.removeItem('faultland-collection-v1')");const catalogRun=G.create('ui-card-catalog');catalogRun.consumables.push('signal_flare');catalogRun.pocketUses.push(G.CARDS.signal_flare.durability);catalogRun.discovered.cards.push('signal_flare');
  await loadRun(catalogRun);await tap('.mobile-nav [data-action="achievements"]');await tap('[data-action="achievement-tab"][data-id="cards"]');
  await evaluate('(()=>{const notice=document.getElementById("achievement-notice");if(notice.classList.contains("visible"))notice.querySelector("button").click();})()');
  await screenshot('mobile-collection.png');
  assert.equal(await evaluate('document.querySelectorAll(".collection-card").length'),Object.keys(G.CARDS).length);assert.match(await evaluate('document.querySelector(".dashboard-copy h3").textContent'),new RegExp(`/ ${Object.keys(G.CARDS).length}`));
  assert.equal(await evaluate('document.querySelectorAll(".rarity-ledger button").length'),Object.keys(G.RARITIES).length);
  await evaluate(`(()=>{const select=document.getElementById('collection-type');select.value='毒蚀';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);assert.equal(await evaluate('document.querySelectorAll(".collection-card").length'),10);
  await evaluate(`(()=>{const select=document.getElementById('collection-type');select.value='all';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await evaluate(`(()=>{const input=document.getElementById('collection-search');input.value='不存在的废品';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);assert.ok(await evaluate('Boolean(document.getElementById("collection-search-empty"))'));
  await evaluate(`(()=>{const input=document.getElementById('collection-search');input.value='信号';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const searchCount=await evaluate('document.querySelectorAll(".collection-card:not([hidden])").length');assert.ok(searchCount>=1&&searchCount<Object.keys(G.CARDS).length);
  await tap('[data-action="collection-status"][data-id="known"]');await tap('[data-action="collection-rarity"][data-id="legendary"]');
  assert.equal(await evaluate('document.querySelectorAll(".collection-card").length'),1);assert.equal(await evaluate('document.querySelectorAll(".collection-card:not([hidden])").length'),1);
  assert.equal(await evaluate('document.querySelector(\'.collection-card[data-id="signal_flare"] .rarity-label\').textContent'),'传说');
  await tap('.collection-card[data-id="signal_flare"]');assert.match(await evaluate('document.querySelector(".detail-tag").textContent'),/传说/);await screenshot('mobile-card-rarity-detail.png');
  // Upgrade selection clearly distinguishes an owned power from a new awakening.
  const mutationRun=G.create('ui-mutation-upgrade');mutationRun.phase='mutation';mutationRun.mutationOffer=['endless_chips','acid_heart','ash_lung','pocket_factory'];
  await loadRun(mutationRun);assert.equal(await evaluate('document.querySelectorAll(".mutation-choice").length'),4);assert.match(await evaluate('document.querySelector(\'.mutation-choice[data-id="endless_chips"]\').textContent'),/Lv\.1 → Lv\.2/);
  await screenshot('mobile-mutation-upgrade.png');await tap('.mutation-choice[data-id="endless_chips"]');assert.equal((await readRun()).mutationLevels.endless_chips,2);
  // One of the expanded multi-choice events resolves in the actual UI.
  const eventRun=G.create('ui-weather-event');eventRun.phase='event';eventRun.event='weather_station';eventRun.eventData={};
  await loadRun(eventRun);assert.equal(await evaluate('document.getElementById("modal-title").textContent'),'自动气象站');assert.equal(await evaluate('document.querySelectorAll("[data-action=event]").length'),3);
  await tap('[data-action="event"][data-id="forecast"]');assert.match(await evaluate('document.getElementById("modal-title").textContent'),/云层/);
  for(const [width,height,isMobile] of [[320,568,true],[667,375,true],[1440,1100,false]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:isMobile});
    const m=G.restore(merchant);m.searchResult=null;await loadRun(m);await noOverflow();
    assert.ok(await evaluate('document.getElementById("modal").scrollWidth<=innerWidth'));
    await tap('.merchant-item [data-action="detail"]');await noOverflow();
    assert.ok(await evaluate('document.getElementById("modal").scrollWidth<=innerWidth'));
    await loadRun(ending);await tap('#modal [data-action="achievements"]');await noOverflow();if(!isMobile)await screenshot('desktop-achievements-v06.png');
    assert.ok(await evaluate('document.getElementById("modal").scrollWidth<=innerWidth'));
  }
  assert.deepEqual(runtimeErrors,[],'No uncaught browser errors during any scenario');
  console.log('New feature checks passed: touch card sorting without playing, nested item/craft/backpack navigation, cards in loot, gray tiles, merchant persistence, delayed rescue, cross-run achievements and personality ending.');
  console.log('Loot receipts passed: exact quantities, card/no-card drops, pre-combat ordering, dismissal, reload and no duplicate awards.');
  console.log('Browser smoke passed: map, help, workbench, deck, movement, battle, reload, dice, card use, end turn, desktop/mobile overflow.');
  console.log('Direct-file HTML passed. Viewports: 320x568, 375x667, 390x844, 430x932, 667x375 landscape, 768x1024, desktop.');
  console.log('Touch checks passed: mobile tabs, supply use, crafting, map movement, search, dice, swipe hand, play card, end turn.');
  console.log(`v0.6 checks passed: critical survival warning, ${Object.keys(G.CARDS).length}-card searchable collection, achievement filters, power upgrade choice and expanded event resolution.`);
  console.log(`Mobile viewport: ${mobile.width}px; document: ${mobile.document}px. Screenshots in .qa/.`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  try{await call('Browser.close',{},null);}catch{}
  for(const p of pending.values())clearTimeout(p.timer);
  child.kill();
});
