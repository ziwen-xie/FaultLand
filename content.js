/* Curated expansion data. Kept separate so the portable rules engine stays readable. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FaultlandContent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const colors={毒蚀:'green',燃烧:'orange',蛮力:'orange',防御:'blue',流血:'red',控制:'blue',电能:'purple',骰运:'gold',生存:'green',精神:'purple'};
  const F=(id,name,school,rarity,min,icon,desc,effects,rule)=>[id,{name,type:school,school,rarity,min,icon,color:colors[school],desc,effects,rule:rule||`需要 ${min} 点及以上`}];
  const P=(id,name,school,rarity,icon,desc,effects,{durability=0,scope='combat',sell=0}={})=>[id,{name,type:school,school,rarity,min:0,icon,color:colors[school],desc,effects,consumable:true,durability:durability||undefined,scope,sell:sell||({common:2,uncommon:3,rare:5,epic:7,legendary:10}[rarity]),rule:scope==='any'?'战斗内外均可使用':durability?`仅战斗 · 耐久 ${durability}`:'仅战斗 · 使用后消耗'}];
  const cards=[
    // 毒蚀：叠层、催化、转化与延长。
    F('acid_spray','酸液喷壶','毒蚀','common',1,'toxin','造成少量伤害，并把骰点转化为中毒。',[{kind:'damage',base:2},{kind:'poison',scale:1}],'任意骰子'),
    F('spore_cloud','孢子扬尘器','毒蚀','uncommon',3,'toxin','附加固定毒素；高点骰让毒层维持更久。',[{kind:'poison',base:6},{kind:'slow',base:2}]),
    F('septic_blade','脓毒手术刀','毒蚀','rare',4,'knife','先割开伤口，再按现有中毒层数追加伤害。',[{kind:'damage',scale:2},{kind:'statusDamage',status:'poison',ratio:.5}]),
    F('venom_loop','回流毒管','毒蚀','uncommon',2,'toxin','中毒层数翻倍的一部分，并恢复少量精力。',[{kind:'amplify',status:'poison',scale:.5},{kind:'energy',base:5}]),
    F('caustic_hook','腐蚀吊钩','毒蚀','epic',5,'crowbar','消耗部分中毒，转化为高额穿透伤害。',[{kind:'consumeStatus',status:'poison',amount:8,ratio:2},{kind:'vulnerable',base:3}]),
    P('antidote_reversal','逆用解毒针','毒蚀','rare','syringe','削减自身虚弱，并将恢复反应变成敌方毒素。',[{kind:'weakness',amount:-1},{kind:'poison',base:8}],{sell:5}),
    P('plague_jar','培养皿毒罐','毒蚀','epic','toxin','每次倾倒附加 7 层中毒，可使用两次。',[{kind:'poison',base:7}],{durability:2,sell:8}),
    P('green_rain','绿雨胶囊','毒蚀','legendary','toxin','按敌人当前中毒层数追加毒素，并令其易伤。',[{kind:'amplify',status:'poison',scale:1},{kind:'vulnerable',base:5}],{sell:11}),

    // 燃烧：铺燃料、引燃、续火与爆燃。
    F('flare_gun','断管信号枪','燃烧','common',2,'lighter','直接造成伤害，并留下少量燃烧。',[{kind:'damage',base:3,scale:1},{kind:'burn',base:2}]),
    F('ember_chain','余烬锁链','燃烧','uncommon',3,'lighter','燃烧越旺，锁链抽击越重。',[{kind:'damage',base:2,scale:1},{kind:'statusDamage',status:'burn',ratio:.4}]),
    F('furnace_door','锅炉门板','燃烧','rare',4,'shield','以护盾守住热浪，同时给敌人泼上燃料。',[{kind:'shield',base:5,scale:1},{kind:'fuel',base:5}]),
    F('tar_bomb','沥青弹弓','燃烧','uncommon',2,'fuel','附加燃料与减速，为下一次点火准备。',[{kind:'fuel',base:4,scale:1},{kind:'slow',base:2}]),
    F('hot_wind','排风口热浪','燃烧','epic',5,'firebottle','延长现有燃烧并补充精力。',[{kind:'burn',base:3,scale:1},{kind:'energy',base:8}]),
    P('thermite','铝热剂纸包','燃烧','rare','firebottle','造成穿透伤害，并附加无法忽视的高热。',[{kind:'damage',base:8},{kind:'burn',base:5}],{sell:6}),
    P('napalm_flask','凝固汽油瓶','燃烧','epic','fuel','同时铺设燃料和火焰，下一次引燃更猛烈。',[{kind:'fuel',base:10},{kind:'burn',base:6}],{sell:8}),
    P('signal_flare','长明信号棒','燃烧','legendary','lighter','立刻点燃全部燃料，并让燃烧层数再次增长。',[{kind:'ignite',base:8},{kind:'amplify',status:'burn',scale:.5}],{durability:2,sell:12}),

    // 蛮力：稳定直伤、易伤、处决与耐久工具。
    F('sledgehammer','拆墙大锤','蛮力','common',4,'crowbar','沉重但可靠，骰点越高伤害增长越快。',[{kind:'damage',base:4,scale:2}]),
    F('nail_bat','钉板球棒','蛮力','common',2,'crowbar','一次挥击同时造成物理伤害和流血。',[{kind:'damage',base:3,scale:1},{kind:'bleed',base:2}]),
    F('rebar_spear','钢筋长矛','蛮力','uncommon',3,'crowbar','精准突刺，并给目标留下易伤破口。',[{kind:'damage',base:2,scale:2},{kind:'vulnerable',base:2}]),
    F('brick_throw','兜帽里的砖','蛮力','common',1,'scrap','低点骰也能出手，顺便打乱敌人动作。',[{kind:'damage',base:4},{kind:'slow',scale:1}],'任意骰子'),
    F('chainsaw','手摇链锯','蛮力','epic',5,'crowbar','高额伤害，若目标正在流血则再锯一次。',[{kind:'damage',base:5,scale:2},{kind:'statusDamage',status:'bleed',ratio:.7}]),
    F('pipe_wrench','沉头管钳','蛮力','uncommon',3,'wrench','伤害与护盾兼备，适合稳步换血。',[{kind:'damage',base:3,scale:1},{kind:'shield',base:2,scale:1}]),
    F('hydraulic_punch','液压冲头','蛮力','legendary',6,'crowbar','消耗全部易伤并把它放大成一次重击。',[{kind:'damage',base:12,scale:2},{kind:'consumeStatus',status:'vulnerable',amount:99,ratio:2}]),
    P('demolition_charge','定向爆破包','蛮力','rare','fuel','造成大额一次性伤害，同时让敌人更脆弱。',[{kind:'damage',base:16},{kind:'vulnerable',base:4}],{sell:7}),
    P('sawblade','回收锯片','蛮力','epic','crowbar','可重复投掷的锯片，每次同时造成伤害与流血。',[{kind:'damage',base:7},{kind:'bleed',base:3}],{durability:3,sell:9}),
    P('kinetic_ram','蓄压撞锤','蛮力','legendary','crowbar','按当前护盾追加冲撞伤害，适合重甲流收尾。',[{kind:'damage',base:10},{kind:'shieldDamage',ratio:.8}],{durability:2,sell:12}),

    // 防御：护盾、荆棘、保留与转化。
    F('door_shield','冰柜门盾','防御','common',1,'shield','获得基础护盾，低点骰也能稳定防守。',[{kind:'shield',base:6,scale:1}],'任意骰子'),
    F('tire_armor','轮胎护肩','防御','uncommon',2,'armor','获得护盾并添加反伤尖刺。',[{kind:'shield',base:4,scale:1},{kind:'thorns',base:2}]),
    F('parry_hook','格挡弯钩','防御','rare',4,'crowbar','用护盾反推敌人，已有护盾越高伤害越高。',[{kind:'shield',base:3,scale:1},{kind:'shieldDamage',ratio:.5}]),
    F('bunker_stance','公交站堡垒','防御','epic',5,'shield','建立大量护盾，并让一部分护盾保留到下回合。',[{kind:'shield',base:8,scale:1},{kind:'retainShield',base:6}]),
    F('mirror_plate','反光钢板','防御','rare',3,'armor','获得护盾；敌人意图越高，追加护盾越多。',[{kind:'shield',base:3,scale:1},{kind:'intentShield',ratio:.5}]),
    P('riot_foam','防暴泡沫罐','防御','uncommon','shield','立刻获得护盾并降低敌人下一次攻击。',[{kind:'shield',base:8},{kind:'slow',base:3}],{sell:4}),
    P('ceramic_vest','拼接陶瓷甲','防御','epic','armor','耐久护甲，每次提供 12 点护盾。',[{kind:'shield',base:12}],{durability:3,sell:9}),
    P('emergency_cover','折叠掩体','防御','legendary','shield','提供大量护盾，并保留其中一部分到下回合。',[{kind:'shield',base:18},{kind:'retainShield',base:10}],{durability:2,sell:12}),

    // 流血：攻击触发、层数消费与以血换血。
    F('razor_wire','剃刀铁丝','流血','common',2,'knife','附加流血；之后每次直接攻击都会触发它。',[{kind:'bleed',base:2,scale:1}]),
    F('glass_shiv','玻璃锥','流血','common',1,'knife','轻伤目标并留下少量流血。',[{kind:'damage',base:2,scale:1},{kind:'bleed',base:1,scale:.5}],'任意骰子'),
    F('bone_saw','缺齿骨锯','流血','uncommon',3,'knife','按现有流血层数追加伤害，但不会消耗流血。',[{kind:'damage',base:3,scale:1},{kind:'statusDamage',status:'bleed',ratio:.5}]),
    F('barbed_arrow','倒刺弩箭','流血','rare',4,'knife','造成伤害、流血与易伤三重效果。',[{kind:'damage',base:2,scale:1},{kind:'bleed',base:3},{kind:'vulnerable',base:2}]),
    F('red_debt','血债清算','流血','epic',5,'heart','消耗全部流血形成爆发，并为自己恢复生命。',[{kind:'consumeStatus',status:'bleed',amount:99,ratio:2},{kind:'heal',base:6}]),
    P('butcher_hook','屠宰钩','流血','rare','crowbar','可重复使用的钩索，造成伤害并叠加流血。',[{kind:'damage',base:5},{kind:'bleed',base:4}],{durability:3,sell:7}),
    P('blood_bag','温热血袋','流血','epic','heart','恢复健康，并按目标流血层数额外治疗。',[{kind:'heal',base:14},{kind:'statusHeal',status:'bleed',ratio:.5}],{scope:'any',sell:8}),
    P('shrapnel_can','铁屑压力罐','流血','legendary','scrap','制造大量流血并立刻触发一次流血伤害。',[{kind:'bleed',base:10},{kind:'statusDamage',status:'bleed',ratio:1}],{sell:11}),

    // 控制：减速、冻结意图与节奏交换。
    F('coolant_spray','冷却液喷枪','控制','common',2,'water','降低敌人下一回合攻击，并造成轻微伤害。',[{kind:'slow',base:2,scale:1},{kind:'damage',base:1}]),
    F('freezer_coil','冰柜铜管','控制','uncommon',3,'energy','添加减速并补充护盾。',[{kind:'slow',base:4},{kind:'shield',base:2,scale:1}]),
    F('ice_pick','结霜冰镐','控制','rare',4,'crowbar','目标越迟缓，冰镐造成的伤害越高。',[{kind:'damage',base:4,scale:1},{kind:'statusDamage',status:'slow',ratio:1}]),
    F('pressure_valve','泄压阀','控制','uncommon',2,'fuel','消耗部分燃料转为减速与护盾。',[{kind:'consumeStatus',status:'fuel',amount:6,ratio:.5},{kind:'slow',base:4},{kind:'shield',base:4}]),
    F('white_noise','白噪声广播','控制','epic',5,'brain','大幅降低敌方攻击，并恢复少量理智。',[{kind:'slow',base:8},{kind:'san',base:5}]),
    P('cryo_grenade','制冷剂手雷','控制','rare','water','立刻造成伤害并施加大量减速。',[{kind:'damage',base:6},{kind:'slow',base:7}],{sell:6}),
    P('foam_trap','膨胀泡沫陷阱','控制','epic','shield','可重复限制敌人，每次减速并施加易伤。',[{kind:'slow',base:5},{kind:'vulnerable',base:3}],{durability:3,sell:9}),
    P('cold_battery','零下电池','控制','legendary','energy','把减速层数转化为精力与额外骰子。',[{kind:'statusEnergy',status:'slow',ratio:1},{kind:'dice',base:1}],{sell:11}),

    // 电能：精力循环、骰子扩展与电弧爆发。
    F('tesla_coil','手卷特斯拉线圈','电能','common',3,'spark','造成电击伤害并恢复与骰点相关的精力。',[{kind:'damage',base:2,scale:1},{kind:'energy',base:2,scale:1}]),
    F('copper_loop','铜线回路','电能','common',1,'energy','用低点骰换取护盾与精力。',[{kind:'shield',base:2,scale:1},{kind:'energy',base:4}],'任意骰子'),
    F('overload_switch','过载闸刀','电能','rare',5,'spark','消耗精力换取三倍骰点伤害。',[{kind:'energyCost',base:10},{kind:'damage',scale:3}]),
    F('arc_net','电弧捕网','电能','uncommon',3,'spark','电击敌人并降低其下一次攻击。',[{kind:'damage',base:3,scale:1},{kind:'slow',base:3}]),
    F('battery_bite','咬线取电','电能','epic',4,'energy','按缺失精力获得伤害，同时恢复精力。',[{kind:'missingEnergyDamage',ratio:.15},{kind:'energy',base:6,scale:1}]),
    P('capacitor_pack','拆机电容组','电能','uncommon','energy','恢复精力并获得一个随机骰子。',[{kind:'energy',base:18},{kind:'dice',base:1}],{sell:4}),
    P('emp_can','电磁脉冲罐','电能','epic','spark','伤害、减速并令目标易伤。',[{kind:'damage',base:9},{kind:'slow',base:4},{kind:'vulnerable',base:3}],{sell:8}),
    P('jumpstarter','汽车应急电源','电能','legendary','energy','耐久充能设备，每次恢复精力并增加行动值。',[{kind:'energy',base:15},{kind:'ap',base:1}],{durability:3,sell:12}),

    // 骰运：重掷、补骰、奇偶奖励与资源套利。
    F('loaded_coin','灌铅硬币','骰运','common',1,'dice','获得重掷次数，并按骰点得到少量护盾。',[{kind:'reroll',base:1},{kind:'shield',scale:1}],'任意骰子'),
    F('reroll_map','涂改路线图','骰运','uncommon',2,'map','增加重掷次数，并抽取一张牌。',[{kind:'reroll',base:1},{kind:'draw',base:1}]),
    F('six_sense','第六点直觉','骰运','rare',6,'eye','六点骰专属爆发：伤害、护盾与精力同时增长。',[{kind:'damage',base:12},{kind:'shield',base:6},{kind:'energy',base:6}],'仅限 6 点'),
    F('odd_contract','奇数契约','骰运','rare',1,'dice','奇数骰获得双倍基础伤害与一枚新骰子。',[{kind:'parityDamage',parity:'odd',base:9},{kind:'conditionalDice',parity:'odd',base:1}],'需要奇数骰'),
    F('even_contract','偶数契约','骰运','rare',2,'dice','偶数骰转化为护盾、精力与一次重掷。',[{kind:'parityShield',parity:'even',base:9},{kind:'energy',base:5},{kind:'reroll',base:1}],'需要偶数骰'),
    P('spare_dice','桌游备用骰','骰运','epic','dice','添加三枚随机骰子，但仍受六枚上限约束。',[{kind:'dice',base:3}],{sell:8}),
    P('fate_coupon','命运兑换券','骰运','legendary','dice','耐久凭证：补骰、抽牌并增加重掷机会。',[{kind:'dice',base:1},{kind:'draw',base:1},{kind:'reroll',base:1}],{durability:3,sell:12}),

    // 生存：生命、饥渴、虚弱和持续恢复。
    F('rain_collector','折叠接雨布','生存','common',1,'water','恢复水分，并获得一点护盾。',[{kind:'water',base:3,scale:1},{kind:'shield',base:2}],'任意骰子'),
    F('ration_math','口粮精算表','生存','common',2,'food','恢复饱食与精力，适合延长探索。',[{kind:'food',base:4,scale:1},{kind:'energy',base:3}]),
    F('field_surgery','废墟外科','生存','rare',4,'med','大量治疗，但会消耗少量理智。',[{kind:'heal',base:5,scale:2},{kind:'sanCost',base:3}]),
    F('painkiller','过期止痛片','生存','uncommon',2,'med','恢复健康并移除一级虚弱。',[{kind:'heal',base:4,scale:1},{kind:'weakness',amount:-1}]),
    F('second_wind','撑过这一口气','生存','epic',5,'heart','生命越低治疗越多，并恢复行动值。',[{kind:'missingHpHeal',ratio:.25},{kind:'ap',base:1}]),
    P('purifier_tab','军用净水片','生存','uncommon','water','恢复水分并缓解一级虚弱。',[{kind:'water',base:30},{kind:'weakness',amount:-1}],{scope:'any',sell:4}),
    P('nutrient_gel','营养凝胶','生存','rare','food','同时恢复饱食、精力与少量健康。',[{kind:'food',base:24},{kind:'energy',base:12},{kind:'heal',base:6}],{scope:'any',sell:6}),
    P('trauma_kit','创伤处理箱','生存','legendary','med','耐久医疗箱，每次治疗并清除一级虚弱。',[{kind:'heal',base:20},{kind:'weakness',amount:-1},{kind:'san',base:4}],{durability:3,scope:'any',sell:12}),

    // 精神：SAN 管理、意图压制与异常换伤。
    F('memory_anchor','记忆锚点','精神','common',1,'photo','恢复理智，并生成少量护盾。',[{kind:'san',base:4,scale:1},{kind:'shield',base:2}],'任意骰子'),
    F('panic_button','广播室警铃','精神','uncommon',3,'brain','消耗理智制造伤害，同时降低敌方攻击。',[{kind:'sanCost',base:4},{kind:'damage',base:5,scale:2},{kind:'slow',base:2}]),
    F('lucid_dream','清醒梦手册','精神','rare',4,'photo','恢复理智、抽牌并补充重掷。',[{kind:'san',base:6,scale:1},{kind:'draw',base:1},{kind:'reroll',base:1}]),
    F('echo_blast','回声反冲','精神','epic',5,'spark','按当前理智造成伤害，然后承受精神代价。',[{kind:'sanDamage',ratio:.18},{kind:'sanCost',base:6}]),
    F('mind_cage','思维囚笼','精神','legendary',6,'brain','大幅压制敌方攻击，并按压制量造成伤害。',[{kind:'slow',base:12},{kind:'damage',base:12}],'仅限 6 点'),
    P('quiet_room','便携静音帐','精神','epic','brain','恢复理智与生命，并获得一次重掷。',[{kind:'san',base:18},{kind:'heal',base:8},{kind:'reroll',base:1}],{scope:'any',sell:8})
  ];

  const mutations={
    acid_heart:{name:'强酸心室',rarity:'rare',icon:'toxin',maxLevel:3,desc:'毒蚀伤害增强，可升级。',levels:['中毒结算伤害 +15%','中毒衰减再降低 1','施加中毒时额外 +2 层']},
    carrion_bloom:{name:'腐食花冠',rarity:'epic',icon:'toxin',maxLevel:2,desc:'敌人死于持续伤害时恢复健康。',levels:['恢复 10 健康','同时恢复 8 SAN']},
    ash_lung:{name:'灰烬肺',rarity:'uncommon',icon:'lighter',maxLevel:3,desc:'燃烧持续时间与威力逐级提高。',levels:['燃烧衰减 −1','每次点燃额外 +3','燃烧结算伤害 +20%']},
    scavenger_muscle:{name:'拾荒肌群',rarity:'common',icon:'crowbar',maxLevel:3,desc:'蛮力卡伤害随等级增加。',levels:['蛮力伤害 +2','耐久卡伤害再 +2','撬棍耐久耗尽时返还 8 精力']},
    clotting_control:{name:'凝血操控',rarity:'rare',icon:'heart',maxLevel:2,desc:'流血层数更难消退，触发伤害更高。',levels:['流血触发伤害 +25%','流血触发后不再自然衰减']},
    cold_field:{name:'低温场',rarity:'uncommon',icon:'water',maxLevel:3,desc:'减速效果提高，并转化为防护。',levels:['施加减速额外 +1','回合开始按减速获得护盾','敌方最低攻击可降至 0']},
    living_capacitor:{name:'活体电容',rarity:'rare',icon:'energy',maxLevel:3,desc:'精力上限与电能卡收益提高。',levels:['精力上限提高到 110','电能卡恢复精力 +3','每回合首次电能卡返还骰子']},
    bone_archive:{name:'骨质档案',rarity:'epic',icon:'armor',maxLevel:2,desc:'保留护盾，并强化耐久护甲。',levels:['每回合保留最多 5 护盾','耐久护甲提供护盾 +4']},
    lucky_marrows:{name:'幸运骨髓',rarity:'rare',icon:'dice',maxLevel:3,desc:'重掷与补骰更可靠。',levels:['每回合重掷 +1','新增骰子最低为 3','掷出 6 时恢复 4 精力']},
    ration_stomach:{name:'储粮胃袋',rarity:'common',icon:'food',maxLevel:3,desc:'降低探索消耗并延缓虚弱。',levels:['移动饱食消耗 −1','饥饿伤害 −2','虚弱倒计时延长 2 次行动']},
    water_recycler:{name:'体液回收',rarity:'uncommon',icon:'water',maxLevel:3,desc:'降低水分消耗并强化补水。',levels:['移动水分消耗 −1','补水效果 +20%','脱水伤害 −3']},
    lucid_core:{name:'清醒核心',rarity:'epic',icon:'brain',maxLevel:2,desc:'精神卡与 SAN 上限得到强化。',levels:['精神卡恢复 SAN +3','SAN 上限提高到 110']},
    pocket_factory:{name:'口袋工厂',rarity:'legendary',icon:'backpack',maxLevel:3,desc:'主动异能生产效率提高。',levels:['生产消耗精力 −3','20% 概率额外生产一张','战斗中首次生产不消耗行动值']},
    recovery_shell:{name:'复苏外壳',rarity:'rare',icon:'med',maxLevel:2,desc:'低生命时提高治疗，并抵抗一次倒下。',levels:['生命低于 35 时治疗 +30%','每局一次在致死时保留 1 健康']},
    thorn_skin:{name:'棘刺皮肤',rarity:'uncommon',icon:'shield',maxLevel:3,desc:'被攻击时让敌人承受反伤。',levels:['每回合获得 2 荆棘','荆棘伤害 +2','反伤后附加 2 流血']},
    temporal_spleen:{name:'时差脾脏',rarity:'legendary',icon:'energy',maxLevel:2,desc:'提高行动值循环能力。',levels:['每三回合额外获得 1 行动值','使用补骰、抽牌、重掷或加行动值的卡后恢复 5 精力']}
  };

  const events={
    rooftop_garden:{title:'屋顶上的菜园',icon:'food',text:'有人在废楼顶种出了一排发黄的蔬菜。守园人不愿白送，但愿意交换。',choices:[['trade','用 2 零件换种子与菜叶','饱食 +22，获得 1 罐头'],['help','花时间修补集水槽','水分 −5；获得食物并提高理智'],['leave','不惊动守园人','安静离开']],resolutions:{trade:{requires:{scrap:2},cost:{scrap:2},result:{food:22,supplies:{food:1}},title:'一小把新鲜菜叶'},help:{cost:{water:5},result:{food:16,san:8,supplies:{food:1}},title:'屋顶重新接住雨水'},leave:{result:{san:1},title:'把绿色留在身后'}}},
    dry_well:{title:'干涸的消防井',icon:'water',text:'井底还有一点反光。绳索已经磨损，下降意味着把退路交给运气。',choices:[['descend','沿旧绳下井','可能找到净水，也可能摔伤'],['filter','用 3 零件修好滤芯','稳定获得 2 净水'],['leave','保留体力','不冒险']],resolutions:{descend:{risk:true,outcomes:[{weight:65,result:{water:25,supplies:{water:2}},title:'井底仍有活水'},{weight:35,result:{hp:-12,san:-3},title:'绳索在半途断裂'}]},filter:{requires:{scrap:3},cost:{scrap:3},result:{supplies:{water:2},water:12},title:'滤芯重新转动'},leave:{result:{},title:'井口归于寂静'}}},
    radio_child:{title:'收音机里的孩子',icon:'journal',text:'频道里反复传来一个孩子报出的坐标。声音很近，却从不回答你的问题。',choices:[['answer','回应坐标','消耗理智，揭示一处地点并获得线索'],['trace','拆机追踪信号','消耗 2 零件；可能得到稀有卡牌'],['silence','关掉收音机','恢复少量理智']],resolutions:{answer:{cost:{san:5},result:{reveal:2,san:3},title:'雾里多出两处坐标'},trace:{requires:{scrap:2},cost:{scrap:2},outcomes:[{weight:70,result:{cardRarity:'rare'},title:'夹层里藏着一张卡'},{weight:30,result:{san:-8,energy:12},title:'回声钻进了脑海'}]},silence:{result:{san:6},title:'噪声终于停止'}}},
    bus_graveyard:{title:'公交车坟场',icon:'ruins',text:'废弃公交首尾相连，像一条生锈的迷宫。车窗后挂着许多无人认领的背包。',choices:[['search','逐辆搜查','获得零件，可能遇到陷阱'],['pry','用撬棍打开驾驶室','需要持有撬棍类卡牌；获得卡牌'],['mark','在车顶留下路标','恢复理智并揭示道路']],resolutions:{search:{risk:true,outcomes:[{weight:70,result:{scrap:7,supplies:{chips:1}},title:'行李架还有东西'},{weight:30,result:{hp:-9,scrap:3},title:'破玻璃划开了手臂'}]},pry:{requires:{school:'蛮力'},result:{cardSchool:'防御',scrap:3},title:'驾驶座下的应急箱'},mark:{result:{san:5,reveal:1},title:'高处看清了一段路'}}},
    funeral_fire:{title:'没有名字的葬火',icon:'lighter',text:'几具遗体被整齐放在路边，旁边留着燃料和一张请求火化的纸条。',choices:[['honor','完成陌生人的请求','消耗 1 张燃烧卡；SAN +12'],['loot','拿走燃料和背包','获得燃烧卡与零件，SAN 下降'],['leave','保持沉默','安静离开']],resolutions:{honor:{requires:{school:'燃烧',pocket:true},cost:{pocketSchool:'燃烧'},result:{san:12},title:'火光替他们留下姓名'},loot:{result:{cardSchool:'燃烧',scrap:5,san:-8},title:'你拿走了死者的东西'},leave:{result:{san:2},title:'风吹过那张纸条'}}},
    dog_pack:{title:'跟着你的瘦狗',icon:'heart',text:'一只瘦得只剩骨架的狗远远跟着你。它既不靠近，也不离开。',choices:[['feed','分出一份罐头','消耗 1 罐头；获得未来援助'],['approach','伸手让它闻气味','可能被咬，也可能获得陪伴'],['drive','把它赶走','保留物资']],resolutions:{feed:{requires:{supply:{food:1}},cost:{supply:{food:1}},result:{pending:'dog_aid',san:8},title:'它记住了你的气味'},approach:{risk:true,outcomes:[{weight:60,result:{pending:'dog_aid',san:5},title:'它在几步外趴下'},{weight:40,result:{hp:-8},title:'恐惧让它咬了一口'}]},drive:{result:{san:-2},title:'脚步声终于消失'}}},
    quarantine_gate:{title:'仍在工作的检疫门',icon:'hospital',text:'扫描仪亮起红光，要求提供血样。门后是保存完好的医疗储藏区。',choices:[['sample','提交血样','健康 −8；获得医疗物资'],['override','消耗 4 零件短接门锁','获得生存卡牌'],['retreat','拒绝扫描','理智 +2']],resolutions:{sample:{cost:{hp:8},result:{supplies:{med:2},san:4},title:'门后还有无菌敷料'},override:{requires:{scrap:4},cost:{scrap:4},result:{cardSchool:'生存',supplies:{med:1}},title:'门锁被成功绕过'},retreat:{result:{san:2},title:'红光在身后熄灭'}}},
    flooded_archive:{title:'泡水的档案馆',icon:'journal',text:'档案柜浸在齐腰深的水中。密封抽屉里可能有城区地图，也可能只有霉菌。',choices:[['wade','涉水打开抽屉','水分下降；揭示地图并可能中毒'],['drain','启动排水泵','消耗 10 精力；获得精神卡牌'],['leave','不碰霉水','离开']],resolutions:{wade:{cost:{water:8},outcomes:[{weight:65,result:{reveal:3,scrap:4},title:'档案中有旧城区图'},{weight:35,result:{hp:-6,san:-5},title:'霉菌让你呼吸困难'}]},drain:{requires:{energy:10},cost:{energy:10},result:{cardSchool:'精神',reveal:1},title:'抽屉露出了水面'},leave:{result:{},title:'纸页继续在水里腐烂'}}},
    vending_machine:{title:'最后一台售货机',icon:'chips',text:'售货机还亮着，屏幕只显示一句话：投币，或者证明你比机器聪明。',choices:[['pay','投入 3 零件','获得薯片与随机消耗卡'],['hack','赌一次线路短接','可能获得更多，也可能触电'],['smash','直接砸开玻璃','需要蛮力卡；获得补给并受轻伤']],resolutions:{pay:{requires:{scrap:3},cost:{scrap:3},result:{supplies:{chips:2},cardType:'consumable'},title:'弹簧终于转了一圈'},hack:{risk:true,outcomes:[{weight:55,result:{supplies:{chips:3,coffee:1},cardRarity:'uncommon'},title:'机器吐出了全部库存'},{weight:45,result:{hp:-10,energy:15},title:'火花顺着手臂爬过'}]},smash:{requires:{school:'蛮力'},result:{supplies:{chips:2},hp:-4},title:'玻璃碎了一地'}}},
    survivor_trial:{title:'幸存者的审判',icon:'shield',text:'一群居民拦住去路，指控你拿走了属于社区的物资。没人能证明，但每个人都很饿。',choices:[['share','交出一份食物和水','换取安全与稀有情报'],['argue','据理力争','进行一次随机判定'],['threaten','亮出武器','获得零件，理智下降']],resolutions:{share:{requires:{supply:{food:1,water:1}},cost:{supply:{food:1,water:1}},result:{reveal:3,san:10},title:'他们让出一条路'},argue:{risk:true,outcomes:[{weight:60,result:{san:6,scrap:4},title:'有人相信了你'},{weight:40,result:{hp:-10,san:-6},title:'争吵变成了推搡'}]},threaten:{result:{scrap:5,san:-10},title:'人群沉默地退开'}}},
    lightning_tree:{title:'长满电线的树',icon:'spark',text:'无数电缆缠在枯树上，蓝色火花像果实一样闪烁。空气闻起来像雨前。',choices:[['harvest','收集电荷','恢复精力，可能获得电能卡'],['ground','用 2 零件做接地线','安全获得电能卡与咖啡'],['listen','聆听电流节奏','消耗理智，获得重掷相关卡牌']],resolutions:{harvest:{risk:true,outcomes:[{weight:70,result:{energy:30,cardSchool:'电能'},title:'电荷被收入电池'},{weight:30,result:{hp:-12,energy:20},title:'电弧穿透了手套'}]},ground:{requires:{scrap:2},cost:{scrap:2},result:{cardSchool:'电能',supplies:{coffee:1}},title:'接地线稳住了火花'},listen:{cost:{san:6},result:{cardSchool:'骰运',energy:10},title:'你听见了概率的节拍'}}},
    silent_train:{title:'无声驶来的列车',icon:'metro',text:'没有铁轨的街面上，一节地铁车厢缓慢滑过。车门只会打开十秒。',choices:[['board','立刻上车','随机移动并获得高稀有卡牌'],['reach','只抓取门边行李','获得物资，可能受伤'],['hide','躲开不合理的列车','恢复理智']],resolutions:{board:{risk:true,result:{teleport:true,cardRarity:'epic',san:-7},title:'车门在另一条街打开'},reach:{outcomes:[{weight:70,result:{scrap:6,supplies:{water:1,food:1}},title:'抓住了一只旅行袋'},{weight:30,result:{hp:-7,scrap:3},title:'车门夹伤了手'}]},hide:{result:{san:7},title:'列车穿墙而去'}}},
    mirror_market:{title:'镜面集市',icon:'market',text:'摊主们都戴着与你相同的脸。他们只接受记忆、疼痛或未来作为货币。',choices:[['memory','支付 10 SAN','获得史诗精神或异能卡'],['pain','支付 12 健康','获得史诗防御或蛮力卡'],['future','接受虚弱一级','获得传说级随机卡牌']],resolutions:{memory:{cost:{san:10},result:{cardSchools:['精神','电能'],cardRarity:'epic'},title:'一段记忆换来一张牌'},pain:{cost:{hp:12},result:{cardSchools:['防御','蛮力'],cardRarity:'epic'},title:'伤口成为交易凭证'},future:{result:{weakness:1,cardRarity:'legendary'},title:'未来少了一点，口袋重了一点'}}},
    weather_station:{title:'自动气象站',icon:'tower',text:'终端预测六小时后会有酸雨。储藏柜里有滤水器，但警报可能招来怪物。',choices:[['forecast','下载完整预报','揭示四处地图，SAN +4'],['open','强行开启储藏柜','获得净水与控制卡，追加战斗'],['disable','拆走报警器','获得零件和电能卡']],resolutions:{forecast:{result:{reveal:4,san:4},title:'云层的走向被标上地图'},open:{result:{supplies:{water:2},cardSchool:'控制',combat:true},title:'警报响彻街区'},disable:{result:{scrap:6,cardSchool:'电能'},title:'报警器成了零件'}}}
  };

  return {EXTRA_CARDS:Object.fromEntries(cards),EXTRA_MUTATIONS:mutations,EXTRA_EVENTS:events};
});
