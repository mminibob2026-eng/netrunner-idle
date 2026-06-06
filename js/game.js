function clickBranchNode(branchId, nodeId) {
  const b = branchCfg(branchId);
  if (!b) return;
  const n = branchNodeCfg(branchId, nodeId);
  if (!n) return;
  if (!branchNodeUnlocked(branchId, nodeId)) {
    const req = nodeRequirement(branchId, nodeId);
    toast('Need ' + req.node + ' Lv.' + req.level, 'error');
    return;
  }
  const cost = branchCost(branchId, nodeId);
  if (G.neuralPoints < cost) { toast('Need ' + cost + ' NP', 'error'); return; }
  G.neuralPoints -= cost;
  G.branches[branchId][nodeId] = (G.branches[branchId][nodeId] || 0) + 1;
  toast(n.name + ' Lv.' + G.branches[branchId][nodeId], 'loot');
  checkAchievements();
}

function clickUpgrade(id) {
  const u = upgSt(id), c = upgCfg(id);
  if (!u||!c||u.lvl>=c.max) return;
  const cost = {};
  const cr = branchCostRed();
  Object.entries(c.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*(1-cr)*Math.pow(c.mult, u.lvl)); });
  if (!canPay(cost)) { toast('Cannot afford', 'error'); return; }
  pay(cost); u.lvl++;
  toast(c.name.replace('{level}',u.lvl)+' bought', 'loot');
  checkAchievements();
}

function clickCraft(id) {
  const c = CRAFTS.find(x=>x.id===id); if (!c) return;
  const cr = branchCostRed();
  const cost = {};
  Object.entries(c.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*(1-cr)); });
  if (!canPay(cost)) { toast('Not enough resources', 'error'); return; }
  pay(cost);
  G.inv[c.result] = (G.inv[c.result]||0) + 1;
  G.stats.itemsCrafted = (G.stats.itemsCrafted||0) + 1;
  G.neuralPoints += 2;
  toast('Crafted '+c.name+' +2 NP', 'loot');
  checkAchievements();
}

// Combat
function combatEngage(idx) {
  if (!G.cmbt.unlocked) return;
  if (G.cmbt.inCombat && G.cmbt.idx === idx) return;
  G.cmbt.inCombat = true;
  G.cmbt.idx = idx;
  G.cmbt.hp = ENEMIES[idx].hp;
  G.cmbt._bonus = 0;
  if (G.cmbt.php <= 0) G.cmbt.php = G.cmbt.mxhp;
  const burst = branchBurstDmg();
  if (burst > 0) { G.cmbt.hp -= burst; logCombat('System Breach: +' + burst + ' opening damage!'); }
  G.cmbt.log = [];
  logCombat('Engaged '+ENEMIES[idx].name+' [Lv.'+ENEMIES[idx].lvl+']');
  toast('Hacking '+ENEMIES[idx].name+'!', 'info');
  if (G.cmbt.hp <= 0) combatWin();
}

function combatAttack() {
  if (!G.cmbt.inCombat) return;
  const ed = document.getElementById('enemy-display');
  if (ed) { ed.classList.remove('shake'); void ed.offsetWidth; ed.classList.add('shake'); }
  const e = ENEMIES[G.cmbt.idx];
  const { a, d } = cmbtPow();
  const bonus = G.cmbt._bonus || 0;
  const de = Math.max(1, a - e.def + Math.floor(Math.random()*5) + bonus);
  const dp = Math.max(0, e.atk - d + Math.floor(Math.random()*3));
  G.cmbt.hp -= de;
  if (bonus > 0) { G.cmbt._bonus = 0; logCombat('Bonus applied! +'+bonus+' damage'); }
  G.cmbt.php -= dp;
  logCombat('HACK: -'+de+' HP to '+e.name + (dp>0?' | Counter: -'+dp+' HP':' | No counter'));
  if (G.cmbt.hp <= 0) combatWin();
  if (G.cmbt.php <= 0) combatLose();
}

function combatUseItem(type) {
  if (!G.cmbt.inCombat) return;
  const count = G.inv[type] || 0;
  if (count < 1) { toast('No '+type+' available', 'error'); return; }
  G.inv[type]--;
  if (type === 'program') {
    G.cmbt._bonus = (G.cmbt._bonus||0) + 5;
    logCombat('Program deployed: +5 ATK bonus');
    toast('Program deployed!', 'loot');
  } else if (type === 'hardware') {
    G.cmbt.php = Math.min(G.cmbt.mxhp, G.cmbt.php + 20);
    logCombat('Hardware deployed: +20 HP restored');
    toast('Hardware deployed!', 'loot');
  } else if (type === 'exploit') {
    G.cmbt.hp -= 15;
    logCombat('Exploit deployed: -15 HP to target');
    toast('Exploit deployed!', 'loot');
    if (G.cmbt.hp <= 0) combatWin();
  }
}

function combatDisconnect() {
  if (!G.cmbt.inCombat) return;
  G.cmbt.inCombat = false;
  G.cmbt._bonus = 0;
  logCombat('Disconnected. Skills resumed.');
  G.cmbt.log = [];
  toast('Disconnected', 'info');
}

function combatWin() {
  const e = ENEMIES[G.cmbt.idx];
  Object.entries(e.reward).forEach(([r,a])=>{ addRes(r,a); if(r==='darkMatter') G.prest.dm+=a; });
  if (e.drop && Math.random() < 0.3) {
    G.inv[e.drop] = (G.inv[e.drop]||0) + 1;
    logCombat('DROP: '+DROP_LABELS[e.drop]);
  }
  G.stats.enemiesDefeated = (G.stats.enemiesDefeated||0) + 1;
  G.neuralPoints += 1;
  trackEvent('enemy_defeated', { enemy: e.name, lvl: e.lvl });
  logCombat('BREACHED '+e.name+'! Rewards: '+Object.entries(e.reward).map(([r,a])=>fmt(a)+' '+r).join(', ')+' +1 NP');
  toast(e.name+' breached!', 'loot');
  G.cmbt.hp = e.hp;
  G.cmbt._bonus = 0;
  checkZoneProgress();
  checkAchievements();
}

function combatLose() {
  logCombat('System crash! Disconnecting...');
  toast('Defeated!', 'error');
  G.cmbt.php = G.cmbt.mxhp;
  G.cmbt.inCombat = false;
  G.cmbt._bonus = 0;
  G.cmbt.log = [];
}

function logCombat(msg) {
  G.cmbt.log.push(msg);
  if (G.cmbt.log.length > 50) G.cmbt.log.shift();
}

// Prestige
function doPrestige() {
  const g = prestigeGain();
  if (g < 1) { toast('Need more Dark Matter', 'error'); return; }
  G.prest.lvl += g; G.prest.times++;
  G.stats.totalPrestige += g;
  const pw = G._pw;
  const sub = G._subActive;
  const keep = {
    prest: G.prest, stats: G.stats,
    zones: G.zones, achievements: G.achievements,
    _pw: pw, _subActive: sub,
    ver: SAVE_VERSION,
  };
  G = Object.assign(freshState(), keep);
  G.cmbt.hp = ENEMIES[0].hp;
  trackEvent('prestige', { level: G.prest.lvl, total: G.prest.times });
  save(); toast('Prestige! Level '+G.prest.lvl, 'loot');
  rebuildUI();
  checkAchievements();
}

function doTranscend() {
  if (!canTranscend()) { toast('Need more prestige levels to transcend', 'error'); return; }
  const cost = transcendCost();
  G.prest.transcendLvl += cost;
  G.prest.transcendTimes++;
  G.prest.lvl = 0;
  const pw = G._pw;
  const sub = G._subActive;
  const keep = {
    prest: G.prest, stats: G.stats,
    zones: G.zones, achievements: G.achievements,
    _pw: pw, _subActive: sub,
    ver: SAVE_VERSION,
  };
  G = Object.assign(freshState(), keep);
  G.cmbt.hp = ENEMIES[0].hp;
  save(); toast('Transcend! Level '+G.prest.transcendLvl, 'loot');
  rebuildUI();
  checkAchievements();
}

// Zone progression
function checkZoneProgress() {
  const totalDefeated = G.stats.enemiesDefeated || 0;
  ZONES.forEach((z, zi) => {
    const zs = G.zones[zi];
    if (zs.unlocked) return;
    if (z.reqDefeated === 0) { zs.unlocked = true; return; }
    if (totalDefeated >= z.reqDefeated) {
      zs.unlocked = true;
      toast('Zone unlocked: '+z.name+'!', 'loot');
    }
  });
}

// Achievements
function checkAchievements() {
  if (!G || !G.achievements) return;
  ACHIEVEMENTS.forEach((a, i) => {
    const as = G.achievements[i];
    if (as.unlocked) return;
    if (a.check(G)) {
      as.unlocked = true;
      G.neuralPoints += 5;
      toast('Achievement: '+a.name+'! +5 NP', 'loot');
    }
  });
}

// Combat burst items
function combatBurst(id) {
  if (!G.cmbt.inCombat) { toast('Not in combat', 'error'); return; }
  const cfg = BURST_EXPLOITS.find(b => b.id === id);
  if (!cfg) return;
  const enemy = ENEMIES[G.cmbt.idx];
  if (enemy.lvl < cfg.reqEnemyLvl) { toast('Enemy too weak for this', 'info'); return; }
  if (!canPay(cfg.cost)) { toast('Cannot afford', 'error'); return; }
  pay(cfg.cost);
  G.cmbt.hp -= cfg.damage;
  logCombat('BURST: '+cfg.name+' dealt '+cfg.damage+' damage!');
  toast(cfg.name+' deployed!', 'loot');
  if (G.cmbt.hp <= 0) combatWin();
}

// Dev
function isDev() { return USER.toLowerCase() === 'dev'; }
function devAddRes(id, amt) { addRes(id, amt); toast('Added '+fmt(amt)+' '+id, 'loot'); }
function devMaxBranch() { BRANCHES.forEach(b => { b.nodes.forEach(n => { G.branches[b.id][n.id] = 30; }); }); toast('Branches maxed', 'loot'); rebuildUI(); }
function devUnlockAll() { BRANCHES.forEach(b => { b.nodes.forEach(n => { G.branches[b.id][n.id] = Math.max(G.branches[b.id][n.id]||0, 1); }); }); G.cmbt.unlocked=true; G.zones.forEach(z=>{z.unlocked=true;}); G.neuralPoints += 1000; toast('All unlocked +1000 NP', 'loot'); rebuildUI(); }
function devSpeed(v) { G._speed=v||1; toast('Speed x'+(v||1), 'info'); }
function devAddNp(amt) { G.neuralPoints += amt; toast('+'+amt+' NP', 'loot'); }

// Auto-combat
function combatAutoAttack() {
  if (!G.cmbt.inCombat) return;
  if (!isSubActive()) return;
  combatAttack();
}

// Mini-game event check
function checkMiniGameEvent() {
  const elapsed = Date.now() - G._lastMiniGameEvent;
  const dayMs = 24 * 60 * 60 * 1000;
  if (elapsed < dayMs) return;
  if (document.getElementById('minigame-event-modal')?.classList.contains('visible')) return;
  if (Math.random() < 0.03) launchMiniGameEvent();
}
