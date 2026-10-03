const fs = require('node:fs');
const path = require('node:path');
const G = require('../engine.js');

const rarityOrder = ['common','uncommon','rare','epic','legendary'];
const schoolOrder = ['毒蚀','燃烧','蛮力','防御','流血','控制','电能','骰运','生存','精神'];
const clean = value => String(value ?? '').replaceAll('|','\\|').replaceAll('\n','<br>');
const countBy = (list,key) => Object.fromEntries([...new Set(list.map(value=>value[key]))].map(id=>[id,list.filter(value=>value[key]===id).length]));
const cards = Object.entries(G.CARDS);
const powers = Object.entries(G.MUTATIONS);
const events = Object.entries(G.EVENTS);

if(cards.length < 100) throw new Error(`卡牌少于 100 张：${cards.length}`);
if(new Set(cards.map(([,card])=>card.name)).size !== cards.length) throw new Error('卡牌名称存在重复');

const rarityCounts = countBy(cards.map(([,card])=>card),'rarity');
const schoolCounts = countBy(cards.map(([,card])=>card),'school');
const fixedCount = cards.filter(([,card])=>!card.consumable).length;
const pocketCount = cards.length-fixedCount;
const durableCount = cards.filter(([,card])=>card.durability).length;
const activeCount = powers.filter(([,power])=>power.active).length;
const lines = [
  '# 《我在末世捡垃圾》内容总表',
  '',
  `当前版本包含 **${cards.length} 张卡牌、${powers.length} 项异能、${events.length} 类突发事件**。卡牌名称与说明均通过唯一性检查；收集库、成就目标和本总表按实际内容量动态生成，后续增加到 150 或 200 张时不需要改统计逻辑。`,
  '',
  '## 内容结构',
  '',
  `- 卡牌：${fixedCount} 张固有卡牌，${pocketCount} 张消耗卡牌；消耗卡中有 ${durableCount} 张耐久型。`,
  `- 异能：${activeCount} 项主动生产异能，${powers.length-activeCount} 项被动异能；${powers.filter(([,power])=>power.maxLevel>1).length} 项可以升级。`,
  `- 事件：${events.length} 类情境，共 ${events.reduce((total,[,event])=>total+event.choices.length,0)} 个可见选择。`,
  '- 战斗流派：毒蚀、燃烧、蛮力、防御、流血、控制、电能、骰运、生存、精神。',
  '- 稀有度抽取先决定稀有度，再从该档内容中抽取，扩充某一档不会挤压其他档的基础概率。',
  '',
  '| 稀有度 | 基础权重 | 卡牌数 | 异能数 |',
  '| --- | ---: | ---: | ---: |',
  ...rarityOrder.map(id=>`| ${G.RARITIES[id].name} | ${G.RARITIES[id].weight}% | ${rarityCounts[id]||0} | ${powers.filter(([,power])=>power.rarity===id).length} |`),
  '',
  '| 流派 | 卡牌数 | 核心玩法 |',
  '| --- | ---: | --- |',
];

const schoolNotes={
  毒蚀:'叠加中毒、降低衰减、按毒层催化或爆发。',燃烧:'铺设燃料、点火、延长燃烧并进行爆燃。',蛮力:'高直接伤害、撬棍与耐久武器。',防御:'护盾、保留护盾、荆棘与反击。',
  流血:'直接攻击触发附伤，维持或消耗流血层。',控制:'减速敌方意图、易伤与节奏控制。',电能:'精力循环、行动值、爆发与补骰。',骰运:'奇偶条件、重掷、补骰与骰值收益。',
  生存:'健康、食物、水分、虚弱处理与临场恢复。',精神:'SAN 管理、以理智换伤害或资源。'
};
for(const school of schoolOrder) lines.push(`| ${school} | ${schoolCounts[school]||0} | ${schoolNotes[school]} |`);

lines.push('','## 卡牌库','','固有卡消耗一枚满足条件的骰子，打出后进入弃牌堆并循环；消耗卡不需要骰子，一次性卡使用后消失，耐久卡在耐久归零后消失。');
let cardNumber=0;
for(const school of schoolOrder){
  const group=cards.filter(([,card])=>card.school===school).sort((a,b)=>rarityOrder.indexOf(a[1].rarity)-rarityOrder.indexOf(b[1].rarity)||a[1].name.localeCompare(b[1].name,'zh-CN'));
  if(!group.length)continue;
  lines.push('',`### ${school}（${group.length} 张）`,'','| # | 卡牌 | 稀有度 | 类型 | 使用条件 | 效果 |','| ---: | --- | --- | --- | --- | --- |');
  for(const [,card] of group){
    cardNumber++;
    const kind=card.consumable?(card.durability?`耐久消耗卡（${card.durability}）`:'一次性消耗卡'):'固有卡';
    lines.push(`| ${cardNumber} | ${clean(card.name)} | ${G.RARITIES[card.rarity].name} | ${kind} | ${clean(card.rule)} | ${clean(card.desc)} |`);
  }
}

lines.push('','## 异能库','','主动异能消耗全局精力生产卡牌；战斗中通常还消耗 1 行动值。已经觉醒且未满级的异能可以在后续异变节点再次出现。','','| # | 异能 | 稀有度 | 类型 | 最高等级 | 基础作用 | 升级路线 / 产物 |','| ---: | --- | --- | --- | ---: | --- | --- |');
powers.sort((a,b)=>rarityOrder.indexOf(a[1].rarity)-rarityOrder.indexOf(b[1].rarity)||a[1].name.localeCompare(b[1].name,'zh-CN')).forEach(([,power],index)=>{
  const upgrades=power.levels?.map((text,i)=>`Lv.${i+1} ${text}`).join('<br>')||'Lv.1 解锁完整效果';
  const production=power.active?`<br>生产：${G.CARDS[power.produces].name}；基础消耗 ${power.cost} 精力`:'';
  lines.push(`| ${index+1} | ${clean(power.name)} | ${G.RARITIES[power.rarity].name} | ${power.active?'主动':'被动'} | ${power.maxLevel} | ${clean(power.desc)} | ${clean(upgrades+production)} |`);
});

lines.push('','## 突发事件库','','事件可在同一地块完成物资搜寻后继续触发；随机结果在选择时确定并写入存档，刷新页面不会重抽。','','| # | 事件 | 情境 | 选择与已知后果 |','| ---: | --- | --- | --- |');
events.forEach(([,event],index)=>{
  const choices=event.choices.map(([,title,desc])=>`**${title}**：${desc}`).join('<br>');
  lines.push(`| ${index+1} | ${clean(event.title)} | ${clean(event.text)} | ${clean(choices)} |`);
});

lines.push('','## 生存状态链','','- 饱食或饮水降到 20 及以下时弹出补给提醒；归零时升级为生存警报。提醒可以关闭，不会阻塞操作。','- 饱食归零后每次行动损失 5 健康，饮水归零后每次行动损失 8 健康；相关异能可以降低消耗和伤害。','- 任一项归零会逐步叠加虚弱 I–III。虚弱 II 将战斗可用骰子降为 2 枚；虚弱 III 还会减少行动值，并开始 3 次行动的昏厥倒计时。','- 同时补回食物和水会中止昏厥倒计时并逐步移除虚弱；倒计时耗尽则死亡。','',
  '## 扩展约束','','新增卡牌时只需在内容数据中提供唯一名称、唯一说明、流派、稀有度、图标、使用条件和效果。自动测试会阻止少于 100 张、重名、重复说明、未知稀有度、无效效果结构以及无法执行的卡牌进入版本。收集库、稀有度统计和本总表会随内容量增长。','');

fs.writeFileSync(path.resolve(__dirname,'../CONTENT-CATALOG.md'),lines.join('\n'),'utf8');
console.log(`Generated CONTENT-CATALOG.md: ${cards.length} cards, ${powers.length} powers, ${events.length} events.`);
