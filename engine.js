/* Portable game rules. No DOM or platform APIs; usable in HTML or mini programs. */
(function (root, factory) {
  const content = typeof module === 'object' && module.exports ? require('./content.js') : root.FaultlandContent;
  const api = factory(content || {EXTRA_CARDS:{},EXTRA_MUTATIONS:{},EXTRA_EVENTS:{}});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Faultland = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONTENT) {
  'use strict';
  const VERSION = 1;
  const WIDTH = 6, HEIGHT = 5;
  const CARDS = {
    crowbar: { name: '生锈撬棍', type: '攻击', icon: 'crowbar', desc: '造成 骰点 + 3 点伤害', rule: '任意骰子', min: 1, color: 'orange' },
    knife: { name: '碎片短刃', type: '攻击', icon: 'knife', desc: '造成 骰点 × 2 点伤害', rule: '需要 3 点及以上', min: 3, color: 'orange' },
    shield: { name: '路牌盾', type: '防御', icon: 'shield', desc: '获得 骰点 + 4 点护盾', rule: '任意骰子', min: 1, color: 'blue' },
    bandage: { name: '应急绷带', type: '治疗', icon: 'bandage', desc: '恢复 骰点 + 4 点健康', rule: '任意骰子', min: 1, color: 'green' },
    spark: { name: '电弧碎片', type: '异能', icon: 'spark', desc: '造成 骰点 × 3 点伤害，消耗 3 SAN', rule: '需要 4 点及以上', min: 4, color: 'purple' },
    molotov: { name: '燃烧瓶', type: '燃烧', icon: 'firebottle', desc: '造成 骰点 + 4 点伤害，并附加 4 点燃烧', rule: '需要 2 点及以上', min: 2, color: 'orange' },
    focus: { name: '旧日照片', type: '精神', icon: 'photo', desc: '恢复 骰点 + 5 点 SAN', rule: '任意骰子', min: 1, color: 'purple' }
  };
  Object.assign(CARDS, {
    dice_rig:{name:'幸运扳机',type:'运气',icon:'dice',desc:'消耗一枚骰子，新增 2 枚随机骰子；可用骰子上限 6',rule:'任意骰子；可用骰子少于 6',min:1,color:'gold'},
    recharge:{name:'手摇充电器',type:'恢复',icon:'energy',desc:'恢复 骰点 + 10 精力',rule:'任意骰子',min:1,color:'blue'},
    chips_card:{name:'凭空薯片',type:'补给',icon:'chips',desc:'恢复 25 饱食。使用后消耗一张，战斗内外均可使用。',rule:'无需骰子或行动值',min:0,color:'gold',consumable:true,stat:'food',amount:25,sell:2},
    charge_card:{name:'瓶装精神',type:'恢复',icon:'energy',desc:'恢复 25 精力。使用后消耗一张，战斗内外均可使用。',rule:'无需骰子或行动值',min:0,color:'blue',consumable:true,stat:'energy',amount:25,sell:3},
    dice_cache:{name:'口袋好运',type:'运气',icon:'dice',desc:'新增 2 枚随机骰子，可用上限 6。使用后消耗一张。',rule:'仅战斗，无需骰子或行动值',min:0,color:'purple',consumable:true,sell:3},
    toxic_needle:{name:'菌毒吹针',type:'毒蚀',icon:'toxin',desc:'对敌人附加 骰点 + 3 层中毒；敌方行动前结算并逐回合衰减',rule:'需要 2 点及以上',min:2,color:'green'},
    fuel_can:{name:'漏油燃料罐',type:'燃烧',icon:'fuel',desc:'给敌人泼上 骰点 + 3 层燃料，等待火源引燃',rule:'任意骰子',min:1,color:'orange'},
    lighter:{name:'一次性打火机',type:'燃烧',icon:'lighter',desc:'点燃全部燃料，附加 燃料层数 + 骰点 的燃烧',rule:'任意骰子；有燃料时效果更强',min:1,color:'orange'},
    venom_ampoule:{name:'浓缩毒囊',type:'毒蚀',icon:'toxin',desc:'立即附加 10 层中毒；敌方每次行动前受到伤害',rule:'仅战斗 · 使用后消耗',min:0,color:'green',consumable:true,effect:'poison',amount:10,sell:4},
    reinforced_crowbar:{name:'异化撬棍',type:'蛮力',icon:'crowbar',desc:'无需骰子造成 9 点物理伤害，可连续使用 3 次',rule:'仅战斗 · 耐久耗尽后消失',min:0,color:'orange',consumable:true,effect:'damage',amount:9,durability:3,sell:6},
    firestarter:{name:'防风打火机',type:'燃烧',icon:'lighter',desc:'点燃全部燃料并额外附加 6 点燃烧，可使用 3 次',rule:'仅战斗 · 耐久 3',min:0,color:'orange',consumable:true,effect:'ignite',amount:6,durability:3,sell:5},
    armor_plate:{name:'骨质护甲片',type:'防御',icon:'armor',desc:'立即获得 10 点护盾，可使用 2 次',rule:'仅战斗 · 耐久 2',min:0,color:'blue',consumable:true,effect:'shield',amount:10,durability:2,sell:5},
    stimulant:{name:'肾上腺针',type:'连动',icon:'syringe',desc:'恢复 12 精力并获得 1 行动值',rule:'仅战斗 · 使用后消耗',min:0,color:'purple',consumable:true,effect:'stimulant',amount:12,sell:4},
    shock_bomb:{name:'罐装闪电',type:'爆发',icon:'spark',desc:'无需骰子，立即造成 10 点伤害',rule:'仅战斗 · 使用后消耗',min:0,color:'purple',consumable:true,effect:'damage',amount:10,sell:4}
  });
  Object.assign(CARDS,CONTENT.EXTRA_CARDS);
  const RARITIES={common:{name:'普通',weight:55,color:'#6f7c6d'},uncommon:{name:'精良',weight:27,color:'#3e8560'},rare:{name:'稀有',weight:12,color:'#3978a6'},epic:{name:'史诗',weight:5,color:'#8653a5'},legendary:{name:'传说',weight:1,color:'#b77724'}};
  const CARD_RARITIES={crowbar:'common',knife:'common',shield:'common',bandage:'common',spark:'rare',molotov:'uncommon',focus:'common',dice_rig:'uncommon',recharge:'uncommon',chips_card:'common',charge_card:'uncommon',dice_cache:'rare',toxic_needle:'common',fuel_can:'common',lighter:'uncommon',venom_ampoule:'uncommon',reinforced_crowbar:'rare',firestarter:'rare',armor_plate:'rare',stimulant:'rare',shock_bomb:'epic'};
  const CARD_SCHOOLS={crowbar:'蛮力',knife:'蛮力',shield:'防御',bandage:'生存',spark:'电能',molotov:'燃烧',focus:'精神',dice_rig:'骰运',recharge:'电能',chips_card:'生存',charge_card:'电能',dice_cache:'骰运',toxic_needle:'毒蚀',fuel_can:'燃烧',lighter:'燃烧',venom_ampoule:'毒蚀',reinforced_crowbar:'蛮力',firestarter:'燃烧',armor_plate:'防御',stimulant:'电能',shock_bomb:'电能'};
  for(const [id,c] of Object.entries(CARDS)){c.category=c.consumable?'消耗卡牌':'固有卡牌';c.school=c.school||CARD_SCHOOLS[id]||c.type;c.rarity=c.rarity||CARD_RARITIES[id]||'common';}
  const FIXED_CARDS=Object.keys(CARDS).filter(id=>!CARDS[id].consumable);
  const POCKET_CARDS=Object.keys(CARDS).filter(id=>CARDS[id].consumable);
  const TERRAIN = {
    shelter: { name: '避难所', icon: 'shelter', kind: '安全区', desc: '锈蚀的铁门依然挡得住外面的东西。可以在这里休息，整理装备。', color: 'green' },
    ruins: { name: '居民废墟', icon: 'ruins', kind: '废弃区块', desc: '生活曾经在这里发生。碎裂的窗后，偶尔传来拖动家具的声响。', color: 'gray' },
    market: { name: '废弃商店', icon: 'market', kind: '物资区块', desc: '货架几乎被搬空了。柜台下面，也许还藏着一顿明天的晚餐。', color: 'gold' },
    water: { name: '积水街道', icon: 'water', kind: '物资区块', desc: '雨水从破裂的管道滴落。仔细过滤之后，应该还能喝。', color: 'blue' },
    anomaly: { name: '异常裂隙', icon: 'anomaly', kind: '异常区块', desc: '光在这里失去了方向。你感到有什么东西，正在回应你的意识。', color: 'purple' },
    hospital: { name: '圣灰医院', icon: 'hospital', kind: '核心据点', desc: '广播仍在呼叫不存在的医生。击败盘踞此处的异变体，夺取核心。', color: 'orange' },
    metro: { name: '沉没地铁', icon: 'metro', kind: '核心据点', desc: '最后一班列车从未离站。隧道深处，有一颗核心在搏动。', color: 'orange' },
    plant: { name: '废旧电厂', icon: 'plant', kind: '核心据点', desc: '整座城市早已停电，这里却仍有电流声。找出它的源头。', color: 'orange' },
    tower: { name: '零号信号塔', icon: 'tower', kind: '最终目标', desc: '迷雾从塔顶不断涌出。用三枚异变核心打开封锁，终止这场噩梦。', color: 'red' }
  };
  const MUTATIONS = {
    iron: { name: '铁皮共生', desc: '每回合自动获得 3 点护盾。你的皮肤开始浮现铁锈。', icon: 'shield' },
    hunger: { name: '残响汲取', desc: '击败异变体后恢复 12 点健康。它们的残响，成为你的养分。', icon: 'heart' },
    fortune: { name: '概率扭曲', desc: '每回合额外获得 1 次免费重掷。命运出现了一道裂痕。', icon: 'dice' }
  };
  Object.assign(MUTATIONS,{
    endless_chips:{name:'无限多薯片',desc:'消耗 18 精力，生产 1 张凭空薯片。战斗中另需 1 行动值。',icon:'chips',active:true,cost:18,produces:'chips_card'},
    spark_brewer:{name:'精神装瓶',desc:'消耗 35 精力，生产 1 张瓶装精神，可保存、使用或交易。战斗中另需 1 行动值。',icon:'energy',active:true,cost:35,produces:'charge_card'},
    lucky_pockets:{name:'好运口袋',desc:'消耗 24 精力，生产 1 张口袋好运。战斗中另需 1 行动值。',icon:'dice',active:true,cost:24,produces:'dice_cache'}
    ,toxin_gland:{name:'毒囊增生',desc:'消耗 22 精力，生产 1 张浓缩毒囊。适合持续伤害流派。',icon:'toxin',active:true,cost:22,produces:'venom_ampoule'}
    ,metal_memory:{name:'金属记忆',desc:'消耗 30 精力，生产 1 张拥有 3 点耐久的异化撬棍。',icon:'crowbar',active:true,cost:30,produces:'reinforced_crowbar'}
    ,inner_furnace:{name:'内燃器官',desc:'消耗 26 精力，生产 1 张拥有 3 点耐久的防风打火机。',icon:'lighter',active:true,cost:26,produces:'firestarter'}
    ,bone_forge:{name:'骨骼锻造',desc:'消耗 28 精力，生产 1 张拥有 2 点耐久的骨质护甲片。',icon:'armor',active:true,cost:28,produces:'armor_plate'}
    ,overclock:{name:'神经超频',desc:'消耗 24 精力，生产 1 张能恢复精力并增加行动值的肾上腺针。',icon:'syringe',active:true,cost:24,produces:'stimulant'}
    ,toxic_blood:{name:'共生毒血',desc:'敌人的中毒每回合只衰减 1 层，让持续伤害维持更久。',icon:'toxin'}
    ,combustion_core:{name:'燃烧核心',desc:'每次点燃额外附加 3 点燃烧，燃烧衰减降低为 2 层。',icon:'firebottle'}
    ,brute_force:{name:'暴力适应',desc:'撬棍、短刃与其它物理攻击额外造成 2 点伤害。',icon:'crowbar'}
  });
  Object.assign(MUTATIONS,CONTENT.EXTRA_MUTATIONS);
  const MUTATION_RARITIES={iron:'common',hunger:'uncommon',fortune:'rare',endless_chips:'common',spark_brewer:'uncommon',lucky_pockets:'rare',toxin_gland:'uncommon',metal_memory:'rare',inner_furnace:'rare',bone_forge:'rare',overclock:'epic',toxic_blood:'rare',combustion_core:'epic',brute_force:'uncommon'};
  for(const [id,m] of Object.entries(MUTATIONS)){m.rarity=m.rarity||MUTATION_RARITIES[id]||'common';if(m.active&&!(m.maxLevel>1)){m.maxLevel=3;m.levels=['解锁卡牌生产','催发精力消耗 −4','每次催发生产 2 张'];}else{m.maxLevel=m.maxLevel||1;if(!m.levels&&m.maxLevel>1)m.levels=Array.from({length:m.maxLevel},(_,i)=>`等级 ${i+1}`);}}
  const ITEMS = {
    food: {name:'罐头',icon:'food',type:'消耗品',desc:'保存完好的应急口粮。使用后恢复 35 饱食，最多恢复到 100。',note:'搜寻商店更容易获得，也能用 3 零件制作。'},
    water: {name:'净水',icon:'bottle',type:'消耗品',desc:'过滤后的饮用水。使用后恢复 35 水分，最多恢复到 100。',note:'积水街道更容易获得，也能用 3 零件制作。'},
    med: {name:'急救包',icon:'med',type:'消耗品',desc:'清洁敷料与基础药品。使用后恢复 30 健康，也可以用来救助陌生人。',note:'可用 4 零件制作。救人需要消耗 1 个急救包。'},
    scrap: {name:'零件',icon:'scrap',type:'制作材料',desc:'齿轮、金属片与还能用的螺丝。能在工作台制作补给或卡牌，也能向商人购买物品。',note:'搜寻、战斗以及分解多余卡牌都能得到零件。'},
    core: {name:'异变核心',icon:'core',type:'任务物品',desc:'医院、地铁与电厂的守卫各携带一枚。集齐三枚，才能打开零号信号塔。',note:'任务物品不能消耗或分解。'}
  };
  Object.assign(ITEMS,{
    chips:{name:'袋装薯片',icon:'chips',type:'消耗物资',desc:'搜寻发现的普通薯片，使用后恢复 20 饱食。与异能生产的凭空薯片卡分别储存。',note:'可搜寻获得，也可能出现在商人货架上。'},
    coffee:{name:'浓缩咖啡',icon:'coffee',type:'消耗物资',desc:'使用后恢复 30 精力，最高恢复到 100。',note:'可搜寻、战利品掉落、购买或用 4 零件制作。'}
  });
  const SUPPLY_EFFECTS={food:['food',35],water:['water',35],med:['hp',30],chips:['food',20],coffee:['energy',30]};
  const EVENTS = {
    whisper:{title:'裂隙中的低语',icon:'anomaly',text:'悬浮的玻璃映出另一个你。对方握着一束电弧，示意你用一点理智来交换。',choices:[['accept','接受共鸣','消耗 12 理智，获得电弧碎片卡与 4 零件'],['leave','远离裂隙','恢复 5 理智']]},
    injured:{title:'废墟里的求救声',icon:'heart',text:'一个受伤的陌生人蜷缩在倒塌的货架旁。他说自己和同伴走散了。你看不出这是否是一个圈套。',choices:[['help','给他包扎伤口','消耗 1 急救包；可能遭到背叛，也可能在之后得到帮助'],['leave','留下警告，继续走','保留物资，不承担这次风险']]},
    merchant:{title:'流动商人的小摊',icon:'backpack',text:'一辆改装三轮车停在路边。商人敲了敲车厢：“零件换物资，不赊账。”他的货架和价格每次都不一样。',choices:[['leave','收起背包，离开','本次交易结束，商人随后离开']]},
    rescue_team:{title:'野外救助队',icon:'med',text:'几名志愿者在一面白旗下搭起临时救护点。他们愿意帮你处理伤口，也正在为伤员寻找食物。',choices:[['treat','接受免费救治','恢复 30 健康、12 理智；每次相遇限一次'],['share','分享口粮，协助救治','消耗 1 罐头；恢复 35 健康、20 理智，获得 1 净水'],['leave','向他们道谢后离开','不消耗物资']]},
    cache:{title:'被铁丝锁住的箱子',icon:'wrench',text:'一只沉重的工具箱藏在楼梯下。锁扣上缠着铁丝，里面隐约传来金属滚动的声音。',choices:[['force','用力撬开','可能获得卡牌与零件，也可能触发陷阱'],['careful','用零件拆掉锁扣','消耗 2 零件，安全获得 1 急救包'],['leave','记下位置，不冒险','保留当前物资']]},
    stranger:{title:'路口的交换',icon:'map',text:'一个蒙面旅人说自己知道核心据点的位置。他想用消息换一瓶水，但那张地图实在太旧了。',choices:[['exchange','给他一瓶水','消耗 1 净水；可能发现核心据点，也可能买到假情报'],['leave','靠自己的脚走出去','保留净水']]}
  };
  EVENTS.rescue_team.choices.splice(2,0,['share_card','分享一张凭空薯片','消耗 1 张凭空薯片卡；健康 +25、理智 +15，获得 1 浓缩咖啡']);
  EVENTS.stranger.choices.splice(1,0,['pay_card','用瓶装精神交换','消耗 1 张瓶装精神卡；同样可能获得情报或被骗']);
  Object.assign(EVENTS,CONTENT.EXTRA_EVENTS);
  const STAT_KEYS = ['searches','cardsFound','crafted','salvaged','helped','donated','betrayed','futureAid','trades','teamTreats','risks','skipped','attacks','shields','sparkUses','rerolls','flees','anomalies','produced','pocketUsed','sold','energyRecovered','poisonApplied','burnApplied','durableUses'];
  const newStats = () => Object.fromEntries(STAT_KEYS.map(k=>[k,0]));
  const ACHIEVEMENTS = [
    {id:'first_find',name:'这趟没白来',desc:'完成一次搜寻',icon:'backpack',target:1,stat:'searches'},
    {id:'card_finder',name:'破烂里的王牌',desc:'一局搜寻获得 3 张卡牌',icon:'photo',target:3,stat:'cardsFound'},
    {id:'helping_hand',name:'伸出的那只手',desc:'救助一位受伤陌生人',icon:'heart',target:1,stat:'helped'},
    {id:'betrayed',name:'善意的伤口',desc:'遭遇一次救援后的背叛',icon:'shield',target:1,stat:'betrayed'},
    {id:'returned',name:'善意有回声',desc:'在后续探索中收到被救者的帮助',icon:'sun',target:1,stat:'futureAid'},
    {id:'field_aid',name:'白旗下的喘息',desc:'接受一次野外救助队的帮助',icon:'med',target:1,stat:'teamTreats'},
    {id:'trader',name:'废土生意人',desc:'一局向商人购买 3 次',icon:'backpack',target:3,stat:'trades'},
    {id:'maker',name:'破烂发明家',desc:'一局制作 5 件物品',icon:'wrench',target:5,stat:'crafted'},
    {id:'fighter',name:'街区清道夫',desc:'一局击败 5 只异变体',icon:'knife',target:5,field:'kills'},
    {id:'explorer',name:'把路走出来',desc:'一局踏足 20 个区块',icon:'map',target:20,field:'visited'},
    {id:'awakened',name:'已经不是普通人',desc:'一局觉醒 3 项异能',icon:'spark',target:3,field:'mutations'},
    {id:'core_keeper',name:'三枚微光',desc:'一局集齐 3 枚异变核心',icon:'core',target:3,field:'cores'},
    {id:'dawn',name:'明天见',desc:'击败最终首领，活到黎明',icon:'sun',target:1,field:'victory'}
  ];
  ACHIEVEMENTS.push(
    {id:'first_production',name:'脑子里有零食',desc:'用异能生产一张消耗卡牌',icon:'chips',target:1,stat:'produced'},
    {id:'card_library',name:'全套破烂',desc:'累计发现全部卡牌',icon:'photo',target:Object.keys(CARDS).length,field:'cardLibrary'},
    {id:'mutation_library',name:'异能观察员',desc:'累计觉醒全部异能',icon:'spark',target:Object.keys(MUTATIONS).length,field:'mutationLibrary'}
  );
  ACHIEVEMENTS.push(
    {id:'toxicologist',name:'绿色倒计时',desc:'一局累计附加 30 层中毒',icon:'toxin',target:30,stat:'poisonApplied'},
    {id:'firekeeper',name:'别靠近火源',desc:'一局累计附加 30 层燃烧',icon:'lighter',target:30,stat:'burnApplied'},
    {id:'tool_until_breaks',name:'还能再撬一下',desc:'一局使用 6 次耐久卡牌',icon:'crowbar',target:6,stat:'durableUses'}
  );
  ACHIEVEMENTS.push(
    {id:'rarity_spectrum',name:'五色废品谱',desc:'累计发现每档稀有度至少一张卡牌',icon:'photo',target:Object.keys(RARITIES).length,field:'cardRarities'},
    {id:'legendary_card',name:'传说也能捡到',desc:'累计发现一张传说卡牌',icon:'sun',target:1,field:'legendaryCards'},
    {id:'first_upgrade',name:'身体记住了',desc:'将一项异能升级到 Lv.2',icon:'spark',target:1,field:'upgradedPowers'},
    {id:'mastered_power',name:'异变完全体',desc:'将一项可升级异能升至最高等级',icon:'anomaly',target:1,field:'maxedPowers'}
  );
  function achievementProgress(s,a){
    if(a.stat)return s.stats[a.stat];
    if(a.field==='cardLibrary')return s.discovered.cards.length;if(a.field==='mutationLibrary')return s.discovered.mutations.length;
    if(a.field==='cardRarities')return new Set(s.discovered.cards.map(id=>CARDS[id].rarity)).size;
    if(a.field==='legendaryCards')return s.discovered.cards.filter(id=>CARDS[id].rarity==='legendary').length;
    if(a.field==='upgradedPowers')return Object.values(s.mutationLevels||{}).filter(level=>level>=2).length;
    if(a.field==='maxedPowers')return Object.entries(s.mutationLevels||{}).filter(([id,level])=>MUTATIONS[id].maxLevel>1&&level>=MUTATIONS[id].maxLevel).length;
    if(a.field==='visited')return s.map.filter(t=>t.visited).length;if(a.field==='mutations')return s.mutations.length;if(a.field==='victory')return Number(s.phase==='victory');return s[a.field]||0;
  }
  function achievements(s){return ACHIEVEMENTS.map(a=>({...a,progress:Math.min(a.target,achievementProgress(s,a))}));}
  function personality(s){
    const m=s.stats;
    const choices=[
      {id:'keeper',name:'废土守灯人',icon:'heart',score:m.helped*4+m.donated*3,desc:'世界教你提防陌生人，你仍然愿意为别人留下一点光。',evidence:`救助陌生人 ${m.helped} 次，分享物资 ${m.donated} 次`},
      {id:'maker',name:'破烂发明家',icon:'wrench',score:m.crafted*3+m.salvaged*2,desc:'在别人眼里是废物，在你手里却是解决问题的办法。',evidence:`制作 ${m.crafted} 次，分解卡牌 ${m.salvaged} 次`},
      {id:'gambler',name:'命运讨价人',icon:'dice',score:m.risks*4+m.rerolls/3,desc:'你习惯在不确定中寻找机会，也愿意承担选错的代价。',evidence:`冒险选择 ${m.risks} 次，重掷 ${m.rerolls} 次`},
      {id:'toxicologist',name:'毒雾调配师',icon:'toxin',score:m.poisonApplied/4,desc:'你让毒素替自己战斗，等待绿色侵蚀一点点吞没敌人。',evidence:`累计附加 ${m.poisonApplied} 层中毒`},
      {id:'firekeeper',name:'余烬收藏家',icon:'lighter',score:m.burnApplied/4,desc:'燃料、火星与耐心在你手里组成了一场不会立刻熄灭的火。',evidence:`累计附加 ${m.burnApplied} 层燃烧`},
      {id:'mutant',name:'异变共生者',icon:'spark',score:m.anomalies*5+m.sparkUses*1.5,desc:'你没有回避身体里的异常，而是学会与它一起活下去。',evidence:`接受裂隙 ${m.anomalies} 次，使用电弧 ${m.sparkUses} 次`},
      {id:'fighter',name:'街区清道夫',icon:'knife',score:s.kills*1.2+m.attacks/5,desc:'你用手边的武器，一步步为自己清出了一条路。',evidence:`击败 ${s.kills} 只异变体，攻击出牌 ${m.attacks} 次`},
      {id:'ranger',name:'谨慎独行客',icon:'compass',score:m.skipped*3+m.flees*2+m.shields/3,desc:'你知道活下去不只有硬拼。观察、保留和撤离也是选择。',evidence:`避开风险 ${m.skipped} 次，成功撤退 ${m.flees} 次`}
    ];
    const best=choices.reduce((a,b)=>b.score>a.score?b:a);
    return best.score>0?best:{id:'wanderer',name:'未完的拾荒者',icon:'backpack',score:0,desc:'你的手记还很短，但每一步都算数。',evidence:`走过 ${s.map.filter(t=>t.visited).length} 个区块`};
  }
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  function hash(seed) { let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 || 1; }
  function random(s) { let x = s.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; s.rng = x >>> 0; return s.rng / 4294967296; }
  const pick = (s, a) => a[Math.floor(random(s) * a.length)];
  function shuffle(s, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function rarityRank(id){return ['common','uncommon','rare','epic','legendary'].indexOf(id);}
  function pickByRarity(s,defs,filter=()=>true,min='common'){
    const entries=Object.entries(defs).filter(([id,v])=>filter(id,v)&&rarityRank(v.rarity)>=rarityRank(min));if(!entries.length)return null;
    const tiers=[...new Set(entries.map(([,v])=>v.rarity))],weighted=[];for(const tier of tiers)for(let i=0;i<(RARITIES[tier]?.weight||1);i++)weighted.push(tier);
    const selected=pick(s,weighted);return pick(s,entries.filter(([,v])=>v.rarity===selected))[0];
  }
  const pickCard=(s,filter,min)=>pickByRarity(s,CARDS,filter,min);
  function log(s, text, tone = 'normal') { s.logs.unshift({ text, tone, turn: s.turn }); s.logs = s.logs.slice(0, 50); }
  function neighbors(i) { const x = i % WIDTH, y = Math.floor(i / WIDTH); return [x > 0 ? i - 1 : -1, x < WIDTH - 1 ? i + 1 : -1, y > 0 ? i - WIDTH : -1, y < HEIGHT - 1 ? i + WIDTH : -1].filter(n => n >= 0); }
  function reveal(s) { for (const id of [s.position, ...neighbors(s.position)]) s.map[id].revealed = true; s.map[s.position].visited = true; }
  function create(seed) {
    seed = String(seed || Date.now().toString(36)).slice(0, 32);
    const s = { version: VERSION, seed, rng: hash(seed), turn: 0, position: 25, hp: 100, food: 85, water: 90, san: 100, scrap: 7,
      energy:60,consumables:[],pocketUses:[],discovered:{cards:[],mutations:['endless_chips']},reward:null,encounterQueue:[],region:null,mutationLevels:{endless_chips:1},mutationOffer:null,
      supplies: { food: 3, water: 3, med: 2, chips:1, coffee:1 }, cores: 0, kills: 0, mutations: ['endless_chips'], deck: ['crowbar', 'crowbar', 'knife', 'shield', 'bandage', 'focus', 'molotov', 'dice_rig', 'recharge', 'toxic_needle', 'fuel_can', 'lighter'],
      phase: 'explore', combat: null, event: null, eventData: null, notice: null, attackNotice: null, survivalAlert:null, survivalFlags:{foodLow:false,waterLow:false,foodEmpty:false,waterEmpty:false},weakness:0,collapse:null,deathSaveUsed:false,pending: [], travel: 0, stats: newStats(), personality: null, searchResult: null, logs: [], lastDice: [], restCount: 0,
      map: Array.from({ length: WIDTH * HEIGHT }, (_, id) => ({ id, type: 'ruins', revealed: false, visited: false, searched: false, cleared: false })) };
    s.map.forEach(t => { t.type = pick(s, ['ruins', 'ruins', 'market', 'water', 'anomaly']); });
    s.map[25].type = 'shelter'; s.map[5].type = 'tower';
    const spots = shuffle(s, Array.from({ length: 22 }, (_, i) => i).filter(i => i !== 5 && i !== 19));
    ['hospital', 'metro', 'plant'].forEach((type, i) => { s.map[spots[i * 5]].type = type; });
    // A readable first step, with enough supplies to learn the loop.
    s.map[19].type = 'market'; s.map[24].type = 'water'; s.map[26].type = 'ruins';
    s.discovered.cards=[...new Set(s.deck)];
    s.map.forEach(t=>{t.hasInterior=['hospital','metro'].includes(t.type)||(t.type==='ruins'&&![19,24,26].includes(t.id)&&random(s)<.22);t.localMap=null;});
    reveal(s); log(s, '你在第七避难所醒来。收集三枚异变核心，前往零号信号塔。', 'good');
    return s;
  }
  function finish(s, won, reason) { s.phase = won ? 'victory' : 'dead'; s.combat = null; s.event = null; s.eventData=null;s.notice=null;s.searchResult=null;s.encounterQueue=[];s.personality=personality(s);log(s, reason, won ? 'good' : 'danger'); }
  function mutationLevel(s,id){return s.mutationLevels?.[id]||Number(s.mutations.includes(id));}
  function statCap(s,stat){if(stat==='energy'&&mutationLevel(s,'living_capacitor')>=1)return 110;if(stat==='san'&&mutationLevel(s,'lucid_core')>=2)return 110;return 100;}
  function addStat(s,stat,amount){s[stat]=clamp(s[stat]+amount,0,statCap(s,stat));return s[stat];}
  function relieveWeakness(s,amount=1){if(s.food>0&&s.water>0){s.collapse=null;s.weakness=Math.max(0,s.weakness-amount);}}
  function survivalWarning(s,stat,empty){
    const key=stat+(empty?'Empty':'Low');if(s.survivalFlags[key])return;s.survivalFlags[key]=true;
    const label=stat==='food'?'饱食':'饮水';s.survivalAlert={stat,severity:empty?'critical':'warning',title:empty?`${label}已经见底`:`${label}即将耗尽`,text:empty?`继续行动会损失健康并加深虚弱。虚弱 III 后进入昏厥倒计时；补充食物和水可以中止倒计时。`:`当前${label}只剩 ${s[stat]}。请尽快搜寻、制作或使用补给。`};
  }
  function check(s) {
    for (const k of ['hp', 'food', 'water', 'san', 'energy']) s[k] = clamp(s[k],0,statCap(s,k));
    if (s.hp <= 0&&mutationLevel(s,'recovery_shell')>=2&&!s.deathSaveUsed){s.hp=1;s.deathSaveUsed=true;s.collapse=null;log(s,'复苏外壳替你承受了致命一击：健康保留 1 点。','good');}
    else if (s.hp <= 0) finish(s, false, '你的脚步停在了废土上。下一位拾荒者，会走得更远。');
    else if (s.san <= 0) finish(s, false, '你终于听懂了迷雾里的声音。只是再也想不起自己的名字。');
  }
  function tick(s, food = 3, water = 4, san = 1) {
    const ration=Math.min(food,mutationLevel(s,'ration_stomach')>=1?1:0),recycle=Math.min(water,mutationLevel(s,'water_recycler')>=1?1:0);
    s.turn++; addStat(s,'energy',6); s.food = clamp(s.food - food+ration); s.water = clamp(s.water - water+recycle); s.san = clamp(s.san - san,0,statCap(s,'san'));
    if(s.food<=20)survivalWarning(s,'food',!s.food);else{s.survivalFlags.foodLow=false;s.survivalFlags.foodEmpty=false;}
    if(s.water<=20)survivalWarning(s,'water',!s.water);else{s.survivalFlags.waterLow=false;s.survivalFlags.waterEmpty=false;}
    if(s.survivalAlert&&s.food<=20&&s.water<=20){const critical=!s.food||!s.water;s.survivalAlert={stat:'water',severity:critical?'critical':'warning',title:!s.food&&!s.water?'饱食与饮水都已见底':'饱食与饮水都偏低',text:critical?'继续行动会损失健康并加深虚弱。虚弱 III 后进入昏厥倒计时；同时补回食物和水可以中止倒计时。':`当前饱食 ${s.food}、饮水 ${s.water}。请尽快搜寻、制作或使用补给。`};}
    const deprived=!s.food||!s.water;
    if (!s.food) { const n=Math.max(1,5-(mutationLevel(s,'ration_stomach')>=2?2:0));s.hp -= n; log(s, `饥饿正在侵蚀身体：健康 −${n}。`, 'danger'); }
    if (!s.water) { const n=Math.max(1,8-(mutationLevel(s,'water_recycler')>=3?3:0));s.hp -= n; log(s, `严重脱水：健康 −${n}。`, 'danger'); }
    if(deprived){s.weakness=Math.min(3,s.weakness+1);if(s.weakness===3){const grace=3+(mutationLevel(s,'ration_stomach')>=3?2:0);s.collapse=s.collapse===null?grace:s.collapse-1;log(s,`虚弱 III：若仍无法补给，${Math.max(0,s.collapse)} 次行动后将昏厥死亡。`,'danger');if(s.collapse<=0){finish(s,false,'饥渴与虚弱耗尽了最后一点力气。你的视野在废土上慢慢熄灭。');return;}}}
    else {s.collapse=null;s.weakness=Math.max(0,s.weakness-1);}
    check(s);
  }
  function move(s, id) {
    if (s.phase !== 'explore' || s.region || s.notice || s.reward || s.searchResult || s.encounterQueue.length || !neighbors(s.position).includes(id)) return false;
    s.position = id; s.travel++; reveal(s); tick(s);
    if (s.phase === 'explore') {log(s, `进入${TERRAIN[s.map[id].type].name}。`);resolveFuture(s);if(s.phase==='explore'&&s.map[id].hasInterior)enterRegion(s);}
    return true;
  }
  function supply(s, kind) {
    if(!['explore','combat'].includes(s.phase)||!Object.hasOwn(SUPPLY_EFFECTS,kind)||s.supplies[kind]<=0)return false;
    const [stat,n]=SUPPLY_EFFECTS[kind];if(s[stat]>=statCap(s,stat))return false;
    const bonus=stat==='water'&&mutationLevel(s,'water_recycler')>=2?Math.ceil(n*.2):0;s.supplies[kind]--;addStat(s,stat,n+bonus);if(stat==='energy')s.stats.energyRecovered++;if(['food','water'].includes(stat))relieveWeakness(s);
    log(s,`使用${ITEMS[kind].name}，${{food:'饱食',water:'水分',hp:'健康',energy:'精力'}[stat]} +${n}。`,'good');return true;
  }
  function grantCard(s,id){
    if(CARDS[id].consumable){s.consumables.push(id);s.pocketUses.push(CARDS[id].durability||1);}
    else s.deck.push(id);
    if(!s.discovered.cards.includes(id))s.discovered.cards.push(id);
  }
  function pocketIndex(s,id,index){return Number.isInteger(index)&&s.consumables[index]===id?index:s.consumables.indexOf(id);}
  function removePocket(s,id,index){const i=pocketIndex(s,id,index);if(i<0)return false;s.consumables.splice(i,1);s.pocketUses.splice(i,1);return true;}
  function addDice(s,count){
    const b=s.combat;let added=0;
    while(added<count&&b.dice.filter(Boolean).length<6){let value=roll(s);if(mutationLevel(s,'lucky_marrows')>=2)value=Math.max(3,value);if(value===6&&mutationLevel(s,'lucky_marrows')>=3)addStat(s,'energy',4);const i=b.dice.indexOf(0);if(i>=0)b.dice[i]=value;else b.dice.push(value);added++;}
    return added;
  }
  const effectValue=(e,die)=>Math.max(0,Math.round((e.base||0)+(e.scale||0)*die));
  function addEnemyStatus(s,b,status,amount){
    let n=Math.max(0,Math.round(amount));
    if(status==='poison'&&mutationLevel(s,'acid_heart')>=3)n+=2;
    if(status==='slow'&&mutationLevel(s,'cold_field')>=1)n+=1;
    b[status]=(b[status]||0)+n;
    if(status==='poison')s.stats.poisonApplied+=n;if(status==='burn')s.stats.burnApplied+=n;
    return n;
  }
  function dealDamage(s,b,amount,school=''){let damage=Math.max(0,Math.round(amount));
    if(school==='蛮力')damage+=2*Math.min(2,mutationLevel(s,'scavenger_muscle'))+(s.mutations.includes('brute_force')?2:0);
    if(b.vulnerable){damage+=b.vulnerable;b.vulnerable=Math.max(0,b.vulnerable-2);}
    b.hp=Math.max(0,b.hp-damage);s.stats.attacks++;
    if(b.bleed&&b.hp){let bleed=Math.round(b.bleed*(mutationLevel(s,'clotting_control')>=1?1.25:1));b.hp=Math.max(0,b.hp-bleed);if(mutationLevel(s,'clotting_control')<2)b.bleed=Math.max(0,b.bleed-1);damage+=bleed;}
    return damage;
  }
  function applyEffects(s,card,die=0){
    const b=s.combat,parts=[];let totalDamage=0;
    for(const e of card.effects||[]){const value=effectValue(e,die);let n=0;
      if(e.kind==='damage')n=dealDamage(s,b,value,card.school);
      else if(e.kind==='shieldDamage')n=dealDamage(s,b,Math.round(b.shield*e.ratio),card.school);
      else if(e.kind==='statusDamage')n=dealDamage(s,b,Math.round((b[e.status]||0)*e.ratio),card.school);
      else if(e.kind==='missingEnergyDamage')n=dealDamage(s,b,Math.round((statCap(s,'energy')-s.energy)*e.ratio),card.school);
      else if(e.kind==='sanDamage')n=dealDamage(s,b,Math.round(s.san*e.ratio),card.school);
      else if(e.kind==='parityDamage'&&die%2===(e.parity==='odd'?1:0))n=dealDamage(s,b,e.base,card.school);
      else if(e.kind==='poison'||e.kind==='burn'||e.kind==='fuel'||e.kind==='bleed'||e.kind==='slow'||e.kind==='vulnerable')parts.push(`${e.kind} +${addEnemyStatus(s,b,e.kind,value)}`);
      else if(e.kind==='amplify'){n=Math.round((b[e.status]||0)*e.scale);addEnemyStatus(s,b,e.status,n);parts.push(`${e.status} 增幅 ${n}`);}
      else if(e.kind==='consumeStatus'){const spent=Math.min(b[e.status]||0,e.amount);b[e.status]-=spent;n=dealDamage(s,b,Math.round(spent*e.ratio),card.school);parts.push(`消耗 ${spent} ${e.status}`);}
      else if(e.kind==='ignite'){const burn=(b.fuel||0)+value+(s.mutations.includes('combustion_core')?3:0)+(mutationLevel(s,'ash_lung')>=2?3:0);b.fuel=0;addEnemyStatus(s,b,'burn',burn);parts.push(`点燃 ${burn}`);}
      else if(e.kind==='shield'){b.shield+=value+(card.consumable&&mutationLevel(s,'bone_archive')>=2?4:0);s.stats.shields++;parts.push(`护盾 +${value}`);}
      else if(e.kind==='intentShield'){n=Math.round(b.intent*e.ratio);b.shield+=n;parts.push(`意图护盾 +${n}`);}
      else if(e.kind==='retainShield'){b.retainShield=Math.max(b.retainShield||0,value);parts.push(`保留护盾 ${value}`);}
      else if(e.kind==='thorns'){b.thorns=(b.thorns||0)+value;parts.push(`荆棘 +${value}`);}
      else if(e.kind==='heal'||e.kind==='san'||e.kind==='energy'||e.kind==='food'||e.kind==='water'){const stat={heal:'hp'}[e.kind]||e.kind,bonus=(stat==='san'&&mutationLevel(s,'lucid_core')>=1?3:0)+(stat==='energy'&&card.school==='电能'&&mutationLevel(s,'living_capacitor')>=2?3:0),healing=stat==='hp'&&s.hp<35&&mutationLevel(s,'recovery_shell')>=1?Math.ceil(value*.3):0;addStat(s,stat,value+bonus+healing);if(['food','water'].includes(stat))relieveWeakness(s);parts.push(`${stat} +${value+bonus+healing}`);}
      else if(e.kind==='statusHeal'){n=Math.round((b?.[e.status]||0)*e.ratio);addStat(s,'hp',n);parts.push(`生命 +${n}`);}
      else if(e.kind==='statusEnergy'){n=Math.round((b?.[e.status]||0)*e.ratio);addStat(s,'energy',n);parts.push(`精力 +${n}`);}
      else if(e.kind==='missingHpHeal'){n=Math.round((statCap(s,'hp')-s.hp)*e.ratio);addStat(s,'hp',n);parts.push(`生命 +${n}`);}
      else if(e.kind==='sanCost'){s.san=Math.max(0,s.san-value);parts.push(`SAN −${value}`);}
      else if(e.kind==='energyCost'){s.energy=Math.max(0,s.energy-value);parts.push(`精力 −${value}`);}
      else if(e.kind==='dice'){n=addDice(s,value);parts.push(`骰子 +${n}`);}
      else if(e.kind==='conditionalDice'&&die%2===(e.parity==='odd'?1:0)){n=addDice(s,value);parts.push(`骰子 +${n}`);}
      else if(e.kind==='draw'){const before=b.hand.length;draw(s,value);parts.push(`抽牌 +${b.hand.length-before}`);}
      else if(e.kind==='reroll'&&b){b.rerolls+=value;parts.push(`重掷 +${value}`);}
      else if(e.kind==='ap'){b.ap=Math.min(5,b.ap+value);parts.push(`行动值 +${value}`);}
      else if(e.kind==='parityShield'&&die%2===(e.parity==='odd'?1:0)){b.shield+=e.base;parts.push(`护盾 +${e.base}`);}
      else if(e.kind==='weakness'){if(e.amount<0)relieveWeakness(s,Math.abs(e.amount));else s.weakness=clamp(s.weakness+e.amount,0,3);parts.push(`虚弱 ${e.amount>0?'+':''}${e.amount}`);}
      if(n>0){totalDamage+=n;if(!['consumeStatus'].includes(e.kind))parts.push(`伤害 ${n}`);}
      if(b&&!b.hp)break;
    }
    return {damage:totalDamage,text:parts.join('、')||card.desc};
  }
  function canUsePocket(s,id,index){
    const c=CARDS[id],owned=pocketIndex(s,id,index)>=0;if(!['explore','combat'].includes(s.phase)||!c?.consumable||!owned)return false;
    if(c.stat)return s[c.stat]<statCap(s,c.stat);
    if(c.effects&&c.scope==='any')return c.effects.some(e=>e.kind==='weakness'?s.weakness>0:['heal','san','energy','food','water'].includes(e.kind)?s[{heal:'hp'}[e.kind]||e.kind]<statCap(s,{heal:'hp'}[e.kind]||e.kind):s.phase==='combat');
    if(!s.combat)return false;
    if(id==='dice_cache')return s.combat.dice.filter(Boolean).length<6;
    if(c.effect==='stimulant')return s.energy<100||s.combat.ap<5;
    return true;
  }
  function isActionCard(card){return card?.effects?.some(e=>['ap','dice','conditionalDice','draw','reroll'].includes(e.kind))||card===CARDS.dice_rig;}
  function usePocket(s,id,index){
    if(!canUsePocket(s,id,index))return false;const c=CARDS[id],i=pocketIndex(s,id,index),uses=s.pocketUses[i]??c.durability??1;
    if(uses<=1)removePocket(s,id,i);else s.pocketUses[i]=uses-1;
    if(c.durability)s.stats.durableUses++;
    s.stats.pocketUsed++;let result='';
    if(c.effects){result=applyEffects(s,c,0).text;}
    else if(c.stat){addStat(s,c.stat,c.amount);if(c.stat==='energy')s.stats.energyRecovered++;if(['food','water'].includes(c.stat))relieveWeakness(s);result=`${{food:'饱食',energy:'精力'}[c.stat]} +${c.amount}`;}
    else if(id==='dice_cache'){const n=addDice(s,2);result=`增加 ${n} 枚随机骰子`;}
    else {
      const b=s.combat;
      if(c.effect==='poison'){b.poison+=c.amount;s.stats.poisonApplied+=c.amount;result=`附加 ${c.amount} 层中毒`;}
      if(c.effect==='damage'){const bonus=s.mutations.includes('brute_force')&&id==='reinforced_crowbar'?2:0,damage=c.amount+bonus;b.hp=Math.max(0,b.hp-damage);s.stats.attacks++;result=`造成 ${damage} 点伤害`;}
      if(c.effect==='ignite'){const burn=b.fuel+c.amount+(s.mutations.includes('combustion_core')?3:0);b.fuel=0;b.burn+=burn;s.stats.burnApplied+=burn;result=`附加 ${burn} 层燃烧`;}
      if(c.effect==='shield'){b.shield+=c.amount;s.stats.shields++;result=`获得 ${c.amount} 点护盾`;}
      if(c.effect==='stimulant'){s.energy=clamp(s.energy+c.amount);b.ap=Math.min(5,b.ap+1);s.stats.energyRecovered++;result=`精力 +${c.amount}、行动值 +1`;}
    }
    if(c.durability&&uses<=1&&c.school==='蛮力'&&mutationLevel(s,'scavenger_muscle')>=3){addStat(s,'energy',8);result+='、耐久耗尽返还 8 精力';}
    if(isActionCard(c)&&mutationLevel(s,'temporal_spleen')>=2){addStat(s,'energy',5);result+='、时差脾脏恢复 5 精力';}
    const durability=c.durability?`，剩余耐久 ${Math.max(0,uses-1)}/${c.durability}`:'';
    log(s,`使用消耗卡「${c.name}」，${result}${durability}。`,'good');
    if(s.combat&&!s.combat.hp)winCombat(s);
    return true;
  }
  function mutationCost(s,id){const m=MUTATIONS[id],own=mutationLevel(s,id),factory=mutationLevel(s,'pocket_factory');return Math.max(1,(m?.cost||0)-(own>=2?4:0)-(factory>=1?3:0));}
  function canActivate(s,id){const m=MUTATIONS[id],free=s.phase==='combat'&&s.combat.freeProduction;return ['explore','combat'].includes(s.phase)&&s.mutations.includes(id)&&m?.active&&s.energy>=mutationCost(s,id)&&(s.phase!=='combat'||s.combat.ap>0||free);}
  function activate(s,id){
    if(!canActivate(s,id))return false;const m=MUTATIONS[id],cost=mutationCost(s,id);s.energy-=cost;let apCost=0;if(s.phase==='combat'){if(s.combat.freeProduction)s.combat.freeProduction=false;else{s.combat.ap--;apCost=1;}}
    let count=mutationLevel(s,id)>=3?2:1;if(mutationLevel(s,'pocket_factory')>=2&&random(s)<.2)count++;
    for(let i=0;i<count;i++)grantCard(s,m.produces);s.stats.produced+=count;log(s,`催发「${m.name}」，精力 −${cost}${s.phase==='combat'?`、行动值 −${apCost}，消耗卡已加入当前战斗卡牌`:''}，生产「${CARDS[m.produces].name}」×${count}。`,'good');return true;
  }
  function recoverEnergy(s){
    if(!['explore','combat'].includes(s.phase)||s.energy>=100)return false;
    if(s.phase==='combat'){if(s.combat.ap<1||s.combat.breathed)return false;s.combat.ap--;s.combat.breathed=true;}
    else {tick(s,2,3,0);if(s.phase!=='explore')return true;}
    s.energy=clamp(s.energy+18);s.stats.energyRecovered++;log(s,'调整呼吸，精力 +18。'+(s.phase==='combat'?'消耗 1 行动值，本回合限一次。':'休息行动另自然恢复 6 精力，消耗 2 饱食、3 水分。'),'good');return true;
  }
  function advance(s,allowReceipt=false){
    if(s.phase!=='explore'||s.notice||s.reward||(!allowReceipt&&s.searchResult)||!s.encounterQueue.length)return false;
    const e=s.encounterQueue.shift();if(e.kind==='combat')startCombat(s,e.id);else startEvent(s,e.id);return true;
  }
  function acknowledge(s,kind){
    if(!['searchResult','notice','reward','attackNotice','survivalAlert'].includes(kind)||!s[kind])return false;s[kind]=null;if(kind!=='survivalAlert')advance(s);return true;
  }
  function rollEncounters(s){
    const eventIds=Object.keys(EVENTS).filter(id=>id!=='whisper');
    if(random(s)<.28)s.encounterQueue.push({kind:'combat',id:'normal'});
    if(random(s)<.75){const id=pick(s,eventIds);s.encounterQueue.push({kind:'event',id});if(random(s)<.3)s.encounterQueue.push({kind:'event',id:pick(s,eventIds.filter(v=>v!==id))});}
    advance(s,true);
  }
  function loot(s, type) {
    const scrap = 2 + Math.floor(random(s) * 5); s.scrap += scrap;
    let kind = type === 'market' ? 'food' : type === 'water' ? 'water' : pick(s, ['food', 'water', 'med', 'chips', 'coffee']);
    const count = ['market', 'water'].includes(type) ? 2 : 1; s.supplies[kind] += count;
    let extra = '';
    const cards = [];
    if (random(s) < .4) { const card = pickCard(s); grantCard(s,card); cards.push(card); s.stats.cardsFound++;extra = `，发现${RARITIES[CARDS[card].rarity].name}道具卡「${CARDS[card].name}」`; }
    log(s, `搜获零件 ×${scrap}、${ITEMS[kind].name} ×${count}${extra}。`, 'good');
    const supplies={ [kind]:count };if(random(s)<.3){const bonus=pick(s,['chips','coffee']);s.supplies[bonus]++;supplies[bonus]=(supplies[bonus]||0)+1;}
    return { position: s.position, scrap, supplies, cards };
  }
  function search(s) {
    if (s.phase !== 'explore') return false;
    if(s.region)return searchRegion(s);
    if(s.notice||s.reward||s.searchResult||s.encounterQueue.length)return false;
    const tile = s.map[s.position];
    if(tile.hasInterior&&!tile.cleared){enterRegion(s);return true;}
    if (tile.searched || tile.type === 'shelter') return false;
    if (tile.type === 'tower' && s.cores < 3) { log(s, '信号塔封锁中：需要 3 枚核心。', 'danger'); return false; }
    s.searchResult = null;
    tile.searched = true; s.stats.searches++;tick(s, 2, 3, tile.type === 'anomaly' ? 4 : 1);
    if (s.phase !== 'explore') return true;
    if (['hospital', 'metro', 'plant', 'tower'].includes(tile.type)) startCombat(s, tile.type);
    else if (tile.type === 'anomaly') startEvent(s,'whisper');
    else {
      s.searchResult = loot(s, tile.type);
      rollEncounters(s);
    }
    return true;
  }
  function rest(s) {
    if (s.phase !== 'explore' || (s.region || s.map[s.position].type !== 'shelter') || s.food < 8 || s.water < 10 || (s.hp === 100 && s.san === statCap(s,'san') && s.energy===statCap(s,'energy'))) return false;
    s.hp = clamp(s.hp + 25); s.san = clamp(s.san + 20); s.energy=clamp(s.energy+20);s.restCount++; tick(s, 8, 10, 0);
    log(s, '在避难所休息：健康 +25，SAN +20；消耗 8 饱食、10 水分。', 'good'); return true;
  }
  function craft(s, recipe) {
    if (s.phase !== 'explore') return false;
    const recipes = { med: [4, '急救包'], water: [3, '净水'], food: [3, '罐头'], molotov: [6, '燃烧瓶'], coffee:[4,'浓缩咖啡'], venom_ampoule:[5,'浓缩毒囊'], reinforced_crowbar:[8,'异化撬棍'], firestarter:[7,'防风打火机'], armor_plate:[7,'骨质护甲片'] };
    if (!recipes[recipe] || s.scrap < recipes[recipe][0]) return false;
    s.scrap -= recipes[recipe][0];
    s.stats.crafted++;
    if (CARDS[recipe]) grantCard(s,recipe); else s.supplies[recipe]++;
    log(s, `用零件制作了${recipes[recipe][1]}。`, 'good'); return true;
  }
  function startEvent(s,id){
    s.phase='event';s.event=id;s.eventData={};
    if(id==='merchant')s.eventData.stock=shuffle(s,[{kind:'supply',id:'food'},{kind:'supply',id:'water'},{kind:'supply',id:'med'},{kind:'supply',id:pick(s,['chips','coffee'])},{kind:'card',id:pickCard(s,(id,c)=>c.consumable)},{kind:'card',id:pickCard(s)}]).map(v=>({...v,price:v.kind==='card'?3+rarityRank(CARDS[v.id].rarity)*3+Math.floor(random(s)*3)+(CARDS[v.id]?.durability||0):2+Math.floor(random(s)*3),remaining:1+Math.floor(random(s)*2)}));
    log(s,`突发遭遇：${EVENTS[id].title}。`);
  }
  function notice(s,title,text,tone='good',items=[]){s.notice={title,text,tone,items};log(s,text,tone);}
  function meetsRequirements(s,req={}){
    if(req.scrap&&s.scrap<req.scrap)return false;if(req.energy&&s.energy<req.energy)return false;
    if(req.supply&&Object.entries(req.supply).some(([id,n])=>(s.supplies[id]||0)<n))return false;
    if(req.school){const fixed=s.deck.some(id=>CARDS[id].school===req.school),pocket=s.consumables.some(id=>CARDS[id].school===req.school);if(req.pocket?!pocket:!(fixed||pocket))return false;}
    return true;
  }
  function payEventCost(s,cost={}){if(cost.scrap)s.scrap-=cost.scrap;if(cost.hp)s.hp-=cost.hp;if(cost.san)s.san-=cost.san;if(cost.food)s.food=Math.max(0,s.food-cost.food);if(cost.water)s.water=Math.max(0,s.water-cost.water);if(cost.energy)s.energy=Math.max(0,s.energy-cost.energy);if(cost.supply)for(const [id,n] of Object.entries(cost.supply))s.supplies[id]-=n;if(cost.pocketSchool){const i=s.consumables.findIndex(id=>CARDS[id].school===cost.pocketSchool);if(i>=0)removePocket(s,s.consumables[i],i);}}
  function revealRandom(s,count){for(let n=0;n<count;n++){const hidden=s.map.filter(t=>!t.revealed);if(!hidden.length)break;pick(s,hidden).revealed=true;}}
  function chooseWeighted(s,outcomes){let rollValue=random(s)*outcomes.reduce((n,o)=>n+o.weight,0);for(const o of outcomes){rollValue-=o.weight;if(rollValue<0)return o;}return outcomes.at(-1);}
  function resolveGenericEvent(s,type,choice){
    const spec=EVENTS[type].resolutions[choice];if(!spec||!meetsRequirements(s,spec.requires))return false;payEventCost(s,spec.cost);const chosen=spec.outcomes?chooseWeighted(s,spec.outcomes):spec,result=chosen.result||{},items=[];
    for(const stat of ['hp','san','food','water','energy'])if(result[stat])addStat(s,stat,result[stat]);if(result.scrap){s.scrap=Math.max(0,s.scrap+result.scrap);if(result.scrap>0)items.push({kind:'item',id:'scrap',count:result.scrap});}
    if(result.supplies)for(const [id,n] of Object.entries(result.supplies)){s.supplies[id]=(s.supplies[id]||0)+n;if(n>0)items.push({kind:'item',id,count:n});}
    if(result.reveal)revealRandom(s,result.reveal);if(result.weakness){s.weakness=clamp(s.weakness+result.weakness,0,3);if(s.weakness>=3)s.collapse=3;}
    if(result.pending)s.pending.push({due:s.travel+2+Math.floor(random(s)*3),kind:result.pending});
    if(result.teleport){const targets=s.map.filter(t=>t.id!==s.position&&t.type!=='tower');s.position=pick(s,targets).id;reveal(s);}
    let card=null,filter=()=>true;if(result.cardSchool)filter=(id,c)=>c.school===result.cardSchool;if(result.cardSchools)filter=(id,c)=>result.cardSchools.includes(c.school);if(result.cardType==='consumable')filter=(id,c)=>c.consumable;
    if(result.cardRarity)card=pickByRarity(s,CARDS,(id,c)=>filter(id,c)&&c.rarity===result.cardRarity)||pickCard(s,filter,result.cardRarity);else if(result.cardSchool||result.cardSchools||result.cardType)card=pickCard(s,filter);
    if(card){grantCard(s,card);s.stats.cardsFound++;items.push({kind:'card',id:card,count:1});}
    if(result.combat)s.encounterQueue.unshift({kind:'combat',id:'normal'});if(spec.risk||spec.outcomes)s.stats.risks++;
    if(s.food>0&&s.water>0)relieveWeakness(s,1);check(s);if(['dead','victory'].includes(s.phase))return true;
    const details=[];for(const stat of ['hp','san','food','water','energy'])if(result[stat])details.push(`${{hp:'健康',san:'SAN',food:'饱食',water:'水分',energy:'精力'}[stat]} ${result[stat]>0?'+':''}${result[stat]}`);if(result.reveal)details.push(`揭示 ${result.reveal} 处地图`);if(result.weakness)details.push(`虚弱 +${result.weakness}`);
    notice(s,chosen.title||spec.title,details.join('，')||'这次选择已经写进生存手记。',result.hp<0||result.san<0||result.weakness?'danger':'good',items);return true;
  }
  function eventChoices(s){
    if(s.phase!=='event'||!EVENTS[s.event])return [];
    const e=EVENTS[s.event];return e.choices.map(([id,title,desc])=>({id,title,desc,available:e.resolutions?meetsRequirements(s,e.resolutions[id]?.requires):!(id==='help'&&s.supplies.med<1)&&!(id==='share'&&s.supplies.food<1)&&!(id==='careful'&&s.scrap<2)&&!(id==='exchange'&&s.supplies.water<1)&&!(id==='share_card'&&!s.consumables.includes('chips_card'))&&!(id==='pay_card'&&!s.consumables.includes('charge_card'))}));
  }
  function chooseEvent(s, choice) {
    if (!eventChoices(s).some(c=>c.id===choice&&c.available)) return false;
    const type=s.event,definition=EVENTS[type];s.phase='explore';s.event=null;s.eventData=null;
    if(definition.resolutions)return resolveGenericEvent(s,type,choice);
    if(choice==='leave'){
      if(type==='whisper')s.san=clamp(s.san+5);
      if(['injured','cache','stranger'].includes(type))s.stats.skipped++;
      notice(s,'继续赶路',type==='whisper'?'你远离了裂隙，理智 +5。':'你收好背包，离开了这次相遇。','normal');
    }else if(type==='whisper'){
      s.san-=12;grantCard(s,'spark');s.scrap+=4;s.stats.anomalies++;s.stats.risks++;
      notice(s,'接受共鸣','获得「电弧碎片」与 4 零件，理智 −12。','good',[{kind:'card',id:'spark',count:1},{kind:'item',id:'scrap',count:4}]);
    }else if(type==='injured'){
      s.supplies.med--;s.stats.helped++;s.stats.risks++;
      const fate=random(s);
      if(fate<.25){s.hp-=12;const stolen=Math.min(4,s.scrap);s.scrap-=stolen;s.stats.betrayed++;notice(s,'善意换来的伤口',`对方突然抢走 ${stolen} 零件，刺伤了你。健康 −12，消耗 1 急救包。`,'danger');}
      else{s.pending.push({due:s.travel+2+Math.floor(random(s)*3),kind:fate<.80?'aid':'betrayal'});s.san=clamp(s.san+4);notice(s,'暂时脱离危险','你用掉 1 急救包，替陌生人包扎。他记下了你的路线，说以后还会相见。理智 +4。');}
    }else if(type==='rescue_team'){
      s.stats.teamTreats++;
      if(choice==='share_card'){removePocket(s,'chips_card');s.stats.donated++;s.hp=clamp(s.hp+25);s.san=clamp(s.san+15);s.supplies.coffee++;notice(s,'零食也是一份善意','交出 1 张凭空薯片卡，健康 +25、理智 +15，获得 1 浓缩咖啡。','good',[{kind:'item',id:'coffee',count:1}]);}
      else if(choice==='share'){s.supplies.food--;s.stats.donated++;s.hp=clamp(s.hp+35);s.san=clamp(s.san+20);s.supplies.water++;notice(s,'白旗下的互助','你分享了 1 罐头。救助队为你治疗：健康 +35、理智 +20，并赠送 1 净水。','good',[{kind:'item',id:'water',count:1}]);}
      else{s.hp=clamp(s.hp+30);s.san=clamp(s.san+12);notice(s,'有人替你包扎伤口','救助队免费为你处理伤口。健康 +30，理智 +12。');}
    }else if(type==='cache'){
      if(choice==='careful'){s.scrap-=2;s.supplies.med++;notice(s,'稳妥地打开箱子','消耗 2 零件，安全获得 1 急救包。','good',[{kind:'item',id:'med',count:1}]);}
      else{s.stats.risks++;if(random(s)<.6){const card=pickCard(s);grantCard(s,card);s.stats.cardsFound++;s.scrap+=4;notice(s,'这一次，赌对了',`获得「${CARDS[card].name}」与 4 零件。`,'good',[{kind:'card',id:card,count:1},{kind:'item',id:'scrap',count:4}]);}else{s.hp-=14;s.san-=5;notice(s,'藏在锁扣里的陷阱','弹出的铁片划伤了你。健康 −14，理智 −5。','danger');}}
    }else if(type==='stranger'){
      if(choice==='pay_card')removePocket(s,'charge_card');else s.supplies.water--;s.stats.risks++;
      const payment=choice==='pay_card'?'1 张瓶装精神卡':'1 净水';
      if(random(s)<.65){const target=s.map.find(t=>['hospital','metro','plant'].includes(t.type)&&!t.revealed)||s.map.find(t=>!t.revealed);if(target)target.revealed=true;s.san=clamp(s.san+5);notice(s,'一条有用的线索',target?`用 ${payment}换来情报：地图上已标出${TERRAIN[target.type].name}。理智 +5。`:`对方确认了你已知的路线。消耗 ${payment}，理智 +5。`);}
      else{s.san-=5;notice(s,'过期的情报',`地图指向一面早已倒塌的墙。失去 ${payment}，理智 −5。`,'danger');}
    }
    check(s);return true;
  }
  function resolveFuture(s){
    const index=s.pending.findIndex(p=>p.due<=s.travel);if(index<0)return;
    const future=s.pending.splice(index,1)[0];
    if(future.kind==='aid'){s.stats.futureAid++;addStat(s,'hp',18);s.supplies.food++;s.supplies.water++;s.scrap+=6;notice(s,'善意有了回声','你救过的陌生人找到了你，带来 1 罐头、1 净水和 6 零件，还替你处理了伤口。健康 +18。','good',[{kind:'item',id:'food',count:1},{kind:'item',id:'water',count:1},{kind:'item',id:'scrap',count:6}]);}
    else if(future.kind==='dog_aid'){s.stats.futureAid++;s.supplies.food++;s.scrap+=4;revealRandom(s,1);notice(s,'瘦狗叼回了东西','那只狗再次出现，叼来 1 罐头和 4 零件，又领你发现一条藏在废墙后的路。','good',[{kind:'item',id:'food',count:1},{kind:'item',id:'scrap',count:4}]);}
    else{s.stats.betrayed++;s.hp-=14;const stolen=Math.min(5,s.scrap);s.scrap-=stolen;notice(s,'他带回来的不是谢礼',`你救过的人带着同伙堵住了路。你受伤逃脱，健康 −14、零件 −${stolen}。`,'danger');}
    check(s);
  }
  function trade(s,index){
    if(s.phase!=='event'||s.event!=='merchant'||!Number.isInteger(index))return false;
    const item=s.eventData.stock[index];if(!item||item.remaining<=0||s.scrap<item.price)return false;
    s.scrap-=item.price;item.remaining--;s.stats.trades++;
    if(item.kind==='card')grantCard(s,item.id);else s.supplies[item.id]++;
    log(s,`花费 ${item.price} 零件买下${item.kind==='card'?CARDS[item.id].name:ITEMS[item.id].name}。`,'good');return true;
  }
  function sellCard(s,id){
    if(s.phase!=='event'||s.event!=='merchant'||!CARDS[id]?.consumable||!s.consumables.includes(id))return false;
    removePocket(s,id);s.scrap+=CARDS[id].sell;s.stats.sold++;s.stats.trades++;
    log(s,`卖出「${CARDS[id].name}」，获得 ${CARDS[id].sell} 零件。`,'good');return true;
  }
  function salvage(s,id){
    if(s.phase!=='explore'||!Object.hasOwn(CARDS,id)||s.deck.filter(c=>c===id).length<2||s.deck.length<=5)return false;
    s.deck.splice(s.deck.lastIndexOf(id),1);s.scrap+=2;s.stats.salvaged++;log(s,`分解一张多余的「${CARDS[id].name}」，获得 2 零件。`,'good');return true;
  }
  function reorder(s,from,to,zone='hand'){
    if(!Number.isInteger(from)||!Number.isInteger(to))return false;
    const list=zone==='pocket'&&['explore','combat'].includes(s.phase)?s.consumables:zone==='hand'&&s.phase==='combat'?s.combat.hand:zone==='deck'&&s.phase==='explore'?s.deck:null;
    if(!list||from<0||to<0||from>=list.length||to>=list.length||from===to)return false;
    list.splice(to,0,list.splice(from,1)[0]);
    if(zone==='pocket')s.pocketUses.splice(to,0,s.pocketUses.splice(from,1)[0]);
    return true;
  }
  function draw(s, count) {
    const b = s.combat;
    for (let i = 0; i < count && b.hand.length < 6; i++) {
      if (!b.draw.length) b.draw = shuffle(s, b.discard.splice(0));
      if (!b.draw.length) break;
      b.hand.push(b.draw.pop());
    }
  }
  function roll(s) { return Math.floor(random(s) * 6) + 1; }
  function beginRound(s) {
    const b = s.combat;
    b.ap=Math.max(1,3-(s.weakness>=3?1:0))+(mutationLevel(s,'temporal_spleen')>=1&&b.round%3===0?1:0);b.breathed=false;b.freeProduction=mutationLevel(s,'pocket_factory')>=3;b.electricRefunded=false;
    const diceCount=s.weakness>=2?2:3;b.dice=Array.from({length:diceCount},()=>roll(s));while(b.dice.length<3)b.dice.push(0);s.lastDice=[...b.dice];
    const retained=Math.min(b.shield||0,Math.max(b.retainShield||0,mutationLevel(s,'bone_archive')>=1?5:0)),coldShield=mutationLevel(s,'cold_field')>=2?(b.slow||0):0;b.shield=(s.mutations.includes('iron')?3:0)+retained+coldShield;b.retainShield=0;
    b.thorns=mutationLevel(s,'thorn_skin')?2+(mutationLevel(s,'thorn_skin')>=2?2:0):0;
    b.rerolls=1+(s.mutations.includes('fortune')?1:0)+(mutationLevel(s,'lucky_marrows')>=1?1:0);
    const rawIntent=b.attack+Math.floor(random(s)*4);b.intent=Math.max(mutationLevel(s,'cold_field')>=3?0:1,rawIntent-(b.slow||0));b.slow=Math.max(0,(b.slow||0)-2);b.mind=b.round%3===0?4:0;
    draw(s, 5 - b.hand.length);
  }
  function startCombat(s, kind) {
    const data = {
      normal: [pick(s, ['食腐游荡者', '空壳猎犬', '菌生潜伏者']), 24 + Math.floor(random(s) * 9), 6],
      hospital: ['缝合看守', 44, 9], metro: ['深轨爬行者', 48, 10], plant: ['电噬聚合体', 52, 10], tower: ['回声之母', 88, 13]
    }[kind];
    s.phase = 'combat'; s.combat = { kind, name: data[0], hp: data[1], maxHp: data[1], attack: data[2], round: 1, hand: [], draw: shuffle(s, [...s.deck]), discard: [], dice: [], shield: 0, intent: 0, mind: 0, rerolls: 0, poison:0, burn:0, fuel:0, bleed:0, slow:0, vulnerable:0, thorns:0, retainShield:0, freeProduction:false, electricRefunded:false };
    beginRound(s); log(s, `遭遇${data[0]}！选择骰子，再使用道具卡。`, 'danger');
  }
  function winCombat(s) {
    const kind=s.combat.kind,name=s.combat.name,core=!['normal','tower'].includes(kind),money=kind==='normal'?4:8;
    s.kills++;s.scrap+=money;if(core||kind==='tower'||!s.region)s.map[s.position].cleared=true;
    if(s.mutations.includes('hunger'))s.hp=clamp(s.hp+12);
    s.combat=null;s.phase='explore';const items=[{kind:'item',id:'scrap',count:money}];
    if(core){s.cores++;items.push({kind:'item',id:'core',count:1});for(const id of ['food','water','med']){const n=kind==='hospital'&&id==='med'?2:1;s.supplies[id]+=n;items.push({kind:'item',id,count:n});}}
    else {const id=pick(s,Object.keys(SUPPLY_EFFECTS));s.supplies[id]++;items.push({kind:'item',id,count:1});}
    if(core||random(s)<.65){const card=pickCard(s,()=>true,core?'uncommon':'common');grantCard(s,card);items.push({kind:'card',id:card,count:1});}
    log(s,`击败${name}，${core?'取得异变核心和补给，':''}获得 ${money} 零件。`,'good');
    const reward={title:core?'异变核心已取得':'战斗胜利 · 收好战利品',text:`击败${name}，以下物品已放入背包。`,items};
    if(kind==='tower')finish(s,true,'信号塔归于沉寂。晨光第一次穿透灰雾，你活到了黎明。');
    else if(s.kills<=9&&s.kills%2===1){
      const candidates=Object.keys(MUTATIONS).filter(id=>!s.mutations.includes(id)||mutationLevel(s,id)<MUTATIONS[id].maxLevel),offer=[];
      while(candidates.length&&offer.length<4){const id=pickByRarity(s,MUTATIONS,k=>candidates.includes(k));offer.push(id);candidates.splice(candidates.indexOf(id),1);}
      if(offer.length){s.phase='mutation';s.mutationOffer=offer;log(s,'异变在你体内苏醒。收好战利品后选择觉醒或升级一项异能。','good');}
    }
    s.reward=reward;
  }
  function play(s, handIndex, dieIndex) {
    if (s.phase !== 'combat') return false;
    const b = s.combat, id = b.hand[handIndex], card = CARDS[id], die = b.dice[dieIndex];
    const parity=card?.effects?.find(e=>['parityDamage','parityShield'].includes(e.kind))?.parity,energyCost=card?.effects?.find(e=>e.kind==='energyCost')?.base||0;
    if (!card || card.consumable || !die || die < card.min || (parity&&die%2!==(parity==='odd'?1:0)) || s.energy<energyCost || (id==='dice_rig'&&b.dice.filter(Boolean).length>=6) || (id === 'spark' && s.san <= 3)) return false;
    const refundElectric=card.school==='电能'&&mutationLevel(s,'living_capacitor')>=3&&!b.electricRefunded;b.dice[dieIndex] = refundElectric?die:0;if(refundElectric)b.electricRefunded=true;b.hand.splice(handIndex, 1); b.discard.push(id);
    let damage = 0, effect = '';
    if(id==='dice_rig'){const n=addDice(s,2);effect=`增加 ${n} 枚骰子`;}
    if(id==='recharge'){const gain=die+10+(mutationLevel(s,'living_capacitor')>=2?3:0);addStat(s,'energy',gain);s.stats.energyRecovered++;effect=`恢复 ${gain} 精力`;}
    if (id === 'crowbar') damage = die + 3;
    if (id === 'knife') damage = die * 2;
    if (id === 'molotov') {damage = die + 4;b.burn+=4;s.stats.burnApplied+=4;effect='并附加 4 层燃烧';}
    if (id === 'toxic_needle') {const poison=die+3;b.poison+=poison;s.stats.poisonApplied+=poison;effect=`附加 ${poison} 层中毒`;}
    if (id === 'fuel_can') {const fuel=die+3;b.fuel+=fuel;effect=`泼上 ${fuel} 层燃料`;}
    if (id === 'lighter') {const burn=b.fuel+die+(s.mutations.includes('combustion_core')?3:0);b.fuel=0;b.burn+=burn;s.stats.burnApplied+=burn;effect=`点燃并附加 ${burn} 层燃烧`;}
    if (id === 'spark') { damage = die * 3; s.san -= 3; s.stats.sparkUses++; }
    if (id === 'shield') { b.shield += die + 4; s.stats.shields++; effect = `获得 ${die + 4} 护盾`; }
    if (id === 'bandage') { s.hp = clamp(s.hp + die + 4); effect = `恢复 ${die + 4} 健康`; }
    if (id === 'focus') { s.san = clamp(s.san + die + 5); effect = `恢复 ${die + 5} SAN`; }
    if(card.effects){const result=applyEffects(s,card,die);damage=result.damage;effect=result.text;}
    else if(damage)damage=dealDamage(s,b,damage,card.school);
    if(isActionCard(card)&&mutationLevel(s,'temporal_spleen')>=2){addStat(s,'energy',5);effect+=`${effect?'、':''}时差脾脏恢复 5 精力`;}
    const summary=card.effects?effect:damage?`造成 ${damage} 伤害${effect?`，${effect}`:''}`:effect;
    log(s, `「${card.name}」＋骰点 ${die}：${summary}。`, 'good');
    if (!b.hp) winCombat(s);
    return true;
  }
  function reroll(s, dieIndex) {
    if (s.phase !== 'combat') return false;
    const b = s.combat;
    if (!b.dice[dieIndex] || b.rerolls <= 0) return false;
    b.rerolls--; s.stats.rerolls++; b.dice[dieIndex] = roll(s); s.lastDice = [...b.dice]; log(s, `扭转命运：重新掷出 ${b.dice[dieIndex]} 点。`); return true;
  }
  function endRound(s) {
    if (s.phase !== 'combat') return false;
    const b=s.combat,poisonTick=Math.ceil(b.poison*(mutationLevel(s,'acid_heart')>=1?1.15:1)),burnTick=Math.ceil(b.burn*(mutationLevel(s,'ash_lung')>=3?1.2:1));
    if(poisonTick||burnTick){b.hp=Math.max(0,b.hp-poisonTick-burnTick);const poisonDecay=Math.max(0,(s.mutations.includes('toxic_blood')?1:2)-(mutationLevel(s,'acid_heart')>=2?1:0)),burnDecay=Math.max(0,(s.mutations.includes('combustion_core')?2:3)-(mutationLevel(s,'ash_lung')>=1?1:0));b.poison=Math.max(0,b.poison-poisonDecay);b.burn=Math.max(0,b.burn-burnDecay);log(s,`持续伤害结算：中毒 ${poisonTick}、燃烧 ${burnTick}，共造成 ${poisonTick+burnTick} 伤害。`,'good');if(!b.hp){if(mutationLevel(s,'carrion_bloom')){addStat(s,'hp',10);if(mutationLevel(s,'carrion_bloom')>=2)addStat(s,'san',8);}winCombat(s);return true;}}
    const hpBefore=s.hp,foodBefore=s.food,waterBefore=s.water,shield=b.shield,effectiveIntent=b.intent+s.weakness*2,damage=Math.max(0,effectiveIntent-shield);
    s.hp -= damage; s.san -= b.mind;
    log(s, `${b.name}攻击：承受 ${damage} 伤害${b.mind ? `、${b.mind} SAN 损失` : ''}。`, 'danger');
    tick(s, 1, 1, 0);
    if(b.thorns){b.hp=Math.max(0,b.hp-b.thorns);if(mutationLevel(s,'thorn_skin')>=3)b.bleed+=2;}
    s.attackNotice={enemy:b.name,intent:effectiveIntent,shield,damage,mind:b.mind,hpBefore,hpAfter:s.hp,starvation:Math.max(0,(foodBefore<=1?5:0)+(waterBefore<=1?8:0)),poisonTick,burnTick};
    if (s.phase !== 'combat') return true;
    if(!b.hp){winCombat(s);return true;}
    b.discard.push(...b.hand); b.hand = []; b.round++; beginRound(s); return true;
  }
  function flee(s) {
    if (s.phase !== 'combat') return false;
    if (s.combat.kind === 'tower') return false;
    const die = roll(s); s.lastDice = [die];
    if (die >= 3) {
      s.stats.flees++;
      s.hp -= 4; s.san -= 3;
      // Normal encounters already granted their one-time loot before the fight.
      if (s.combat.kind !== 'normal') {s.map[s.position].searched = false;if(s.region)s.region.cells[s.region.position].searched=false;}
      s.combat = null; s.phase = 'explore';
      // Retreat to a known adjacent tile. Exploration still costs time.
      if(s.region){const r=s.region;r.position=localNeighbors(r.position).find(id=>r.cells[id].visited)??0;revealRegion(r);}
      else {s.position = neighbors(s.position).find(id => s.map[id].visited) ?? neighbors(s.position)[0]; reveal(s);}
      log(s, `逃离检定 ${die} ≥ 3：撤退成功，健康 −4、SAN −3。`, 'danger'); tick(s, 2, 3, 0);advance(s);
    } else { log(s, `逃离检定 ${die} < 3：撤退失败，敌人立即行动。`, 'danger'); endRound(s); }
    return true;
  }
  function mutate(s, id) {
    if(s.phase!=='mutation'||!MUTATIONS[id])return false;const current=mutationLevel(s,id),max=MUTATIONS[id].maxLevel;
    if(current>=max)return false;
    if(!s.mutations.includes(id))s.mutations.push(id);s.mutationLevels[id]=current+1;if(!s.discovered.mutations.includes(id))s.discovered.mutations.push(id);
    s.phase='explore';s.mutationOffer=null;addStat(s,'san',8);log(s,`${current?`异能升级至 Lv.${current+1}`:'异能觉醒'}：「${MUTATIONS[id].name}」。SAN +8。`,'good');advance(s);return true;
  }
  function localNeighbors(i){const x=i%3,y=Math.floor(i/3);return [x>0?i-1:-1,x<2?i+1:-1,y>0?i-3:-1,y<2?i+3:-1].filter(n=>n>=0);}
  function revealRegion(r){r.cells[r.position].visited=true;for(const id of [r.position,...localNeighbors(r.position)])r.cells[id].revealed=true;}
  function enterRegion(s){
    const t=s.map[s.position];if(s.phase!=='explore'||s.region||!t.hasInterior)return false;
    const r=t.localMap||{parent:s.position,name:TERRAIN[t.type].name+' · 内部',position:0,exit:6+Math.floor(random(s)*3),cells:Array.from({length:9},(_,id)=>({id,type:pick(s,['room','room','storage']),visited:false,revealed:false,searched:false}))};
    if(!t.localMap){r.cells[0].type='entrance';r.cells[0].searched=true;r.cells[r.exit].type='exit';r.cells[r.exit].searched=true;if(['hospital','metro'].includes(t.type)){r.cells[4].type='boss';r.cells[4].searched=t.cleared;}}
    r.position=0;s.region=r;t.localMap=null;revealRegion(r);log(s,`进入${r.name}。入口已经坍塌，需要找到出口或踏遍全部房间才能返回大地图。`);return true;
  }
  function moveRegion(s,id){
    const r=s.region;if(!r||s.phase!=='explore'||s.searchResult||s.notice||s.reward||s.encounterQueue.length||!localNeighbors(r.position).includes(id))return false;
    r.position=id;revealRegion(r);s.travel++;tick(s);
    if(s.phase==='explore'){
      if(id===r.exit){s.map[r.parent].localMap=r;s.region=null;log(s,'踏进出口，沿着通道直接返回大地图。','good');}
      else log(s,`进入内部房间 ${id+1}。`);
      resolveFuture(s);
    }return true;
  }
  function canLeaveRegion(s){return !!s.region&&(s.region.cells[s.region.exit].visited||s.region.cells.every(c=>c.visited));}
  function leaveRegion(s){
    if(s.phase!=='explore'||s.notice||s.reward||s.searchResult||s.encounterQueue.length||!canLeaveRegion(s))return false;
    const r=s.region;s.map[r.parent].localMap=r;s.region=null;log(s,'沿着出口返回大地图，内部探索进度已保留。','good');return true;
  }
  function searchRegion(s){
    const r=s.region;if(!r||s.notice||s.reward||s.searchResult||s.encounterQueue.length)return false;
    const c=r.cells[r.position];if(c.searched)return false;
    c.searched=true;s.stats.searches++;tick(s,2,3,1);if(s.phase!=='explore')return true;
    if(c.type==='boss'){s.map[s.position].searched=true;startCombat(s,s.map[s.position].type);}
    else {s.searchResult=loot(s,c.type==='storage'?'market':'ruins');s.searchResult.localCell=r.position;rollEncounters(s);}
    return true;
  }
  function validItems(items){return Array.isArray(items)&&items.every(i=>i&&['card','item'].includes(i.kind)&&Object.hasOwn(i.kind==='card'?CARDS:ITEMS,i.id)&&Number.isInteger(i.count)&&i.count>0);}
  function validRegion(r,parent){return r&&r.parent===parent&&typeof r.name==='string'&&Number.isInteger(r.position)&&r.position>=0&&r.position<9&&Number.isInteger(r.exit)&&r.exit>=0&&r.exit<9&&Array.isArray(r.cells)&&r.cells.length===9&&r.cells.every((c,i)=>c.id===i&&['room','storage','entrance','exit','boss'].includes(c.type)&&['visited','revealed','searched'].every(k=>typeof c[k]==='boolean'));}
  function restore(raw) {
    try {
      const s = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));
      if (!s || s.version !== VERSION || !['explore','combat','event','mutation','dead','victory'].includes(s.phase)) return null;
      if (!Array.isArray(s.map) || s.map.length !== 30 || !s.map.every((t,i) => t.id === i && TERRAIN[t.type])) return null;
      if (!Number.isInteger(s.position) || s.position < 0 || s.position >= 30 || !Number.isInteger(s.rng) || s.rng <= 0 || typeof s.seed !== 'string') return null;
      if (!['hp','food','water'].every(k => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 100)||!Number.isFinite(s.san)||s.san<0||s.san>110) return null;
      if (!['scrap','cores','kills','turn','restCount'].every(k => Number.isInteger(s[k]) && s[k] >= 0) || s.cores > 3) return null;
      if (!s.supplies || !['food','water','med'].every(k => Number.isInteger(s.supplies[k]) && s.supplies[k] >= 0)) return null;
      if (!Array.isArray(s.deck) || !s.deck.length || !s.deck.every(id => CARDS[id]) || !Array.isArray(s.logs) || !s.logs.every(l => typeof l.text === 'string')) return null;
      if (!Array.isArray(s.mutations) || !s.mutations.every(id => MUTATIONS[id]) || !Array.isArray(s.lastDice)) return null;
      if(s.stats===undefined)s.stats=newStats();
      for(const k of STAT_KEYS)s.stats[k]??=0;
      s.energy??=60;s.consumables??=[];s.pocketUses??=s.consumables.map(id=>CARDS[id]?.durability||1);s.encounterQueue??=[];s.reward??=null;s.attackNotice??=null;s.region??=null;
      s.mutationLevels??=Object.fromEntries(s.mutations.map(id=>[id,1]));for(const id of s.mutations)s.mutationLevels[id]??=1;s.mutationOffer??=null;
      s.weakness??=0;s.collapse??=null;s.deathSaveUsed??=false;s.survivalAlert??=null;s.survivalFlags??={foodLow:s.food<=20,waterLow:s.water<=20,foodEmpty:!s.food,waterEmpty:!s.water};
      s.supplies.chips??=0;s.supplies.coffee??=1;
      if(!s.mutations.includes('endless_chips'))s.mutations.push('endless_chips');
      s.discovered??={cards:[...new Set([...s.deck,...s.consumables])],mutations:[...s.mutations]};
      if(!s.discovered.mutations.includes('endless_chips'))s.discovered.mutations.push('endless_chips');
      if(!Number.isFinite(s.energy)||s.energy<0||s.energy>statCap(s,'energy')||s.san>statCap(s,'san')||!Array.isArray(s.consumables)||!s.consumables.every(id=>CARDS[id]?.consumable)||!Array.isArray(s.pocketUses)||s.pocketUses.length!==s.consumables.length||!s.pocketUses.every((n,i)=>Number.isInteger(n)&&n>0&&n<=(CARDS[s.consumables[i]].durability||1)))return null;
      if(!['chips','coffee'].every(k=>Number.isInteger(s.supplies[k])&&s.supplies[k]>=0))return null;
      if(!s.discovered||!Array.isArray(s.discovered.cards)||!s.discovered.cards.every(id=>Object.hasOwn(CARDS,id))||!Array.isArray(s.discovered.mutations)||!s.discovered.mutations.every(id=>Object.hasOwn(MUTATIONS,id)))return null;
      if(!s.mutationLevels||typeof s.mutationLevels!=='object'||Object.entries(s.mutationLevels).some(([id,n])=>!MUTATIONS[id]||!s.mutations.includes(id)||!Number.isInteger(n)||n<1||n>MUTATIONS[id].maxLevel))return null;
      if(s.mutationOffer&&(!Array.isArray(s.mutationOffer)||s.mutationOffer.some(id=>!MUTATIONS[id])))return null;
      if(!Number.isInteger(s.weakness)||s.weakness<0||s.weakness>3||(s.collapse!==null&&(!Number.isInteger(s.collapse)||s.collapse<0||s.collapse>5))||typeof s.deathSaveUsed!=='boolean')return null;
      if(!s.survivalFlags||!['foodLow','waterLow','foodEmpty','waterEmpty'].every(k=>typeof s.survivalFlags[k]==='boolean'))return null;
      if(s.survivalAlert&&(!['food','water'].includes(s.survivalAlert.stat)||!['warning','critical'].includes(s.survivalAlert.severity)||typeof s.survivalAlert.title!=='string'||typeof s.survivalAlert.text!=='string'))return null;
      if(!Array.isArray(s.encounterQueue)||!s.encounterQueue.every(e=>e&&(e.kind==='event'?Object.hasOwn(EVENTS,e.id):e.kind==='combat'&&e.id==='normal')))return null;
      for(const t of s.map){t.hasInterior??=['hospital','metro'].includes(t.type);t.localMap??=null;if(t.localMap&&!validRegion(t.localMap,t.id))return null;}
      if(s.region&&!validRegion(s.region,s.position))return null;
      if(s.reward&&(!validItems(s.reward.items)||typeof s.reward.title!=='string'||typeof s.reward.text!=='string'))return null;
      if(s.attackNotice){s.attackNotice.poisonTick??=0;s.attackNotice.burnTick??=0;if(!['combat','dead'].includes(s.phase)||typeof s.attackNotice.enemy!=='string'||!['intent','shield','damage','mind','hpBefore','hpAfter','starvation','poisonTick','burnTick'].every(k=>Number.isFinite(s.attackNotice[k])&&s.attackNotice[k]>=0))return null;}
      if(!s.stats||!STAT_KEYS.every(k=>Number.isInteger(s.stats[k])&&s.stats[k]>=0))return null;
      s.travel??=s.turn;s.pending??=[];s.notice??=null;s.eventData??=null;s.personality??=null;
      if(!Number.isInteger(s.travel)||s.travel<0||!Array.isArray(s.pending)||!s.pending.every(p=>p&&Number.isInteger(p.due)&&p.due>=0&&['aid','betrayal','dog_aid'].includes(p.kind)))return null;
      if(s.notice&&(!['explore'].includes(s.phase)||typeof s.notice.title!=='string'||typeof s.notice.text!=='string'||!['good','normal','danger'].includes(s.notice.tone)||!Array.isArray(s.notice.items)||!s.notice.items.every(i=>i&&['card','item'].includes(i.kind)&&Object.hasOwn(i.kind==='card'?CARDS:ITEMS,i.id)&&Number.isInteger(i.count)&&i.count>0)))return null;
      if (s.phase === 'event' && !Object.hasOwn(EVENTS,s.event)) return null;
      if(s.phase==='event'&&s.event==='merchant'){
        if(!s.eventData||!Array.isArray(s.eventData.stock)||!s.eventData.stock.every(i=>i&&['card','supply'].includes(i.kind)&&Object.hasOwn(i.kind==='card'?CARDS:SUPPLY_EFFECTS,i.id)&&Number.isInteger(i.price)&&i.price>0&&Number.isInteger(i.remaining)&&i.remaining>=0))return null;
      }
      if(s.phase==='victory'||s.phase==='dead')s.personality=personality(s);
      if (s.phase === 'combat') {
        const b = s.combat;
        if(b){b.ap??=3;b.breathed??=false;b.poison??=0;b.burn??=0;b.fuel??=0;b.bleed??=0;b.slow??=0;b.vulnerable??=0;b.thorns??=0;b.retainShield??=0;b.freeProduction??=false;b.electricRefunded??=false;if(!Number.isInteger(b.ap)||b.ap<0||b.ap>5||typeof b.breathed!=='boolean'||typeof b.freeProduction!=='boolean'||typeof b.electricRefunded!=='boolean')return null;}
        if (!b || !['normal','hospital','metro','plant','tower'].includes(b.kind) || typeof b.name !== 'string') return null;
        if (!['hp','maxHp','attack','round','shield','intent','mind','rerolls','poison','burn','fuel','bleed','slow','vulnerable','thorns','retainShield'].every(k => Number.isFinite(b[k]) && b[k] >= 0) || !b.hp) return null;
        if (!['hand','draw','discard'].every(k => Array.isArray(b[k]) && b[k].every(id => CARDS[id]))) return null;
        if (!Array.isArray(b.dice) || (b.dice.length < 3 || b.dice.length > 6) || !b.dice.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) return null;
      }
      // Older saves have no receipt. A malformed UI receipt must not erase the run.
      const receipt = s.searchResult;
      const validReceipt = receipt && ['explore','combat','event'].includes(s.phase)
        && Number.isInteger(receipt.position) && receipt.position === s.position
        && (receipt.localCell===undefined?s.map[receipt.position].searched:s.region&&receipt.localCell===s.region.position&&s.region.cells[receipt.localCell].searched)
        && Number.isInteger(receipt.scrap) && receipt.scrap > 0 && receipt.scrap <= 6
        && receipt.supplies && typeof receipt.supplies === 'object'
        && Object.entries(receipt.supplies).length > 0
        && Object.entries(receipt.supplies).every(([id,n]) => Object.hasOwn(SUPPLY_EFFECTS,id) && Number.isInteger(n) && n > 0 && n <= 3)
        && Array.isArray(receipt.cards) && receipt.cards.length <= 1 && receipt.cards.every(id => Object.hasOwn(CARDS,id));
      s.searchResult = validReceipt ? receipt : null;
      return s;
    } catch { return null; }
  }
  return { RARITIES, SUPPLY_EFFECTS, FIXED_CARDS, POCKET_CARDS, mutationLevel, mutationCost, statCap, activate, canActivate, recoverEnergy, usePocket, canUsePocket, sellCard, acknowledge, advance, moveRegion, enterRegion, leaveRegion, canLeaveRegion, VERSION, WIDTH, HEIGHT, CARDS, TERRAIN, MUTATIONS, ITEMS, EVENTS, ACHIEVEMENTS, create, restore, neighbors, move, search, rest, craft, supply, eventChoices, chooseEvent, trade, salvage, reorder, achievements, personality, play, reroll, endRound, flee, mutate };
});
