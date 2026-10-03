const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../engine.js');

function encounter(type, predicate=()=>true) {
  for(let i=0;i<3000;i++) { const s=G.create('encounter-'+i);G.move(s,19);G.search(s);if(s.event===type&&!s.encounterQueue.length&&predicate(s))return s; }
  throw new Error('Missing encounter '+type);
}
test('the curated library has at least 100 distinct, valid cards plus upgradeable rarity-ranked powers and events',()=>{
  const cards=Object.values(G.CARDS),powers=Object.values(G.MUTATIONS),events=Object.values(G.EVENTS),rarities=Object.keys(G.RARITIES);
  assert.ok(cards.length>=100);assert.equal(new Set(cards.map(c=>c.name)).size,cards.length);assert.equal(new Set(cards.map(c=>c.desc)).size,cards.length);
  assert.ok(cards.every(c=>rarities.includes(c.rarity)&&c.school&&typeof c.rule==='string'&&typeof c.icon==='string'&&typeof c.desc==='string'&&(!c.effects||Array.isArray(c.effects))&&Number.isInteger(c.min)&&c.min>=0&&c.min<=6));
  const expanded=cards.filter(c=>c.effects),signatures=expanded.map(c=>JSON.stringify(c.effects)+'|'+c.min+'|'+(c.durability||0));assert.equal(new Set(signatures).size,expanded.length);
  assert.deepEqual([...new Set(cards.map(c=>c.rarity))].sort(),rarities.sort());
  assert.equal(powers.length,30);assert.ok(powers.every(m=>rarities.includes(m.rarity)&&Number.isInteger(m.maxLevel)&&m.maxLevel>=1));assert.ok(powers.some(m=>m.maxLevel>=3));
  assert.equal(events.length,20);assert.equal(new Set(events.map(e=>e.title)).size,20);assert.equal(new Set(events.map(e=>e.text)).size,20);assert.ok(events.every(e=>e.choices.length>=1));assert.ok(Object.entries(G.EVENTS).filter(([id])=>id!=='merchant').every(([,e])=>e.choices.length>=2));
  assert.equal(G.ACHIEVEMENTS.length,23);assert.equal(new Set(G.ACHIEVEMENTS.map(a=>a.id)).size,G.ACHIEVEMENTS.length);assert.equal(new Set(G.ACHIEVEMENTS.map(a=>a.name)).size,G.ACHIEVEMENTS.length);
});
test('rarity and power-upgrade achievements report real collection progress',()=>{
  const s=G.create('achievement-expansion');
  for(const rarity of Object.keys(G.RARITIES)){const id=Object.keys(G.CARDS).find(id=>G.CARDS[id].rarity===rarity);if(!s.discovered.cards.includes(id))s.discovered.cards.push(id);}
  s.mutationLevels.endless_chips=3;const list=Object.fromEntries(G.achievements(s).map(a=>[a.id,a.progress]));
  assert.equal(list.rarity_spectrum,5);assert.equal(list.legendary_card,1);assert.equal(list.first_upgrade,1);assert.equal(list.mastered_power,1);
});
test('every card in the 100-plus library executes through combat without broken or unreachable effects',()=>{
  for(const [id,c] of Object.entries(G.CARDS)){
    const s=enterGuardian('card-'+id),b=s.combat;s.hp=50;s.san=80;s.food=50;s.water=50;s.energy=50;b.hp=b.maxHp=10000;b.poison=10;b.burn=8;b.fuel=7;b.bleed=6;b.slow=5;b.vulnerable=4;b.shield=10;b.ap=2;
    if(c.consumable){s.consumables=[id];s.pocketUses=[c.durability||1];assert.equal(G.usePocket(s,id,0),true,id);}
    else {let die=Math.max(1,c.min);const parity=c.effects?.find(e=>['parityDamage','parityShield'].includes(e.kind))?.parity;if(parity==='odd'&&die%2===0)die++;if(parity==='even'&&die%2===1)die++;die=Math.min(6,die);b.hand=[id];b.dice=[die,6,6];assert.equal(G.play(s,0,0),true,id);}
    assert.ok(['combat','mutation','explore'].includes(s.phase),id);
  }
});
test('every expanded event choice resolves with valid costs, rewards and persistent state',()=>{
  for(const [id,e] of Object.entries(G.EVENTS).filter(([,e])=>e.resolutions))for(const [choice] of e.choices){
    const s=G.create('event-'+id+'-'+choice);s.phase='event';s.event=id;s.eventData={};s.scrap=100;s.hp=100;s.san=100;s.food=100;s.water=100;s.energy=100;for(const k of Object.keys(s.supplies))s.supplies[k]=10;
    s.deck=[...G.FIXED_CARDS];s.consumables=[...G.POCKET_CARDS];s.pocketUses=s.consumables.map(card=>G.CARDS[card].durability||1);
    assert.equal(G.chooseEvent(s,choice),true,`${id}:${choice}`);assert.ok(G.restore(s),`${id}:${choice} must persist`);
  }
});
test('search reaches every rarity tier and every ordinary event, with persistent receipts',()=>{
  const cards=new Set(),events=new Set();
  for(let i=0;i<1500;i++){
    const s=G.create('drops-'+i);G.move(s,19);G.search(s);
    s.searchResult.cards.forEach(c=>cards.add(c));if(s.event)events.add(s.event);for(const e of s.encounterQueue)if(e.kind==='event')events.add(e.id);
    assert.deepEqual(G.restore(JSON.stringify(s)),s);
    const before=JSON.stringify(s);assert.equal(G.search(s),false);assert.equal(JSON.stringify(s),before);
  }
  assert.deepEqual([...new Set([...cards].map(id=>G.CARDS[id].rarity))].sort(),Object.keys(G.RARITIES).sort());assert.ok(cards.size>=70);
  assert.deepEqual([...events].sort(),Object.keys(G.EVENTS).filter(id=>id!=='whisper').sort());
});
test('rescuing strangers can betray now, help later, or betray later; consequences survive reload once',()=>{
  const outcomes=new Set();
  for(let i=0;i<2500&&outcomes.size<3;i++){
    let s=G.create('rescue-'+i);G.move(s,19);G.search(s);if(s.event!=='injured'||s.encounterQueue.length)continue;
    s.searchResult=null;const med=s.supplies.med;assert.equal(G.chooseEvent(s,'help'),true);
    assert.equal(s.supplies.med,med-1);assert.equal(s.stats.helped,1);assert.equal(G.chooseEvent(s,'help'),false);
    const kind=s.pending[0]?.kind||'immediate';outcomes.add(kind);
    s=G.restore(s);assert.ok(s);
    if(kind==='immediate'){assert.equal(s.stats.betrayed,1);continue;}
    const due=s.pending[0].due;s.notice=null;
    while(s.travel<due){G.move(s,s.position===19?25:19);if(s.travel<due)assert.equal(s.notice,null);}
    assert.equal(s.pending.length,0);assert.equal(kind==='aid'?s.stats.futureAid:s.stats.betrayed,1);
    assert.ok(s.notice);s=G.restore(s);assert.ok(s);s.notice=null;
    const total=s.scrap;G.move(s,s.position===19?25:19);assert.equal(s.notice,null);assert.equal(s.scrap,total);
  }
  assert.deepEqual([...outcomes].sort(),['aid','betrayal','immediate']);
  const s=encounter('injured');s.supplies.med=0;assert.equal(G.eventChoices(s).find(c=>c.id==='help').available,false);assert.equal(G.chooseEvent(s,'help'),false);
});
test('merchant stock, card purchases and prices persist; sold-out or unaffordable purchases cannot repeat',()=>{
  let s=encounter('merchant');s.scrap=100;
  for(let i=0;i<s.eventData.stock.length;i++){
    const v=s.eventData.stock[i],count=v.remaining;
    const owned=()=>v.kind==='card'?(G.CARDS[v.id].consumable?s.consumables:s.deck).filter(c=>c===v.id).length:s.supplies[v.id];
    const before=owned(),money=s.scrap;
    for(let n=0;n<count;n++)assert.equal(G.trade(s,i),true);
    assert.equal(owned(),before+count);assert.equal(s.scrap,money-count*v.price);assert.equal(G.trade(s,i),false);
  }
  assert.deepEqual(G.restore(s),s);assert.equal(G.trade(s,-1),false);
  s=encounter('merchant');s.scrap=0;assert.equal(G.trade(s,0),false);
});
test('rescue teams heal once, donation costs a can and unavailable choices do not consume anything',()=>{
  const s=encounter('rescue_team');s.searchResult=null;s.hp=30;s.san=40;
  const food=s.supplies.food,water=s.supplies.water;
  assert.equal(G.chooseEvent(s,'share'),true);assert.equal(s.hp,65);assert.equal(s.san,60);
  assert.equal(s.supplies.food,food-1);assert.equal(s.supplies.water,water+1);assert.equal(s.stats.donated,1);
  assert.equal(G.chooseEvent(s,'treat'),false);assert.ok(G.restore(s));
  const t=encounter('rescue_team');t.supplies.food=0;assert.equal(G.chooseEvent(t,'share'),false);assert.equal(G.chooseEvent(t,'treat'),true);
});
test('reordering deck and combat hand preserves dice, RNG, resources and owned cards',()=>{
  for(const [s,zone] of [[G.create('sort'),'deck'],[enterGuardian('sort'),'hand']]){
    const list=zone==='deck'?s.deck:s.combat.hand,first=list[0],all=[...list].sort();
    const rng=s.rng,turn=s.turn,stats=JSON.stringify(s.stats),dice=JSON.stringify(s.combat?.dice);
    assert.equal(G.reorder(s,0,2,zone),true);assert.equal(list[2],first);assert.deepEqual([...list].sort(),all);
    assert.equal(s.rng,rng);assert.equal(s.turn,turn);assert.equal(JSON.stringify(s.stats),stats);assert.equal(JSON.stringify(s.combat?.dice),dice);
    assert.equal(G.reorder(s,-1,0,zone),false);assert.equal(G.reorder(s,0,99,zone),false);assert.deepEqual(G.restore(s),s);
  }
  const pocket=enterGuardian('sort-pocket');pocket.consumables=['reinforced_crowbar','armor_plate'];pocket.pocketUses=[2,1];
  assert.equal(G.reorder(pocket,0,1,'pocket'),true);assert.deepEqual(pocket.consumables,['armor_plate','reinforced_crowbar']);assert.deepEqual(pocket.pocketUses,[1,2]);assert.deepEqual(G.restore(pocket),pocket);
});
test('salvage keeps the last copy and a usable minimum deck; personality follows actual choices',()=>{
  const s=G.create('salvage');const scrap=s.scrap;
  assert.equal(G.salvage(s,'crowbar'),true);assert.equal(s.scrap,scrap+2);assert.equal(G.salvage(s,'crowbar'),false);
  assert.equal(G.personality(s).id,'maker');s.stats.helped=5;assert.equal(G.personality(s).id,'keeper');
  s.stats.skipped=10;assert.equal(G.personality(s).id,'ranger');
  assert.equal(G.achievements(s).find(a=>a.id==='helping_hand').progress,1);
  s.deck=['shield','shield','bandage','focus','knife'];assert.equal(G.salvage(s,'shield'),false);
});
test('old saves gain new event, statistics, durability and delayed consequence defaults',()=>{
  const s=G.create('old');for(const k of ['stats','travel','pending','notice','eventData','personality','searchResult','pocketUses','mutationLevels','mutationOffer','weakness','collapse','deathSaveUsed','survivalAlert','survivalFlags'])delete s[k];
  const restored=G.restore(s);assert.ok(restored);assert.equal(restored.stats.helped,0);assert.deepEqual(restored.pending,[]);
  assert.deepEqual(restored.pocketUses,[]);assert.equal(restored.stats.poisonApplied,0);assert.equal(restored.mutationLevels.endless_chips,1);assert.equal(restored.weakness,0);
  restored.pending=[{due:2,kind:'unexpected'}];assert.equal(G.restore(restored),null);
});
test('low food and water raise saved alerts; untreated weakness counts down to death and supplies interrupt it',()=>{
  let s=G.create('collapse');s.food=1;s.water=1;const hp=s.hp;assert.equal(G.move(s,19),true);
  assert.equal(s.food,0);assert.equal(s.water,0);assert.equal(s.hp,hp-13);assert.equal(s.weakness,1);assert.equal(s.survivalAlert.severity,'critical');assert.match(s.survivalAlert.title,/饱食与饮水/);assert.ok(G.restore(s));
  assert.equal(G.acknowledge(s,'survivalAlert'),true);G.move(s,25);G.move(s,19);assert.equal(s.weakness,3);assert.equal(s.collapse,3);
  assert.equal(G.supply(s,'food'),true);assert.equal(s.collapse,3);assert.equal(G.supply(s,'water'),true);assert.equal(s.collapse,null);assert.equal(s.weakness,2);
  s=G.create('collapse-fatal');s.food=0;s.water=0;for(let i=0;i<7&&s.phase==='explore';i++)G.move(s,s.position===25?19:25);
  assert.equal(s.phase,'dead');assert.match(s.logs[0].text,/虚弱/);
});
test('powers preserve rarity and upgrade from level one to three with stronger production',()=>{
  const s=G.create('upgrade-power');assert.equal(G.MUTATIONS.endless_chips.maxLevel,3);assert.equal(G.mutationLevel(s,'endless_chips'),1);
  s.phase='mutation';assert.equal(G.mutate(s,'endless_chips'),true);assert.equal(G.mutationLevel(s,'endless_chips'),2);assert.equal(G.mutationCost(s,'endless_chips'),14);
  s.phase='mutation';assert.equal(G.mutate(s,'endless_chips'),true);assert.equal(G.mutationLevel(s,'endless_chips'),3);s.energy=100;
  assert.equal(G.activate(s,'endless_chips'),true);assert.deepEqual(s.consumables,['chips_card','chips_card']);assert.equal(s.stats.produced,2);assert.deepEqual(G.restore(s),s);
});
test('advanced power levels apply their promised combat effects',()=>{
  let s=enterGuardian('power-capacitor');s.mutations.push('living_capacitor');s.mutationLevels.living_capacitor=3;s.energy=20;s.combat.hand=['recharge'];s.combat.dice=[4,0,0];
  assert.equal(G.play(s,0,0),true);assert.equal(s.energy,37);assert.equal(s.combat.dice[0],4);assert.equal(s.combat.electricRefunded,true);
  s=enterGuardian('power-cold');s.mutations.push('cold_field');s.mutationLevels.cold_field=2;s.combat.slow=6;s.combat.intent=0;
  G.endRound(s);assert.ok(s.combat.shield>=6);assert.equal(s.combat.slow,4);
  s=enterGuardian('power-muscle');s.mutations.push('scavenger_muscle');s.mutationLevels.scavenger_muscle=3;s.energy=20;s.consumables=['reinforced_crowbar'];s.pocketUses=[1];
  assert.equal(G.usePocket(s,'reinforced_crowbar',0),true);assert.equal(s.energy,28);assert.deepEqual(s.consumables,[]);
  s=enterGuardian('power-time');s.mutations.push('temporal_spleen');s.mutationLevels.temporal_spleen=2;s.energy=20;s.combat.hand=['dice_rig'];s.combat.dice=[2,3,0];
  assert.equal(G.play(s,0,0),true);assert.equal(s.energy,25);
  s=enterGuardian('power-shell');s.mutations.push('recovery_shell');s.mutationLevels.recovery_shell=2;s.hp=1;s.food=50;s.water=50;s.combat.intent=99;s.combat.shield=0;
  assert.equal(G.endRound(s),true);assert.equal(s.phase,'combat');assert.equal(s.hp,1);assert.equal(s.deathSaveUsed,true);s.combat.intent=99;s.combat.shield=0;G.endRound(s);assert.equal(s.phase,'dead');
});
test('fixed and consumable cards have separate lifetimes and active powers spend shared energy',()=>{
  const s=G.create('active-power');
  assert.ok(s.deck.every(id=>!G.CARDS[id].consumable));assert.deepEqual(s.consumables,[]);
  const energy=s.energy;assert.equal(G.activate(s,'endless_chips'),true);
  assert.equal(s.energy,energy-18);assert.deepEqual(s.consumables,['chips_card']);
  assert.equal(s.discovered.cards.includes('chips_card'),true);
  s.food=50;assert.equal(G.usePocket(s,'chips_card'),true);assert.equal(s.food,75);assert.deepEqual(s.consumables,[]);
  assert.equal(G.usePocket(s,'chips_card'),false);
  const before=s.energy;assert.equal(G.move(s,19),true);assert.equal(s.energy,Math.min(100,before+6));
});
test('combat starts with three action points; production appears immediately and pocket cards need no die',()=>{
  const s=enterGuardian('battle-power');s.energy=100;s.food=50;
  const dice=[...s.combat.dice],ap=s.combat.ap;
  assert.equal(ap,3);assert.equal(G.activate(s,'endless_chips'),true);
  assert.equal(s.combat.ap,2);assert.equal(s.energy,82);assert.equal(s.consumables.at(-1),'chips_card');
  assert.deepEqual(s.combat.dice,dice);assert.equal(G.usePocket(s,'chips_card'),true);assert.equal(s.food,75);
  assert.equal(s.combat.ap,2);assert.deepEqual(s.combat.dice,dice);
  assert.equal(G.recoverEnergy(s),true);assert.equal(s.combat.ap,1);assert.equal(G.recoverEnergy(s),false);
});
test('dice cards add dice up to six while fixed cards return through the discard pile',()=>{
  const s=enterGuardian('extra-dice'),b=s.combat;b.hand=['dice_rig','crowbar'];b.dice=[2,3,4];
  assert.equal(G.play(s,0,0),true);assert.equal(b.dice.filter(Boolean).length,4);assert.ok(b.dice.length<=6);
  b.hand.unshift('dice_rig');assert.equal(G.play(s,0,b.dice.findIndex(Boolean)),true);assert.equal(b.dice.filter(Boolean).length,5);assert.ok(b.dice.length<=6);
  b.hand.unshift('dice_rig');assert.equal(G.play(s,0,b.dice.findIndex(Boolean)),true);assert.equal(b.dice.filter(Boolean).length,6);
  b.hand.unshift('dice_rig');assert.equal(G.play(s,0,b.dice.findIndex(Boolean)),false);
  assert.ok(b.discard.filter(id=>id==='dice_rig').length>=3);
});
test('enemy attacks create one persistent report with shield, health and mental damage',()=>{
  let s=enterGuardian('attack-report'),b=s.combat;b.shield=4;b.intent=11;b.mind=3;const hp=s.hp;
  assert.equal(G.endRound(s),true);assert.deepEqual(s.attackNotice,{enemy:'缝合看守',intent:11,shield:4,damage:7,mind:3,hpBefore:hp,hpAfter:hp-7,starvation:0,poisonTick:0,burnTick:0});
  s=G.restore(s);assert.ok(s.attackNotice);const round=s.combat.round;
  assert.equal(G.acknowledge(s,'attackNotice'),true);assert.equal(s.attackNotice,null);assert.equal(s.combat.round,round);
  assert.equal(G.acknowledge(s,'attackNotice'),false);
});
test('poison ticks before an enemy attack while fuel needs a lighter to become fire damage',()=>{
  const s=enterGuardian('dot-build'),b=s.combat;b.hand=['toxic_needle','fuel_can','lighter'];b.dice=[4,3,2];b.intent=0;b.mind=0;
  const hp=b.hp;
  assert.equal(G.play(s,0,0),true);assert.equal(b.poison,7);assert.equal(b.hp,hp);
  assert.equal(G.play(s,0,1),true);assert.equal(b.fuel,6);assert.equal(b.burn,0);
  assert.equal(G.play(s,0,2),true);assert.equal(b.fuel,0);assert.equal(b.burn,8);
  assert.equal(G.endRound(s),true);assert.equal(b.hp,hp-15);assert.equal(b.poison,5);assert.equal(b.burn,5);
  assert.equal(s.attackNotice.poisonTick,7);assert.equal(s.attackNotice.burnTick,8);
  assert.equal(s.stats.poisonApplied,7);assert.equal(s.stats.burnApplied,8);
});
test('durable consumable cards stay in the pocket until every use is spent',()=>{
  const s=enterGuardian('durable-tools'),b=s.combat;s.mutations.push('metal_memory');s.energy=100;
  assert.equal(G.activate(s,'metal_memory'),true);const i=s.consumables.indexOf('reinforced_crowbar');
  assert.equal(s.pocketUses[i],3);const hp=b.hp;
  assert.equal(G.usePocket(s,'reinforced_crowbar',i),true);assert.equal(s.pocketUses[i],2);assert.equal(b.hp,hp-9);
  assert.equal(G.usePocket(s,'reinforced_crowbar',i),true);assert.equal(s.pocketUses[i],1);
  assert.equal(G.usePocket(s,'reinforced_crowbar',i),true);assert.equal(s.consumables.includes('reinforced_crowbar'),false);
  assert.equal(s.stats.durableUses,3);assert.equal(G.usePocket(s,'reinforced_crowbar'),false);
});
test('entering an interior exit returns directly to the world map and saves its rooms',()=>{
  const s=G.create('direct-exit'),parent=s.map.find(t=>t.type==='hospital').id;s.position=parent;
  assert.equal(G.enterRegion(s),true);const exit=s.region.exit;localTravel(s,exit);
  assert.equal(s.region,null);assert.ok(s.map[parent].localMap);assert.equal(s.position,parent);
});
test('one search can queue multiple independent encounters after its receipt',()=>{
  let s;
  for(let i=0;i<4000;i++){const candidate=G.create('multi-'+i);G.move(candidate,19);G.search(candidate);if(candidate.encounterQueue.length){s=candidate;break;}}
  assert.ok(s);const first=s.phase,queued=s.encounterQueue.length;assert.ok(['combat','event'].includes(first));
  assert.equal(G.acknowledge(s,'searchResult'),true);assert.equal(s.phase,first);
  if(first==='event')G.chooseEvent(s,'leave');
  else {s.combat.hp=1;s.combat.hand=['crowbar'];s.combat.dice=[6,6,6];G.play(s,0,0);G.acknowledge(s,'reward');if(s.phase==='mutation')G.mutate(s,Object.keys(G.MUTATIONS).find(id=>!s.mutations.includes(id)));}
  if(s.notice)G.acknowledge(s,'notice');
  assert.ok(s.encounterQueue.length<queued||['combat','event'].includes(s.phase));
});

function provision(s){if(s.food<30)G.supply(s,'food');if(s.water<30)G.supply(s,'water');if(s.hp<35)G.supply(s,'med');}
function localTravel(s,target){
  while(s.region&&s.region.position!==target){provision(s);const p=s.region.position,x=p%3,tx=target%3;assert.equal(G.moveRegion(s,x<tx?p+1:x>tx?p-1:p<target?p+3:p-3),true);}
}
function travel(s, target) {
  while (s.position !== target && s.phase === 'explore') {
    if(s.region){localTravel(s,s.region.exit);assert.equal(s.region,null);}
    provision(s);
    const x = s.position % 6, tx = target % 6;
    const next = x < tx ? s.position + 1 : x > tx ? s.position - 1 : s.position < target ? s.position + 6 : s.position - 6;
    assert.equal(G.move(s, next), true);
  }
}
function enterGuardian(seed = 'test') {
  const s = G.create(seed);
  const target = s.map.find(t => t.type === 'hospital').id;
  travel(s,target);if(s.region)localTravel(s,4);G.search(s);
  assert.equal(s.phase, 'combat'); return s;
}

test('seeds replay the map, encounters and random rolls', () => {
  const a = G.create('same-seed'), b = G.create('same-seed');
  G.move(a,19); G.search(a); G.move(b,19); G.search(b);
  assert.deepEqual(a,b);
  assert.notDeepEqual(G.create('other-seed').map, a.map);
});
test('500 generated maps keep every objective, starting supplies and connected routes', () => {
  for (let i=0;i<500;i++) {
    const s=G.create(`map-${i}`);
    for (const type of ['shelter','hospital','metro','plant','tower']) assert.equal(s.map.filter(t=>t.type===type).length,1, `${type} missing in ${i}`);
    assert.equal(s.map[19].type,'market');
    const reached=new Set([s.position]), pending=[s.position];
    while(pending.length) for(const n of G.neighbors(pending.shift())) if(!reached.has(n)){reached.add(n);pending.push(n);}
    assert.equal(reached.size,30);
  }
});
test('movement enforces adjacency, reveals neighbors and consumes survival stats', () => {
  const s=G.create('move');
  assert.equal(G.move(s,0),false); assert.equal(s.turn,0);
  assert.equal(G.move(s,19),true); assert.equal(s.food,82); assert.equal(s.water,86); assert.equal(s.san,99);
  for(const n of G.neighbors(19)) assert.equal(s.map[n].revealed,true);
});
test('supplies are consumable, capped, and cannot be wasted at full health', () => {
  const s=G.create('supply'); assert.equal(G.supply(s,'med'),false); assert.equal(s.supplies.med,2);
  s.hp=90; assert.equal(G.supply(s,'med'),true); assert.equal(s.hp,100); assert.equal(s.supplies.med,1);
  s.supplies.food=0; assert.equal(G.supply(s,'food'),false);
  assert.equal(G.supply(s,'__proto__'),false);
});
test('workbench consumes exact costs and refuses unaffordable recipes', () => {
  const s=G.create('craft'); const count=s.deck.length;
  assert.equal(G.craft(s,'molotov'),true); assert.equal(s.scrap,1); assert.equal(s.deck.length,count+1);
  assert.equal(G.craft(s,'med'),false); assert.equal(s.scrap,1);
});
test('card requirements, consumed dice and shield reset work across rounds', () => {
  const s=enterGuardian(); const b=s.combat;
  b.hand=['knife','shield','crowbar']; b.dice=[1,6,4];
  assert.equal(G.play(s,0,0),false); assert.equal(b.dice[0],1);
  const hp=b.hp; assert.equal(G.play(s,0,1),true); assert.equal(b.hp,hp-12); assert.equal(b.dice[1],0);
  assert.equal(G.play(s,0,1),false);
  assert.equal(G.play(s,0,2),true); assert.equal(b.shield,8);
  b.intent=10; const playerHp=s.hp; G.endRound(s);
  assert.equal(s.hp,playerHp-2); assert.equal(b.shield,0); assert.equal(b.round,2); assert.equal(b.hand.length,5);
  assert.equal(b.dice.length,3); assert.ok(b.dice.every(n=>n>=1 && n<=6));
});
test('rerolls have per-round limits and mutations alter combat', () => {
  const s=enterGuardian();
  assert.equal(G.reroll(s,0),true); assert.equal(G.reroll(s,0),false);
  s.mutations=['fortune','iron']; G.endRound(s);
  assert.equal(s.combat.rerolls,2); assert.equal(s.combat.shield,3);
});
test('combat locks exploration and crafting', () => {
  const s=enterGuardian();
  assert.equal(G.move(s,G.neighbors(s.position)[0]),false);
  assert.equal(G.search(s),false); assert.equal(G.craft(s,'food'),false); assert.equal(G.rest(s),false);
});
test('serialized combat restores and continues deterministically', () => {
  const a=enterGuardian('restore'), b=G.restore(JSON.stringify(a));
  assert.ok(b); G.reroll(a,0); G.reroll(b,0); G.endRound(a); G.endRound(b); assert.deepEqual(a,b);
  assert.equal(G.restore('broken-json'),null); assert.equal(G.restore('{"version":1}'),null);
  const bad=JSON.parse(JSON.stringify(a)); bad.combat.dice=[9,0,0]; assert.equal(G.restore(bad),null);
});
test('health and SAN can both end a run; terminal states reject actions', () => {
  const s=G.create('death'); s.food=0;s.water=0;s.hp=10;G.move(s,19);
  assert.equal(s.phase,'dead'); assert.equal(s.hp,0); assert.equal(G.supply(s,'med'),false);
  const m=G.create('mind');m.san=1;G.move(m,19);assert.equal(m.phase,'dead');
});
test('event choice is one-time and SAN loss can be fatal', () => {
  const s=G.create('event');s.map[19].type='anomaly';G.move(s,19);G.search(s);
  assert.equal(s.phase,'event');const cards=s.deck.length;s.san=10;
  assert.equal(G.chooseEvent(s,'accept'),true);assert.equal(s.phase,'dead');assert.equal(s.deck.length,cards+1);
  assert.equal(G.chooseEvent(s,'accept'),false);
});
test('three guardians unlock the tower and victory terminates the run', () => {
  const s=G.create('objectives');
  // Isolate progression from combat balance by preparing a finishing strike.
  for(const type of ['hospital','metro','plant','tower']){
    s.food=100;s.water=100;s.san=100;s.hp=100;
    const tile=s.map.find(t=>t.type===type);travel(s,tile.id);if(s.region)localTravel(s,4);G.search(s);
    assert.equal(s.phase,'combat');s.combat.hp=1;s.combat.hand=['crowbar'];s.combat.dice=[6,6,6];
    assert.equal(G.play(s,0,0),true);
    assert.equal(G.acknowledge(s,'reward'),true);
    if(s.phase==='mutation') G.mutate(s,Object.keys(G.MUTATIONS).find(id=>!s.mutations.includes(id)));
    assert.equal(tile.cleared,true);
  }
  assert.equal(s.cores,3);assert.equal(s.phase,'victory');assert.equal(s.kills,4);
  assert.equal(G.move(s,4),false);
});
test('the final tower stays locked before collecting cores', () => {
  const s=G.create('locked');travel(s,5);assert.equal(G.search(s),false);assert.equal(s.map[5].searched,false);
});
test('retreat never duplicates loot; guardians remain retryable', () => {
  const s=enterGuardian('escape');const tile=s.map[s.position];s.rng=123456789;
  for(let i=0;i<10 && s.phase==='combat';i++){s.hp=100;G.flee(s);}
  assert.equal(s.phase,'explore');assert.equal(tile.searched,false);
  const n=enterGuardian('escape2');n.combat.kind='normal';const normalTile=n.map[n.position];
  n.rng=123456789;
  for(let i=0;i<10 && n.phase==='combat';i++){n.hp=100;G.flee(n);}
  assert.equal(n.phase,'explore');assert.equal(normalTile.searched,true);
});
