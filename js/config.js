const BRANCHES = [
  {
    id:'data', name:'Data Stream', color:'#0f0',
    desc:'Generates resources automatically. All nodes run simultaneously.',
    nodes:[
      { id:'dataTap', name:'Data Tap', desc:'Extract raw data.', baseCost:1, reqLvl:0,
        gen:(lvl)=>({data:(0.5+lvl*0.25)}) },
      { id:'creditFlow', name:'Credit Flow', desc:'Intercept financial transactions.', baseCost:2, reqLvl:3,
        gen:(lvl)=>({credits:(0.3+lvl*0.15)}) },
      { id:'cpuHarvest', name:'CPU Harvest', desc:'Mine idle processing power.', baseCost:4, reqLvl:5,
        gen:(lvl)=>({cpu:(0.2+lvl*0.1)}) },
      { id:'bwLeech', name:'BW Leech', desc:'Siphon backbone bandwidth.', baseCost:8, reqLvl:10,
        gen:(lvl)=>({bandwidth:(0.1+lvl*0.05)}) },
    ]
  },
  {
    id:'combat', name:'Combat Matrix', color:'#f44',
    desc:'Enhances combat power. Bonuses apply during combat.',
    nodes:[
      { id:'icePick', name:'ICE Pick', desc:'+3 ATK per level.', baseCost:1, reqLvl:0,
        bonus:(lvl)=>({atk:3*lvl}) },
      { id:'shieldWall', name:'Shield Wall', desc:'+8 HP per level.', baseCost:3, reqLvl:3,
        bonus:(lvl)=>({hp:8*lvl}) },
      { id:'overdrive', name:'Overdrive', desc:'+5% ATK per level during combat.', baseCost:6, reqLvl:5,
        bonus:(lvl)=>({atkPct:5*lvl}) },
      { id:'systemBreach', name:'System Breach', desc:'+15 burst DMG per level.', baseCost:12, reqLvl:10,
        bonus:(lvl)=>({burst:15*lvl}) },
    ]
  },
  {
    id:'efficiency', name:'Efficiency Engine', color:'#0ff',
    desc:'Boosts speed, caps, and reduces costs.',
    nodes:[
      { id:'quickHands', name:'Quick Hands', desc:'+5% NP generation per level.', baseCost:1, reqLvl:0,
        bonus:(lvl)=>({npRate:0.05*lvl}) },
      { id:'resourceOpt', name:'Resource Optimizer', desc:'+10% resource caps per level.', baseCost:3, reqLvl:3,
        bonus:(lvl)=>({capMult:0.1*lvl}) },
      { id:'costReduction', name:'Cost Reduction', desc:'-3% upgrade/craft cost per level.', baseCost:6, reqLvl:5,
        bonus:(lvl)=>({costRed:0.03*lvl}) },
      { id:'perfectLoop', name:'Perfect Loop', desc:'+3% all resource gen per level.', baseCost:12, reqLvl:10,
        bonus:(lvl)=>({prodMult:0.03*lvl}) },
    ]
  }
];

const CRAFTS = [
  { id:'codeWeave', name:'Code Weave', desc:'Data + CPU -> Programs', result:'program', cost:{data:50,cpu:10} },
  { id:'hardwareAssemble', name:'Hardware Assembly', desc:'Credits + Bandwidth -> Hardware', result:'hardware', cost:{credits:75,bandwidth:15} },
  { id:'exploitKit', name:'Exploit Kit', desc:'3 Programs + 2 Hardware -> Exploit', result:'exploit', cost:{program:3,hardware:2} },
  { id:'neuralLink', name:'Neural Link', desc:'2 Exploits + Data + BW -> permanent +2% all skill speed', result:'neuralLinks', cost:{exploit:2,data:500,bandwidth:100} },
  { id:'turboCharger', name:'Turbo Charger', desc:'3 Exploits + Hardware + Credits -> permanent +5 ATK +3 DEF', result:'turboChargers', cost:{exploit:3,hardware:3,credits:200} },
  { id:'quantumProgram', name:'Quantum Program', desc:'10 Programs + 5 DM -> Quantum Program (+20 ATK burst)', result:'qProgram', cost:{program:10,darkMatter:5} },
  { id:'armorShield', name:'Armor Shield', desc:'10 Hardware + 5 DM -> Armor Shield (+50 HP burst)', result:'qHardware', cost:{hardware:10,darkMatter:5} },
  { id:'zeroDay', name:'Zero Day Exploit', desc:'5 Exploits + 3 Quantum Programs + 3 Armor Shields -> Zero Day (+150 ATK burst)', result:'qExploit', cost:{exploit:5,qProgram:3,qHardware:3} },
  { id:'refineDataShard', name:'Deconstruct Data Shard', desc:'Convert 10 Data Shards into 500 DATA', result:'', cost:{dataShard:10}, refine:(g)=>{ addRes('data',500); toast('Refined 10 Data Shards into 500 DATA', 'loot'); } },
  { id:'refineFwShard', name:'Deconstruct FW Shard', desc:'Convert 10 FW Shards into 250 CREDITS', result:'', cost:{fwShard:10}, refine:(g)=>{ addRes('credits',250); toast('Refined 10 FW Shards into 250 CREDITS', 'loot'); } },
  { id:'refineIceCore', name:'Deconstruct ICE Core', desc:'Convert 5 ICE Cores into 10 DM', result:'', cost:{iceCore:5}, refine:(g)=>{ addRes('darkMatter',10); G.prest.dm+=10; toast('Refined 5 ICE Cores into 10 DM', 'loot'); } },
  { id:'refineAiMod', name:'Deconstruct AI Module', desc:'Convert 3 AI Modules into 5 NP', result:'', cost:{aiMod:3}, refine:(g)=>{ G.neuralPoints+=5; toast('Refined 3 AI Modules into 5 NP', 'loot'); } },
];

const UPGRADES = [
  { id:'miningSpeed', name:'Data Miner v{level}', desc:'+20% DATA generation speed', cost:{credits:30}, mult:1.8, max:15 },
  { id:'sniffingSpeed', name:'Packet Sniffer v{level}', desc:'+20% CREDITS generation speed', cost:{data:40}, mult:1.8, max:15 },
  { id:'cryptoSpeed', name:'Crypto Miner v{level}', desc:'+20% CPU generation speed', cost:{credits:60,data:30}, mult:1.8, max:15 },
  { id:'scoutSpeed', name:'Network Scout v{level}', desc:'+20% BW generation speed', cost:{credits:80,cpu:20}, mult:1.8, max:15 },
  { id:'dataCap', name:'Data Reservoir v{level}', desc:'2x max data storage', cost:{credits:1000}, mult:1.3, max:10 },
  { id:'cpuCap', name:'CPU Rack v{level}', desc:'2x max CPU cores', cost:{data:300}, mult:1.3, max:10 },
  { id:'bwCap', name:'Fiber Link v{level}', desc:'2x max bandwidth', cost:{cpu:100}, mult:1.3, max:10 },
  { id:'combatBoost', name:'ICE Breaker v{level}', desc:'+15% combat damage', cost:{credits:100}, mult:1.8, max:15 },
  { id:'creditCap', name:'Swiss Account v{level}', desc:'2x max credits', cost:{data:200,cpu:50}, mult:1.3, max:10 },
  { id:'dmCap', name:'Quantum Vault v{level}', desc:'2x max dark matter', cost:{credits:1500,bandwidth:30}, mult:1.3, max:10 },
];

const DROP_LABELS = { dataShard:'Data Shard', fwShard:'FW Shard', iceCore:'ICE Core', aiMod:'AI Module', encKey:'Enc Key', dnToken:'DN Token', coreFrag:'Core Frag' };
const ITEM_LABELS = { program:'Program', hardware:'Hardware', exploit:'Exploit', neuralLinks:'Neural Link', turboChargers:'Turbo Charger', qProgram:'Quantum Program', qHardware:'Armor Shield', qExploit:'Zero Day Exploit' };

const ENEMIES = [
  { name:'ICE Wall', hp:50, atk:3, def:1, reward:{credits:10}, lvl:1, drop:'dataShard' },
  { name:'Firewall Daemon', hp:120, atk:6, def:3, reward:{credits:30,darkMatter:1}, lvl:5, drop:'fwShard' },
  { name:'Black ICE', hp:300, atk:12, def:6, reward:{credits:80,darkMatter:3}, lvl:10, drop:'iceCore' },
  { name:'AI Sentinel', hp:600, atk:20, def:10, reward:{credits:150,darkMatter:6}, lvl:15, drop:'aiMod' },
  { name:'Corporate Node', hp:1200, atk:35, def:18, reward:{credits:300,darkMatter:12}, lvl:20, drop:'encKey' },
  { name:'Darknet Server', hp:2500, atk:55, def:30, reward:{credits:600,darkMatter:25}, lvl:30, drop:'dnToken' },
  { name:'Central Core', hp:5000, atk:80, def:45, reward:{credits:1200,darkMatter:50}, lvl:40, drop:'coreFrag' },
  { name:'Quantum Gateway', hp:10000, atk:120, def:60, reward:{credits:2500,darkMatter:100}, lvl:50, drop:'coreFrag' },
  { name:'Void Processor', hp:20000, atk:180, def:80, reward:{credits:5000,darkMatter:200}, lvl:60, drop:'coreFrag' },
  { name:'Singularity Core', hp:50000, atk:300, def:120, reward:{credits:12000,darkMatter:500}, lvl:80, drop:'coreFrag' },
];

const ZONES = [
  { id:'perimeter', name:'Perimeter Net', desc:'The outer edge of the network.', reqDefeated:0, bonuses:{dataMult:1.2}, enemyRange:[0,1] },
  { id:'dmz', name:'DMZ', desc:'Demilitarized zone with stronger defenses.', reqDefeated:3, bonuses:{creditsMult:1.2}, enemyRange:[1,2] },
  { id:'corpLan', name:'Corporate LAN', desc:'Internal corporate network.', reqDefeated:6, bonuses:{cpuMult:1.2}, enemyRange:[2,3] },
  { id:'core', name:'Core Network', desc:'The heart of the system.', reqDefeated:10, bonuses:{bwMult:1.2}, enemyRange:[3,5] },
  { id:'darknet', name:'Darknet Depths', desc:'The deepest, most dangerous layer.', reqDefeated:15, bonuses:{allMult:1.15}, enemyRange:[5,7] },
];

const ACHIEVEMENTS = [
  { id:'firstData', name:'First Bytes', desc:'Earn 1K DATA total', check:g=>g.stats.earned.data>=1000, reward:{dataMult:1.05} },
  { id:'dataMiner', name:'Data Hoarder', desc:'Earn 100K DATA total', check:g=>g.stats.earned.data>=100000, reward:{dataMult:1.1} },
  { id:'creditScore', name:'Credit Seeker', desc:'Earn 1K CREDITS total', check:g=>g.stats.earned.credits>=1000, reward:{creditsMult:1.05} },
  { id:'cpuCollector', name:'CPU Collector', desc:'Earn 1K CPU total', check:g=>g.stats.earned.cpu>=1000, reward:{cpuMult:1.05} },
  { id:'bwExplorer', name:'Bandwidth Explorer', desc:'Earn 1K BANDWIDTH total', check:g=>g.stats.earned.bandwidth>=1000, reward:{bwMult:1.05} },
  { id:'dmHacker', name:'Dark Matter Hacker', desc:'Earn 10 Dark Matter total', check:g=>g.stats.earned.darkMatter>=10, reward:{dmMult:1.1} },
  { id:'skillMaster', name:'Branch Master', desc:'Reach total 50 branch levels', check:g=>{let t=0;Object.values(g.branches).forEach(b=>{Object.values(b).forEach(v=>t+=v)});return t>=50;}, reward:{speedMult:1.05} },
  { id:'jackOfAll', name:'Jack of All Trades', desc:'Unlock all branch nodes', check:g=>{let a=0,t=0;BRANCHES.forEach(b=>{b.nodes.forEach(n=>{t++;if((g.branches[b.id]||{})[n.id]||0>0)a++})});return a>=t;}, reward:{craftSpeed:1.1} },
  { id:'firstBlood', name:'First Blood', desc:'Defeat your first enemy', check:g=>g.stats.enemiesDefeated>=1, reward:{atkMult:1.1} },
  { id:'enemySlayer', name:'Enemy Slayer', desc:'Defeat 50 enemies', check:g=>g.stats.enemiesDefeated>=50, reward:{atkMult:1.15} },
  { id:'prestige1', name:'New Game+', desc:'Prestige for the first time', check:g=>g.prest.times>=1, reward:{prestMult:1.1} },
  { id:'prestige5', name:'Veteran Runner', desc:'Prestige 5 times', check:g=>g.prest.times>=5, reward:{prestMult:1.15} },
  { id:'crafter', name:'Maker', desc:'Craft 10 items', check:g=>g.stats.itemsCrafted>=10, reward:{craftSpeed:1.1} },
  { id:'massCrafter', name:'Industrialist', desc:'Craft 100 items', check:g=>g.stats.itemsCrafted>=100, reward:{craftSpeed:1.15} },
  { id:'highRoller', name:'High Roller', desc:'Earn 10K CREDITS total', check:g=>g.stats.earned.credits>=10000, reward:{creditsMult:1.1} },
  { id:'upgradeAddict', name:'Upgrade Addict', desc:'Buy 20 upgrades total', check:g=>g.upgs.reduce((s,u)=>s+u.lvl,0)>=20, reward:{upgradeMult:1.05} },
  { id:'zoneExplorer', name:'Zone Explorer', desc:'Unlock 3 zones', check:g=>g.zones.filter(z=>z.unlocked).length>=3, reward:{allMult:1.05} },
  { id:'fullMap', name:'Cartographer', desc:'Unlock all zones', check:g=>g.zones.every(z=>z.unlocked), reward:{allMult:1.1} },
  { id:'richRunner', name:'Rich Netrunner', desc:'Hold 10K of any resource at once', check:g=>Object.values(g.res).some(v=>v>=10000), reward:{capMult:1.1} },
  { id:'transcend', name:'Beyond the Code', desc:'Transcend for the first time', check:g=>g.prest.transcendTimes>=1, reward:{allMult:1.15} },
];

const BURST_EXPLOITS = [
  { id:'codeBomb', name:'Code Bomb', desc:'Deals 30 damage. Costs 5 DATA + 3 CPU.', cost:{data:5,cpu:3}, damage:30, reqEnemyLvl:1 },
  { id:'overload', name:'Overload', desc:'Deals 80 damage. Costs 20 CREDITS + 10 BW.', cost:{credits:20,bandwidth:10}, damage:80, reqEnemyLvl:10 },
  { id:'coreMelt', name:'Core Melt', desc:'Deals 200 damage. Costs 1 Exploit + 50 DATA.', cost:{exploit:1,data:50}, damage:200, reqEnemyLvl:20 },
  { id:'wormhole', name:'Wormhole', desc:'Deals 500 damage. Costs 5 Dark Matter + 200 CPU.', cost:{darkMatter:5,cpu:200}, damage:500, reqEnemyLvl:35 },
];

const SUBSCRIPTION = {
  price: 1,
  features: {
    noAds: 'Remove all ads',
    offlineProgress: 'Full offline progress (free: 25% rate, 6hr cap)',
    autoCombat: 'Auto-combat mode (free: manual only)',
    autoCraft: 'Auto-crafting queue (free: manual only)',
    fasterNP: '1.5x Neural Point generation rate',
    speedBoost: '1.25x permanent speed boost',
    cloudSave: 'Cloud save support',
    premiumThemes: 'Premium UI themes',
  }
};

const SAVE_VERSION = 7;

// ===== DAILY QUESTS =====
const QUEST_POOL = [
  { id:'qEarnData', desc:'Earn DATA', check:g=>g._questProgress?.data||0, target:5000, rewardNP:5, reward:{data:1000} },
  { id:'qEarnCredits', desc:'Earn CREDITS', check:g=>g._questProgress?.credits||0, target:2000, rewardNP:5, reward:{credits:500} },
  { id:'qDefeat', desc:'Defeat enemies', check:g=>g._questProgress?.defeated||0, target:5, rewardNP:5, reward:{darkMatter:2} },
  { id:'qCraft', desc:'Craft items', check:g=>g._questProgress?.crafted||0, target:3, rewardNP:5, reward:{cpu:200} },
  { id:'qSpendNp', desc:'Spend NP on branches', check:g=>g._questProgress?.spentNp||0, target:20, rewardNP:5, reward:{bandwidth:100} },
  { id:'qBurst', desc:'Use burst attacks', check:g=>g._questProgress?.burst||0, target:3, rewardNP:5, reward:{credits:500} },
  { id:'qPrestigeDm', desc:'Earn Dark Matter', check:g=>g._questProgress?.dmEarned||0, target:10, rewardNP:8, reward:{darkMatter:3} },
];

// ===== TIER BONUSES =====
const TIER_BONUSES = [
  { name:'Normal', hpMult:1, atkMult:1, defMult:1, rewardMult:1, color:'#0f0' },
  { name:'Advanced', hpMult:1.5, atkMult:1.3, defMult:1.2, rewardMult:1.5, color:'#ff0' },
  { name:'Elite', hpMult:2.5, atkMult:1.8, defMult:1.5, rewardMult:2.5, color:'#f44' },
];

// ===== CONSUMABLES =====
const CONSUMABLES = [
  { id:'neuralSpike', name:'Neural Spike', desc:'2x NP generation for 5 minutes', cost:{data:200,credits:100}, duration:300, effect:{npMult:2} },
  { id:'overdriveInjector', name:'Overdrive Injector', desc:'+50% ATK for 30 seconds in combat', cost:{exploit:2,cpu:50}, duration:30, effect:{atkMult:1.5} },
  { id:'shieldBooster', name:'Shield Booster', desc:'+50% DEF for 30 seconds in combat', cost:{hardware:2,bandwidth:30}, duration:30, effect:{defMult:1.5} },
  { id:'dataSurge', name:'Data Surge', desc:'2x resource generation for 2 minutes', cost:{credits:500,data:300}, duration:120, effect:{prodMult:2} },
];

// ===== ENHANCEMENT =====
const ENHANCE_ITEMS = [
  { id:'program', label:'Program', baseBonus:2, bonusLabel:'+2 ATK', maxLvl:10 },
  { id:'hardware', label:'Hardware', baseBonus:3, bonusLabel:'+3 DEF', maxLvl:10 },
  { id:'exploit', label:'Exploit', baseBonus:8, bonusLabel:'+8 ATK', maxLvl:10 },
];

function enhanceSuccessRate(lvl) { return Math.max(0.1, 1 - lvl * 0.1); }
function enhanceCost(lvl) { return { data:50*(lvl+1), credits:30*(lvl+1) }; }
const ENEMY_ABILITIES = [
  { id:'fortify', name:'Fortify', desc:'Boosts DEF by 50% for 8s', hpThreshold:0.5, effect:{defMult:1.5}, duration:8 },
  { id:'regen', name:'Regen', desc:'Heals 20% HP', hpThreshold:0.3, effect:{heal:0.2} },
  { id:'overcharge', name:'Overcharge', desc:'Doubles ATK for 5s', hpThreshold:0.6, effect:{atkMult:2}, duration:5 },
  { id:'counter', name:'Counter', desc:'Reflects 30% damage for 6s', hpThreshold:0.4, effect:{reflect:0.3}, duration:6 },
];
const ENEMY_ABILITY_MAP = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]; // index into ENEMY_ABILITIES per enemy
