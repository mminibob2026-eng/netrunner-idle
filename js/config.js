const SKILLS = [
  { id:'dataMining', name:'Data Mining', res:'data', yield:1, time:1, xp:10, desc:'Extract raw data from network nodes.', cost:null, costLabel:'', req:null },
  { id:'packetSniffing', name:'Packet Sniffing', res:'credits', yield:0.8, time:1.2, xp:12, desc:'Intercept traffic for credits.', cost:{data:50}, costLabel:'50 DATA', req:null },
  { id:'cryptoMining', name:'Crypto Mining', res:'cpu', yield:0.5, time:1.5, xp:15, desc:'Mine cryptocurrency for CPU cores.', cost:{credits:100}, costLabel:'100 CREDITS', req:null },
  { id:'networkScouting', name:'Network Scouting', res:'bandwidth', yield:0.3, time:2, xp:18, desc:'Map the network for bandwidth.', cost:{data:100,cpu:25}, costLabel:'100 DATA, 25 CPU', req:null },
  { id:'codeDecompile', name:'Code Decompile', res:'darkMatter', yield:0.04, time:2.5, xp:25, desc:'Reverse-engineer code into Dark Matter.', cost:{credits:500,cpu:200}, costLabel:'500 CREDITS, 200 CPU', req:{dataMining:10,packetSniffing:10}, reqLabel:'Data Mining Lv.10, Packet Sniffing Lv.10' },
  { id:'networkSynthesis', name:'Network Synthesis', res:'all', yield:0, time:3, xp:35, desc:'Synthesize all network resources at once.', cost:{data:800,credits:800,cpu:400,bandwidth:200}, costLabel:'800 DATA, 800 CREDITS, 400 CPU, 200 BW', req:{dataMining:15,packetSniffing:15,cryptoMining:15,networkScouting:15}, reqLabel:'All skills Lv.15' },
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
];

const UPGRADES = [
  { id:'miningSpeed', name:'Data Miner v{level}', desc:'+20% data mining speed', cost:{credits:30}, mult:1.8, max:15 },
  { id:'sniffingSpeed', name:'Packet Sniffer v{level}', desc:'+20% packet sniffing speed', cost:{data:40}, mult:1.8, max:15 },
  { id:'cryptoSpeed', name:'Crypto Miner v{level}', desc:'+20% crypto mining speed', cost:{credits:60,data:30}, mult:1.8, max:15 },
  { id:'scoutSpeed', name:'Network Scout v{level}', desc:'+20% network scouting speed', cost:{credits:80,cpu:20}, mult:1.8, max:15 },
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
  { id:'skillMaster', name:'Skill Master', desc:'Reach skill level 25 in any skill', check:g=>g.skills.some(s=>s.lvl>=25), reward:{speedMult:1.05} },
  { id:'jackOfAll', name:'Jack of All Trades', desc:'Unlock all skills', check:g=>g.skills.every(s=>s.unlocked), reward:{craftSpeed:1.1} },
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

const SPECIALIZATIONS = [
  // Data Mining
  { id:'deepExtraction', skillId:'dataMining', name:'Deep Extraction', desc:'+30% DATA yield', reqLvl:10, cost:{credits:200}, effect:{dataMiningMult:1.3} },
  { id:'parallelProc', skillId:'dataMining', name:'Parallel Processing', desc:'+50% DATA yield', reqLvl:25, cost:{credits:2000,cpu:100}, effect:{dataMiningMult:1.5} },
  // Packet Sniffing
  { id:'trafficAnalysis', skillId:'packetSniffing', name:'Traffic Analysis', desc:'+30% CREDITS yield', reqLvl:10, cost:{data:200}, effect:{packetSniffingMult:1.3} },
  { id:'darkProtocol', skillId:'packetSniffing', name:'Dark Protocol', desc:'+50% CREDITS yield', reqLvl:25, cost:{data:2000,bandwidth:50}, effect:{packetSniffingMult:1.5} },
  // Crypto Mining
  { id:'hashOptimize', skillId:'cryptoMining', name:'Hash Optimization', desc:'+30% CPU yield', reqLvl:10, cost:{credits:300}, effect:{cryptoMiningMult:1.3} },
  { id:'quantumCore', skillId:'cryptoMining', name:'Quantum Core', desc:'All skills 15% faster', reqLvl:25, cost:{credits:3000,darkMatter:5}, effect:{globalSpeed:0.85} },
  // Network Scouting
  { id:'routeOptimize', skillId:'networkScouting', name:'Route Optimization', desc:'+30% BANDWIDTH yield', reqLvl:10, cost:{data:300,cpu:50}, effect:{networkScoutingMult:1.3} },
  { id:'meshNetwork', skillId:'networkScouting', name:'Mesh Network', desc:'+20% all resource caps', reqLvl:25, cost:{data:3000,credits:1000}, effect:{capMult:1.2} },
  // Code Decompile
  { id:'deepReverse', skillId:'codeDecompile', name:'Deep Reverse', desc:'+40% DARK MATTER yield', reqLvl:15, cost:{credits:1000,cpu:200}, effect:{codeDecompileMult:1.4} },
  { id:'sourceAccess', skillId:'codeDecompile', name:'Source Access', desc:'+5% all resource production', reqLvl:35, cost:{credits:5000,darkMatter:20}, effect:{allProdMult:1.05} },
  // Network Synthesis
  { id:'efficientSynth', skillId:'networkSynthesis', name:'Efficient Synth', desc:'+30% all synthesis output', reqLvl:15, cost:{data:2000,credits:2000,cpu:1000,bandwidth:500}, effect:{synthMult:1.3} },
  { id:'fullIntegration', skillId:'networkSynthesis', name:'Full Integration', desc:'Synthesis also produces Dark Matter', reqLvl:30, cost:{data:5000,credits:5000,cpu:2500,bandwidth:1000,darkMatter:50}, effect:{synthDM:true} },
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
    multiSkill: 'Up to 4 active skills (free: 2 max)',
    speedBoost: '1.25x permanent speed boost',
    cloudSave: 'Cloud save support',
    premiumThemes: 'Premium UI themes',
  }
};

const SAVE_VERSION = 5;
