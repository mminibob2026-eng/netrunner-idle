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
  if (G.neuralPoints < cost) { toast('Need ' + cost + ' KP', 'error'); return; }
  G.neuralPoints -= cost;
  G.branches[branchId][nodeId] = (G.branches[branchId][nodeId] || 0) + 1;
  trackQuestProgress('spentNp', cost);
    toast(n.name + ' Lv.' + G.branches[branchId][nodeId] + ' learned!', 'loot');
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
  if (c.refine) {
    c.refine(G);
  } else {
    G.inv[c.result] = (G.inv[c.result]||0) + 1;
    G.stats.itemsCrafted = (G.stats.itemsCrafted||0) + 1;
    G.neuralPoints += 2;
    trackQuestProgress('crafted', 1);
    toast('Built '+c.name+' +2 KP', 'loot');
  }
  checkAchievements();
}

// Combat
function combatEngage(idx) {
  if (!G.cmbt.unlocked) return;
  if (G.cmbt.inCombat && G.cmbt.idx === idx) return;
  G.cmbt.inCombat = true;
  G.cmbt.idx = idx;
  G.cmbt.mxhp = 100 + branchHpBonus();
  G.cmbt._bonus = 0;
  const zoneId = getZoneIdForEnemy(idx);
  const tier = getZoneTier(zoneId);
  const e = ENEMIES[idx];
  const tm = applyTierMods(zoneId, e);
  G.cmbt.hp = tm.hp;
  G.cmbt._tierDrops = tier > 0;
  if (G.cmbt.php <= 0 || G.cmbt.php > G.cmbt.mxhp) G.cmbt.php = G.cmbt.mxhp;
  const burst = branchBurstDmg();
  if (burst > 0) { G.cmbt.hp -= burst; logCombat('Architecture insight: +' + burst + ' opening debug damage!'); }
  G.cmbt.log = [];
  logCombat('Engaged '+e.name+' [Lv.'+e.lvl+'] ' + TIER_BONUSES[tier].name);
  toast('Debugging '+e.name+'!', 'info');
  if (G.cmbt.hp <= 0) combatWin();
}
function getZoneIdForEnemy(idx) {
  for (let z = ZONES.length - 1; z >= 0; z--) {
    if (ZONES[z].enemies && ZONES[z].enemies.includes(idx)) return ZONES[z].id;
  }
  return ZONES[0]?.id || 'perimeter';
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
  logCombat('DEBUG: -'+de+' HP to '+e.name + (dp>0?' | Caught: -'+dp+' HP':' | Clean fix'));
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
    logCombat('Script deployed: +5 debug power');
    toast('Script deployed!', 'loot');
  } else if (type === 'hardware') {
    G.cmbt.php = Math.min(G.cmbt.mxhp, G.cmbt.php + 20);
    logCombat('Web Page deployed: +20 focus restored');
    toast('Web Page deployed!', 'loot');
  } else if (type === 'exploit') {
    G.cmbt.hp -= 15;
    logCombat('Library deployed: -15 HP to bug');
    toast('Library deployed!', 'loot');
    if (G.cmbt.hp <= 0) combatWin();
  }
}

function combatDisconnect() {
  if (!G.cmbt.inCombat) return;
  G.cmbt.inCombat = false;
  G.cmbt._bonus = 0;
  logCombat('Back to coding...');
  G.cmbt.log = [];
  toast('Back safe', 'info');
}

function combatWin() {
  const e = ENEMIES[G.cmbt.idx];
  const zoneId = getZoneIdForEnemy(G.cmbt.idx);
  const tm = applyTierMods(zoneId, e);
  Object.entries(tm.reward).forEach(([r,a])=>{ addRes(r,a); if(r==='darkMatter') G.prest.dm+=a; });
  if (e.drop && Math.random() < (G.cmbt._tierDrops ? 0.5 : 0.3)) {
    G.inv[e.drop] = (G.inv[e.drop]||0) + 1;
    logCombat('DROP: '+DROP_LABELS[e.drop]);
  }
  G.stats.enemiesDefeated = (G.stats.enemiesDefeated||0) + 1;
  G.neuralPoints += 1;
  trackEvent('enemy_defeated', { enemy: e.name, lvl: e.lvl });
  trackQuestProgress('defeated', 1);
  let totalDm = 0;
  Object.entries(tm.reward).forEach(([r,a]) => { if (r==='darkMatter') totalDm += a; });
  if (totalDm > 0) trackQuestProgress('dmEarned', totalDm);
  logCombat('FIXED '+e.name+'! Rewards: '+Object.entries(tm.reward).map(([r,a])=>fmt(a)+' '+(RES[r]?RES[r].n:r)).join(', ')+' +1 KP');
  toast(e.name+' fixed!', 'loot');
  G.cmbt.hp = ENEMIES[G.cmbt.idx].hp;
  G.cmbt._bonus = 0;
  G.cmbt._tierDrops = false;
  G._pendingMiniGameEvent = true;
  checkZoneProgress();
  checkAchievements();
}

function combatLose() {
  logCombat('Code crashed! Bailing out...');
  toast('Defeated!', 'error');
  G.cmbt.mxhp = 100 + branchHpBonus();
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
  if (!confirm('Mastery reset will reset all progress except zones, achievements, and KP multiplier.\nGain ' + g + ' mastery level' + (g > 1 ? 's' : '') + '. Continue?')) return;
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
  save(); toast('Mastery Reset! Level '+G.prest.lvl, 'loot');
  rebuildUI();
  checkAchievements();
}

function doTranscend() {
  if (!canTranscend()) { toast('Need more prestige levels to transcend', 'error'); return; }
  const cost = transcendCost();
  if (!confirm('Enlighten will reset all progress (including mastery) except zones and achievements.\nCost: ' + cost + ' mastery levels for 1 enlighten level (2x multiplier). Continue?')) return;
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
  save(); toast('Enlighten! Level '+G.prest.transcendLvl, 'loot');
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
      toast('Concept tier unlocked: '+z.name+'!', 'loot');
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
      toast('Achievement: '+a.name+'! +5 KP', 'loot');
    }
  });
}

// Combat burst items
function combatBurst(id) {
  if (!G.cmbt.inCombat) { toast('Not debugging', 'error'); return; }
  const cfg = BURST_EXPLOITS.find(b => b.id === id);
  if (!cfg) return;
  const enemy = ENEMIES[G.cmbt.idx];
  if (enemy.lvl < cfg.reqEnemyLvl) { toast('Enemy too weak for this', 'info'); return; }
  if (!canPay(cfg.cost)) { toast('Cannot afford', 'error'); return; }
  pay(cfg.cost);
  G.cmbt.hp -= cfg.damage;
  trackQuestProgress('burst', 1);
  logCombat('DEEP FIX: '+cfg.name+' dealt '+cfg.damage+' damage!');
  toast(cfg.name+' deployed!', 'loot');
  if (G.cmbt.hp <= 0) combatWin();
}

// Dev
function isDev() { return USER.toLowerCase() === 'dev'; }
function devAddRes(id, amt) { addRes(id, amt); toast('Added '+fmt(amt)+' '+(RES[id]?RES[id].n:id), 'loot'); }
function devMaxBranch() { BRANCHES.forEach(b => { b.nodes.forEach(n => { G.branches[b.id][n.id] = 30; }); }); toast('Languages maxed', 'loot'); rebuildUI(); }
function devUnlockAll() { BRANCHES.forEach(b => { b.nodes.forEach(n => { G.branches[b.id][n.id] = Math.max(G.branches[b.id][n.id]||0, 1); }); }); G.cmbt.unlocked=true; G.zones.forEach(z=>{z.unlocked=true;}); G.neuralPoints += 1000; toast('All unlocked +1000 KP', 'loot'); rebuildUI(); }
function devAddNp(amt) { G.neuralPoints += amt; toast('+'+amt+' KP', 'loot'); }

// Auto-combat
function combatAutoAttack() {
  if (!G.cmbt.inCombat) return;
  if (!isSubActive()) return;
  combatAttack();
}

// ===== DAILY QUESTS =====
function refreshQuests() {
  const today = new Date().toDateString();
  if (G._questDate === today && G._quests.length > 0) return;
  G._questDate = today;
  G._questProgress = {};
  G._questCompleted = [];
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  G._quests = shuffled.slice(0, 3);
}
function getActiveQuests() {
  refreshQuests();
  return G._quests;
}
function trackQuestProgress(key, amt) {
  if (!G._questProgress) G._questProgress = {};
  G._questProgress[key] = (G._questProgress[key] || 0) + amt;
  G._quests.forEach((q, i) => {
    if (G._questCompleted.includes(i)) return;
    if (q.check(G) >= q.target) {
      G._questCompleted.push(i);
      G.neuralPoints += q.rewardNP;
      Object.entries(q.reward).forEach(([r, a]) => addRes(r, a));
      toast('Quest complete: ' + q.desc + '! +' + q.rewardNP + ' KP', 'loot');
      G._questWeekly = (G._questWeekly || 0) + 1;
      const weekStart = getWeekStart();
      if (G._questWeeklyDate !== weekStart) { G._questWeekly = 1; G._questWeeklyDate = weekStart; }
      if (G._questWeekly >= 3) {
        addRes('darkMatter', 5);
        G._questWeekly = 0;
        toast('Weekly challenge bonus: +5 Mastery!', 'loot');
      }
    }
  });
}
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toDateString();
}

// ===== TIERED ZONES =====
function getZoneTier(zoneId) {
  return G._zoneTiers[zoneId] || 0;
}
function setZoneTier(zoneId, tier) {
  G._zoneTiers[zoneId] = Math.min(tier, TIER_BONUSES.length - 1);
}
function applyTierMods(zoneId, baseEnemy) {
  const t = getZoneTier(zoneId);
  const tb = TIER_BONUSES[t];
  const tierScale = 1 + t * 0.5;
  return {
    hp: Math.floor(baseEnemy.hp * tb.hpMult * tierScale),
    atk: Math.floor(baseEnemy.atk * tb.atkMult * tierScale),
    def: Math.floor(baseEnemy.def * tb.defMult * tierScale),
    reward: Object.fromEntries(Object.entries(baseEnemy.reward).map(([r, a]) => [r, Math.floor(a * tb.rewardMult * tierScale)])),
  };
}

// ===== CONSUMABLES =====
function craftConsumable(id) {
  const c = CONSUMABLES.find(x => x.id === id);
  if (!c) return;
  if (!canPay(c.cost)) { toast('Not enough resources', 'error'); return; }
  pay(c.cost);
  G._consumables[id] = Date.now() + c.duration * 1000;
  toast('Crafted ' + c.name, 'loot');
}
function getActiveConsumables() {
  const now = Date.now();
  const active = {};
  Object.entries(G._consumables).forEach(([id, expires]) => {
    if (expires > now) active[id] = expires;
    else delete G._consumables[id];
  });
  return active;
}
function hasConsumableEffect(id) {
  const expires = G._consumables[id];
  return expires && expires > Date.now();
}
function getProdMult() {
  return hasConsumableEffect('deepWork') ? (CONSUMABLES.find(c=>c.id==='deepWork').effect.prodMult) : 1;
}
function getNpMult() {
  return hasConsumableEffect('coffee') ? (CONSUMABLES.find(c=>c.id==='coffee').effect.npMult) : 1;
}
function getAtkMult() {
  return hasConsumableEffect('energyDrink') ? (CONSUMABLES.find(c=>c.id==='energyDrink').effect.atkMult) : 1;
}
function getDefMult() {
  return hasConsumableEffect('focusPills') ? (CONSUMABLES.find(c=>c.id==='focusPills').effect.defMult) : 1;
}

// ===== ENHANCEMENT =====
function enhanceItem(id) {
  const cfg = ENHANCE_ITEMS.find(x => x.id === id);
  if (!cfg) return;
  const lvl = G._enhance[id] || 0;
  if (lvl >= cfg.maxLvl) { toast('Max level', 'info'); return; }
  if ((G.inv[id] || 0) < 1) { toast('Need one ' + cfg.label + ' to enhance', 'error'); return; }
  const cost = enhanceCost(lvl);
  if (!canPay(cost)) { toast('Not enough resources', 'error'); return; }
  const rate = enhanceSuccessRate(lvl);
  G.inv[id]--;
  pay(cost);
  if (Math.random() < rate) {
    G._enhance[id] = lvl + 1;
    toast('Enhance success! ' + cfg.label + ' Lv.' + (lvl + 1), 'loot');
  } else {
    toast('Enhance failed. ' + cfg.label + ' consumed.', 'error');
  }
}
function getEnhanceBonus(id) {
  const cfg = ENHANCE_ITEMS.find(x => x.id === id);
  if (!cfg) return 0;
  return (G._enhance[id] || 0) * cfg.baseBonus;
}

// ===== ENEMY ABILITIES =====
function procEnemyAbility() {
  if (!G.cmbt.inCombat) return;
  const eIdx = G.cmbt.idx;
  const ai = ENEMY_ABILITY_MAP[eIdx % ENEMY_ABILITY_MAP.length];
  const ab = ENEMY_ABILITIES[ai];
  const hpPct = G.cmbt.hp / ENEMIES[eIdx].hp;
  if (hpPct > ab.hpThreshold || hpPct <= 0) return;
  const now = Date.now();
  if (G._enemyAbilityCd > now) return;
  G._enemyAbilityCd = now + 10000;
  if (ab.effect.heal) {
    G.cmbt.hp = Math.min(ENEMIES[eIdx].hp, G.cmbt.hp + Math.floor(ENEMIES[eIdx].hp * ab.effect.heal));
    logCombat('BUG: ' + ab.name + ' - ' + ab.desc);
  } else if (ab.effect.atkMult) {
    const dmg = Math.floor(ENEMIES[eIdx].atk * (ab.effect.atkMult - 1));
    G.cmbt.php -= dmg;
    logCombat('BUG: ' + ab.name + ' - ' + ab.desc + ' -' + dmg + ' HP');
    if (G.cmbt.php <= 0) combatLose();
  } else if (ab.effect.reflect) {
    const reflectDmg = Math.floor((ENEMIES[eIdx].hp - G.cmbt.hp) * ab.effect.reflect);
    G.cmbt.php -= reflectDmg;
    logCombat('BUG: ' + ab.name + ' reflects ' + reflectDmg + ' damage');
    if (G.cmbt.php <= 0) combatLose();
  }
}
