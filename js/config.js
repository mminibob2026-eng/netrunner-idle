// Resource display names (internal id -> display)
const RES = { data:{n:'XP',i:'<>',c:'#0f0'}, credits:{n:'LOC',i:'~~',c:'#ff0'}, cpu:{n:'Proc',i:'{}',c:'#0ff'}, bandwidth:{n:'Insight',i:'&&',c:'#f0f'}, darkMatter:{n:'Mastery',i:'**',c:'#fff'} };
const NP_LABEL = 'KP';
const XP_LABEL = 'XP';
const LOC_LABEL = 'LOC';
const KP_LABEL = 'KP';
const INSIGHT_LABEL = 'Insight';
const MASTERY_LABEL = 'Mastery';

const BRANCHES = [
  {
    id:'python', name:'Python', color:'#3776AB',
    desc:'Readable, friendly. The language that says "hello" to the world.',
    nodes:[
      { id:'print', name:'print()', desc:'Output your first message to the world.', baseCost:1, reqLvl:0,
        gen:(lvl)=>({data:(0.5+lvl*0.25)}) },
      { id:'variables', name:'Variables & Types', desc:'Store data in named boxes.', baseCost:3, reqLvl:3,
        gen:(lvl)=>({data:(0.4+lvl*0.18), credits:(0.1+lvl*0.04), cpu:(0.05+lvl*0.02)}) },
      { id:'lists', name:'Lists & Loops', desc:'Collections of items you can iterate through.', baseCost:6, reqLvl:5,
        gen:(lvl)=>({data:(0.3+lvl*0.12), credits:(0.2+lvl*0.08), cpu:(0.1+lvl*0.04)}) },
      { id:'dicts', name:'Dictionaries', desc:'Key-value pairs for organized data.', baseCost:12, reqLvl:8,
        gen:(lvl)=>({data:(0.5+lvl*0.2), credits:(0.4+lvl*0.12), cpu:(0.15+lvl*0.06)}) },
    ]
  },
  {
    id:'javascript', name:'JavaScript', color:'#F7DF1E',
    desc:'The language of the web. Brings pages to life.',
    nodes:[
      { id:'console', name:'console.log()', desc:'Log messages to the browser console.', baseCost:2, reqLvl:0,
        gen:(lvl)=>({data:(0.4+lvl*0.2)}) },
      { id:'dom', name:'DOM Manipulation', desc:'Change what users see on a web page.', baseCost:4, reqLvl:3,
        gen:(lvl)=>({data:(0.3+lvl*0.15), credits:(0.2+lvl*0.06), cpu:(0.05+lvl*0.02)}) },
      { id:'events', name:'Event Handling', desc:'Respond to clicks, keys, and user actions.', baseCost:8, reqLvl:5,
        gen:(lvl)=>({data:(0.4+lvl*0.15), credits:(0.3+lvl*0.1), cpu:(0.1+lvl*0.04)}) },
      { id:'async', name:'Async & Promises', desc:'Handle operations that take time.', baseCost:16, reqLvl:8,
        gen:(lvl)=>({data:(0.6+lvl*0.2), credits:(0.5+lvl*0.15), cpu:(0.15+lvl*0.06)}) },
    ]
  },
  {
    id:'c_lang', name:'C Language', color:'#555555',
    desc:'The foundation. Fast, powerful, close to the machine.',
    nodes:[
      { id:'printf', name:'printf()', desc:'Formatted output to the terminal.', baseCost:3, reqLvl:0,
        gen:(lvl)=>({data:(0.6+lvl*0.2)}) },
      { id:'pointers', name:'Pointers', desc:'Variables that hold memory addresses.', baseCost:6, reqLvl:3,
        gen:(lvl)=>({data:(0.5+lvl*0.18), credits:(0.2+lvl*0.05), cpu:(0.05+lvl*0.02)}) },
      { id:'structs', name:'Structs', desc:'Group related data into custom types.', baseCost:12, reqLvl:5,
        gen:(lvl)=>({data:(0.6+lvl*0.2), credits:(0.3+lvl*0.08), cpu:(0.1+lvl*0.04)}) },
      { id:'memory', name:'Memory Management', desc:'Allocate and free memory manually.', baseCost:24, reqLvl:8,
        gen:(lvl)=>({data:(0.8+lvl*0.25), credits:(0.4+lvl*0.12), cpu:(0.15+lvl*0.06)}) },
    ]
  },
  {
    id:'csharp', name:'C#', color:'#9B4F96',
    desc:'Object-oriented power from Microsoft. Build apps, games, and more.',
    nodes:[
      { id:'writeline', name:'Console.WriteLine()', desc:'Output text in .NET applications.', baseCost:3, reqLvl:0,
        gen:(lvl)=>({data:(0.5+lvl*0.18)}) },
      { id:'classes', name:'Classes & Objects', desc:'Blueprints for creating objects.', baseCost:6, reqLvl:3,
        gen:(lvl)=>({data:(0.4+lvl*0.15), credits:(0.2+lvl*0.06), cpu:(0.05+lvl*0.02)}) },
      { id:'inheritance', name:'Inheritance', desc:'Reuse code by extending classes.', baseCost:12, reqLvl:5,
        gen:(lvl)=>({data:(0.5+lvl*0.18), credits:(0.3+lvl*0.1), cpu:(0.1+lvl*0.04)}) },
      { id:'linq', name:'LINQ', desc:'Query collections with readable syntax.', baseCost:24, reqLvl:8,
        gen:(lvl)=>({data:(0.7+lvl*0.22), credits:(0.5+lvl*0.15), cpu:(0.15+lvl*0.06)}) },
    ]
  },
  {
    id:'go', name:'Go', color:'#00ADD8',
    desc:'Fast, concurrent, and simple. Built for modern cloud apps.',
    nodes:[
      { id:'fmt', name:'fmt.Println()', desc:'Print output in Go programs.', baseCost:3, reqLvl:0,
        gen:(lvl)=>({data:(0.5+lvl*0.2)}) },
      { id:'goroutines', name:'Goroutines', desc:'Run functions concurrently with goroutines.', baseCost:8, reqLvl:3,
        gen:(lvl)=>({data:(0.4+lvl*0.15), credits:(0.2+lvl*0.06), cpu:(0.05+lvl*0.02)}) },
      { id:'interfaces', name:'Interfaces', desc:'Define behavior with method signatures.', baseCost:16, reqLvl:5,
        gen:(lvl)=>({data:(0.5+lvl*0.18), credits:(0.3+lvl*0.1), cpu:(0.1+lvl*0.04)}) },
      { id:'concurrency', name:'Channels', desc:'Communicate between goroutines safely.', baseCost:32, reqLvl:8,
        gen:(lvl)=>({data:(0.7+lvl*0.22), credits:(0.5+lvl*0.14), cpu:(0.15+lvl*0.06)}) },
    ]
  },
  {
    id:'typescript', name:'TypeScript', color:'#3178C6',
    desc:'JavaScript with types. Catch bugs before they happen.',
    nodes:[
      { id:'tsconsole', name:'console.log()', desc:'Log messages in TypeScript.', baseCost:3, reqLvl:0,
        gen:(lvl)=>({data:(0.4+lvl*0.18)}) },
      { id:'tstypes', name:'Type Annotations', desc:'Add type safety to your code.', baseCost:6, reqLvl:3,
        gen:(lvl)=>({data:(0.3+lvl*0.14), credits:(0.2+lvl*0.05), cpu:(0.05+lvl*0.02)}) },
      { id:'tsinterfaces', name:'Interfaces & Types', desc:'Shape your data with custom types.', baseCost:12, reqLvl:5,
        gen:(lvl)=>({data:(0.4+lvl*0.16), credits:(0.3+lvl*0.08), cpu:(0.1+lvl*0.04)}) },
      { id:'generics', name:'Generics', desc:'Write reusable code for any type.', baseCost:24, reqLvl:8,
        gen:(lvl)=>({data:(0.6+lvl*0.2), credits:(0.4+lvl*0.12), cpu:(0.15+lvl*0.06)}) },
    ]
  },
];

const CRAFTS = [
  { id:'simpleScript', name:'Simple Script', desc:'A small program that does one thing well.', result:'program', cost:{data:50,cpu:10} },
  { id:'webPage', name:'Web Page', desc:'A basic HTML page with JavaScript interaction.', result:'hardware', cost:{credits:75,bandwidth:15} },
  { id:'library', name:'Code Library', desc:'Reusable functions for other programs.', result:'exploit', cost:{program:3,hardware:2} },
  { id:'framework', name:'Mini Framework', desc:'A foundation for building many programs.', result:'neuralLinks', cost:{exploit:2,data:500,bandwidth:100} },
  { id:'apiService', name:'API Service', desc:'An API that serves data to other applications.', result:'turboChargers', cost:{exploit:3,hardware:3,credits:200} },
  { id:'database', name:'Database Engine', desc:'Store and query structured data.', result:'qProgram', cost:{program:10,darkMatter:5} },
  { id:'game', name:'Simple Game', desc:'A playable game with graphics and input.', result:'qHardware', cost:{hardware:10,darkMatter:5} },
  { id:'osModule', name:'OS Module', desc:'A low-level system component.', result:'qExploit', cost:{exploit:5,qProgram:3,qHardware:3} },
  { id:'refineShard', name:'Review Code', desc:'Review old code and earn insights.', result:'', cost:{dataShard:10}, refine:(g)=>{ addRes('data',500); toast('Reviewed old code. +500 XP', 'loot'); } },
  { id:'refineFwShard', name:'Optimize Logic', desc:'Optimize logic and earn LOC.', result:'', cost:{fwShard:10}, refine:(g)=>{ addRes('credits',250); toast('Optimized logic. +250 LOC', 'loot'); } },
  { id:'refineIceCore', name:'Refactor Module', desc:'Major refactor yields Mastery.', result:'', cost:{iceCore:5}, refine:(g)=>{ addRes('darkMatter',10); toast('Refactored! +10 Mastery', 'loot'); } },
  { id:'refineAiMod', name:'Code Review', desc:'Peer review session earns KP.', result:'', cost:{aiMod:3}, refine:(g)=>{ G.neuralPoints+=5; toast('Code review: +5 KP', 'loot'); } },
];

const UPGRADES = [
  { id:'xpBoost', name:'Code Editor v{level}', desc:'+20% XP generation speed', cost:{credits:30}, mult:1.8, max:15 },
  { id:'locBoost', name:'Auto-Completion v{level}', desc:'+20% LOC generation speed', cost:{data:40}, mult:1.8, max:15 },
  { id:'kpBoost', name:'Syntax Highlighting v{level}', desc:'+20% KP generation speed', cost:{credits:60,data:30}, mult:1.8, max:15 },
  { id:'insightBoost', name:'AI Assistant v{level}', desc:'+20% Insight generation speed', cost:{credits:80,cpu:20}, mult:1.8, max:15 },
  { id:'xpCap', name:'Knowledge Base v{level}', desc:'2x max XP storage', cost:{credits:1000}, mult:1.3, max:10 },
  { id:'kpCap', name:'Memory Palace v{level}', desc:'2x max KP storage', cost:{data:300}, mult:1.3, max:10 },
  { id:'insightCap', name:'Deep Focus v{level}', desc:'2x max Insight storage', cost:{cpu:100}, mult:1.3, max:10 },
  { id:'debugBoost', name:'Debugger Pro v{level}', desc:'+15% debug efficiency', cost:{credits:100}, mult:1.8, max:15 },
  { id:'locCap', name:'Project Manager v{level}', desc:'2x max LOC storage', cost:{data:200,cpu:50}, mult:1.3, max:10 },
  { id:'masteryCap', name:'Architect Mind v{level}', desc:'2x max Mastery storage', cost:{credits:1500,bandwidth:30}, mult:1.3, max:10 },
];

const DROP_LABELS = { dataShard:'Snippet', fwShard:'Function', iceCore:'Module', aiMod:'Algorithm', encKey:'Pattern', dnToken:'Blueprint', coreFrag:'Core Concept' };
const ITEM_LABELS = { program:'Script', hardware:'Web Page', exploit:'Library', neuralLinks:'Framework', turboChargers:'API', qProgram:'Database', qHardware:'Game', qExploit:'OS Module' };

const ENEMIES = [
  { name:'Syntax Error', hp:50, atk:3, def:1, reward:{credits:10}, lvl:1, drop:'dataShard' },
  { name:'Null Reference', hp:120, atk:6, def:3, reward:{credits:30,darkMatter:1}, lvl:5, drop:'fwShard' },
  { name:'Memory Leak', hp:300, atk:12, def:6, reward:{credits:80,darkMatter:3}, lvl:10, drop:'iceCore' },
  { name:'Race Condition', hp:600, atk:20, def:10, reward:{credits:150,darkMatter:6}, lvl:15, drop:'aiMod' },
  { name:'Infinite Loop', hp:1200, atk:35, def:18, reward:{credits:300,darkMatter:12}, lvl:20, drop:'encKey' },
  { name:'Stack Overflow', hp:2500, atk:55, def:30, reward:{credits:600,darkMatter:25}, lvl:30, drop:'dnToken' },
  { name:'Deadlock', hp:5000, atk:80, def:45, reward:{credits:1200,darkMatter:50}, lvl:40, drop:'coreFrag' },
  { name:'Buffer Overflow', hp:10000, atk:120, def:60, reward:{credits:2500,darkMatter:100}, lvl:50, drop:'coreFrag' },
  { name:'Segmentation Fault', hp:20000, atk:180, def:80, reward:{credits:5000,darkMatter:200}, lvl:60, drop:'coreFrag' },
  { name:'Quantum Bug', hp:50000, atk:300, def:120, reward:{credits:12000,darkMatter:500}, lvl:80, drop:'coreFrag' },
];

const ZONES = [
  { id:'basics', name:'Basic Concepts', desc:'Fundamental programming ideas.', reqDefeated:0, bonuses:{dataMult:1.2}, enemyRange:[0,1] },
  { id:'intermediate', name:'Intermediate', desc:'More complex programming patterns.', reqDefeated:3, bonuses:{creditsMult:1.2}, enemyRange:[1,2] },
  { id:'advanced', name:'Advanced Topics', desc:'Challenging programming concepts.', reqDefeated:6, bonuses:{cpuMult:1.2}, enemyRange:[2,3] },
  { id:'expert', name:'Expert Level', desc:'Master-level programming knowledge.', reqDefeated:10, bonuses:{bwMult:1.2}, enemyRange:[3,5] },
  { id:'architect', name:'Software Architect', desc:'System-level design and architecture.', reqDefeated:15, bonuses:{allMult:1.15}, enemyRange:[5,7] },
];

const ACHIEVEMENTS = [
  { id:'firstXp', name:'First Code', desc:'Earn 1K XP total', check:g=>g.stats.earned.data>=1000, reward:{dataMult:1.05} },
  { id:'xpMiner', name:'Code Explorer', desc:'Earn 100K XP total', check:g=>g.stats.earned.data>=100000, reward:{dataMult:1.1} },
  { id:'locEarner', name:'Line Writer', desc:'Earn 1K LOC total', check:g=>g.stats.earned.credits>=1000, reward:{creditsMult:1.05} },
  { id:'kpCollector', name:'Knowledge Seeker', desc:'Earn 1K KP total', check:g=>g.stats.earned.cpu>=1000, reward:{cpuMult:1.05} },
  { id:'insightExplorer', name:'Insightful', desc:'Earn 1K Insight total', check:g=>g.stats.earned.bandwidth>=1000, reward:{bwMult:1.05} },
  { id:'masteryHacker', name:'Master Coder', desc:'Earn 10 Mastery total', check:g=>g.stats.earned.darkMatter>=10, reward:{dmMult:1.1} },
  { id:'conceptMaster', name:'Concept Collector', desc:'Reach total 50 concept levels', check:g=>{let t=0;Object.values(g.branches).forEach(b=>{Object.values(b).forEach(v=>t+=v)});return t>=50;}, reward:{speedMult:1.05} },
  { id:'polyglot', name:'Polyglot', desc:'Unlock all language concepts', check:g=>{let a=0,t=0;BRANCHES.forEach(b=>{b.nodes.forEach(n=>{t++;if((g.branches[b.id]||{})[n.id]||0>0)a++})});return a>=t;}, reward:{craftSpeed:1.1} },
  { id:'firstDebug', name:'First Fix', desc:'Fix your first bug', check:g=>g.stats.enemiesDefeated>=1, reward:{atkMult:1.1} },
  { id:'bugHunter', name:'Bug Hunter', desc:'Fix 50 bugs', check:g=>g.stats.enemiesDefeated>=50, reward:{atkMult:1.15} },
  { id:'firstMastery', name:'Rewrite', desc:'Mastery for the first time', check:g=>g.prest.times>=1, reward:{prestMult:1.1} },
  { id:'mastery5', name:'Senior Dev', desc:'Rewrite 5 times', check:g=>g.prest.times>=5, reward:{prestMult:1.15} },
  { id:'crafter', name:'Builder', desc:'Build 10 projects', check:g=>g.stats.itemsCrafted>=10, reward:{craftSpeed:1.1} },
  { id:'massCrafter', name:'Architect', desc:'Build 100 projects', check:g=>g.stats.itemsCrafted>=100, reward:{craftSpeed:1.15} },
  { id:'highLoc', name:'Codebase', desc:'Earn 10K LOC total', check:g=>g.stats.earned.credits>=10000, reward:{creditsMult:1.1} },
  { id:'toolCollector', name:'Tool Collector', desc:'Buy 20 tool upgrades total', check:g=>g.upgs.reduce((s,u)=>s+u.lvl,0)>=20, reward:{upgradeMult:1.05} },
  { id:'zoneExplorer', name:'Concept Explorer', desc:'Unlock 3 concept tiers', check:g=>g.zones.filter(z=>z.unlocked).length>=3, reward:{allMult:1.05} },
  { id:'fullMap', name:'Knowledge Master', desc:'Unlock all concept tiers', check:g=>g.zones.every(z=>z.unlocked), reward:{allMult:1.1} },
  { id:'richCoder', name:'Resourceful', desc:'Hold 10K of any resource at once', check:g=>Object.values(g.res).some(v=>v>=10000), reward:{capMult:1.1} },
  { id:'transcend', name:'Enlightenment', desc:'Transcend for the first time', check:g=>g.prest.transcendTimes>=1, reward:{allMult:1.15} },
  { id:'firstProject', name:'First Project', desc:'Complete your first project', check:g=>(g._totalProjectsBuilt||0)>=1, reward:{dataMult:1.05} },
  { id:'projectMaster', name:'Project Lead', desc:'Complete 5 projects', check:g=>(g._totalProjectsBuilt||0)>=5, reward:{creditsMult:1.1} },
  { id:'firstSprint', name:'First Sprint', desc:'Complete your first daily sprint', check:g=>(g._sprintCompleted||0)>=1, reward:{cpuMult:1.05} },
  { id:'sprintMaster', name:'Sprint Champion', desc:'Complete 10 daily sprints', check:g=>(g._sprintCompleted||0)>=10, reward:{allMult:1.1} },
  { id:'firstLibrary', name:'First Library', desc:'Upgrade a code library once', check:g=>Object.values(g._libraries).some(v=>v>=1), reward:{bwMult:1.05} },
  { id:'libMaster', name:'Library Master', desc:'Upgrade any library to level 10', check:g=>Object.values(g._libraries).some(v=>v>=10), reward:{allMult:1.1} },
];

const BURST_EXPLOITS = [
  { id:'quickFix', name:'Quick Fix', desc:'Apply a quick patch for 30 debug damage. Costs 5 XP + 3 KP.', cost:{data:5,cpu:3}, damage:30, reqEnemyLvl:1 },
  { id:'refactor', name:'Refactor', desc:'Restructure code for 80 debug damage. Costs 20 LOC + 10 Insight.', cost:{credits:20,bandwidth:10}, damage:80, reqEnemyLvl:10 },
  { id:'rewrite', name:'Rewrite Module', desc:'Rewrite a module for 200 debug damage. Costs 1 Library + 50 XP.', cost:{exploit:1,data:50}, damage:200, reqEnemyLvl:20 },
  { id:'redesign', name:'Redesign System', desc:'Full system redesign for 500 debug damage. Costs 5 Mastery + 200 KP.', cost:{darkMatter:5,cpu:200}, damage:500, reqEnemyLvl:35 },
];

// ===== SURPRISE: Knowledge Visualizer =====
const VISUALIZER_UNLOCK_THRESHOLD = 12; // Total concept levels to unlock visualizer

const SUBSCRIPTION = {
  price: 1,
  features: {
    noAds: 'Remove all ads',
    offlineProgress: 'Full offline progress (free: 25% rate, 6hr cap)',
    autoDebug: 'Auto-debug mode (free: manual only)',
    autoBuild: 'Auto-build queue (free: manual only)',
    fasterKP: '1.5x Knowledge Point generation rate',
    speedBoost: '1.25x permanent speed boost',
    cloudSave: 'Cloud save support',
    premiumThemes: 'Premium UI themes',
  }
};

const SAVE_VERSION = 9;

// ===== DAILY QUESTS =====
const QUEST_POOL = [
  { id:'qEarnXp', desc:'Earn XP', check:g=>g._questProgress?.data||0, target:5000, rewardNP:5, reward:{data:1000} },
  { id:'qEarnLoc', desc:'Earn LOC', check:g=>g._questProgress?.credits||0, target:2000, rewardNP:5, reward:{credits:500} },
  { id:'qDebug', desc:'Fix bugs', check:g=>g._questProgress?.defeated||0, target:5, rewardNP:5, reward:{darkMatter:2} },
  { id:'qBuild', desc:'Build projects', check:g=>g._questProgress?.crafted||0, target:3, rewardNP:5, reward:{cpu:200} },
  { id:'qLearn', desc:'Learn concepts', check:g=>g._questProgress?.spentNp||0, target:20, rewardNP:5, reward:{bandwidth:100} },
  { id:'qDeepFix', desc:'Use deep fixes', check:g=>g._questProgress?.burst||0, target:3, rewardNP:5, reward:{credits:500} },
  { id:'qMastery', desc:'Earn Mastery', check:g=>g._questProgress?.dmEarned||0, target:10, rewardNP:8, reward:{darkMatter:3} },
];

// ===== TIER BONUSES =====
const TIER_BONUSES = [
  { name:'Beginner', hpMult:1, atkMult:1, defMult:1, rewardMult:1, color:'#0f0' },
  { name:'Intermediate', hpMult:1.5, atkMult:1.3, defMult:1.2, rewardMult:1.5, color:'#ff0' },
  { name:'Expert', hpMult:2.5, atkMult:1.8, defMult:1.5, rewardMult:2.5, color:'#f44' },
];

// ===== CONSUMABLES =====
const CONSUMABLES = [
  { id:'coffee', name:'Coffee Boost', desc:'2x KP generation for 5 minutes', cost:{data:200,credits:100}, duration:300, effect:{npMult:2} },
  { id:'energyDrink', name:'Energy Drink', desc:'+50% debug efficiency for 30 seconds', cost:{exploit:2,cpu:50}, duration:30, effect:{atkMult:1.5} },
  { id:'focusPills', name:'Focus Pills', desc:'+50% code comprehension for 30 seconds', cost:{hardware:2,bandwidth:30}, duration:30, effect:{defMult:1.5} },
  { id:'deepWork', name:'Deep Work Session', desc:'2x all productivity for 2 minutes', cost:{credits:500,data:300}, duration:120, effect:{prodMult:2} },
];

// ===== ENHANCEMENT =====
const ENHANCE_ITEMS = [
  { id:'program', label:'Script', baseBonus:2, bonusLabel:'+2 debug power', maxLvl:10 },
  { id:'hardware', label:'Web Page', baseBonus:3, bonusLabel:'+3 debug defense', maxLvl:10 },
  { id:'exploit', label:'Library', baseBonus:8, bonusLabel:'+8 debug power', maxLvl:10 },
];

function enhanceSuccessRate(lvl) { return Math.max(0.1, 1 - lvl * 0.1); }
function enhanceCost(lvl) { return { data:50*(lvl+1), credits:30*(lvl+1) }; }
const ENEMY_ABILITIES = [
  { id:'fortify', name:'Fortify', desc:'Bug becomes harder to find', hpThreshold:0.5, effect:{defMult:1.5}, duration:8 },
  { id:'regen', name:'Regen', desc:'Bug partially rewrites itself', hpThreshold:0.3, effect:{heal:0.2} },
  { id:'overcharge', name:'Overcharge', desc:'Bug corrupts surrounding code', hpThreshold:0.6, effect:{atkMult:2}, duration:5 },
  { id:'counter', name:'Counter', desc:'Bug throws misleading error', hpThreshold:0.4, effect:{reflect:0.3}, duration:6 },
];
const ENEMY_ABILITY_MAP = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];

// ===== KNOWLEDGE VISUALIZER NODES =====
const VIS_NODE_COLORS = ['#3776AB','#F7DF1E','#555555','#9B4F96','#00ADD8','#3178C6','#0f0','#0ff','#f0f','#ff0','#fff','#f44'];

// ===== PROJECTS (like Idleon construction - build over time for permanent buffs) =====
const PROJECTS = [
  { id:'portfolio', name:'Portfolio Site', desc:'A showcase of your work. +5% XP gen.', kpCost:200, duration:60, bonus:{dataMult:1.05} },
  { id:'github', name:'GitHub Profile', desc:'Share your code with the world. +5% LOC gen.', kpCost:300, duration:80, bonus:{creditsMult:1.05} },
  { id:'docs', name:'Documentation Site', desc:'Write clear docs for others. +5% Insight gen.', kpCost:300, duration:100, bonus:{bwMult:1.05} },
  { id:'cli', name:'CLI Tool', desc:'Build a command-line tool. +10% all gen.', kpCost:500, duration:120, bonus:{allMult:1.1} },
  { id:'webapp', name:'Web Application', desc:'A full web app with backend. +15% XP gen.', kpCost:800, duration:200, bonus:{dataMult:1.15} },
  { id:'mobile', name:'Mobile App', desc:'An app that runs on phones. +15% LOC gen.', kpCost:1000, duration:250, bonus:{creditsMult:1.15} },
  { id:'api', name:'REST API', desc:'An API others can use. +20% Proc gen.', kpCost:1500, duration:350, bonus:{cpuMult:1.2} },
  { id:'engine', name:'Game Engine', desc:'A reusable game engine. +30% all gen.', kpCost:3000, duration:500, bonus:{allMult:1.3} },
];

// ===== SPRINTS (like Idleon post office - deliver specific code for rewards) =====
const SPRINT_POOL = [
  { id:'sprintXp', desc:'Write X pages of documentation', req:{data:2000}, rewardNP:10, reward:{credits:500} },
  { id:'sprintLoc', desc:'Write X lines of production code', req:{credits:1000}, rewardNP:10, reward:{data:2000} },
  { id:'sprintProc', desc:'Refactor X modules for performance', req:{cpu:500}, rewardNP:10, reward:{bandwidth:200} },
  { id:'sprintBw', desc:'Review X lines of peer code', req:{bandwidth:200}, rewardNP:10, reward:{cpu:300} },
  { id:'sprintMastery', desc:'Fix X critical bugs', req:{darkMatter:10}, rewardNP:15, reward:{allMult:1.05} },
];

// ===== LIBRARIES (like Idleon alchemy - level up with resources for permanent bonuses) =====
const LIBRARIES = [
  { id:'stdLib', name:'Standard Library', desc:'+XP generation per level', baseCost:{data:100,credits:50}, mult:1.5, max:20, bonus:(lvl)=>({dataMult:1.05+lvl*0.02}) },
  { id:'packageMgr', name:'Package Manager', desc:'+LOC generation per level', baseCost:{credits:80,cpu:20}, mult:1.5, max:20, bonus:(lvl)=>({creditsMult:1.05+lvl*0.02}) },
  { id:'compiler', name:'Compiler Tools', desc:'+Proc generation per level', baseCost:{data:150,cpu:30}, mult:1.5, max:20, bonus:(lvl)=>({cpuMult:1.05+lvl*0.02}) },
  { id:'debugger', name:'Debugger Suite', desc:'+Insight generation per level', baseCost:{bandwidth:30,credits:100}, mult:1.5, max:20, bonus:(lvl)=>({bwMult:1.05+lvl*0.02}) },
  { id:'profiler', name:'Profiler', desc:'+All generation per level', baseCost:{darkMatter:5,cpu:100}, mult:1.8, max:10, bonus:(lvl)=>({allMult:1.05+lvl*0.03}) },
];

// ===== SPECIALIZATIONS (choose a dev path that changes playstyle) =====
const SPECIALIZATIONS = [
  { id:'frontend', name:'Frontend Dev', desc:'Build beautiful UIs. +20% XP gen, +10% debug power.', bonus:{dataMult:1.2, atkMult:1.1} },
  { id:'backend', name:'Backend Dev', desc:'Build server-side systems. +20% LOC gen, +15% max HP.', bonus:{creditsMult:1.2, hpMult:1.15} },
  { id:'systems', name:'Systems Dev', desc:'Low-level programming. +20% Proc gen, +10% debug defense.', bonus:{cpuMult:1.2, defMult:1.1} },
  { id:'data', name:'Data Scientist', desc:'Analyze data and build models. +20% Insight gen, +15% KP rate.', bonus:{bwMult:1.2, npRate:1.15} },
];
