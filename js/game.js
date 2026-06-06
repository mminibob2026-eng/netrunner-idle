function clickSkill(id) {
  const s = skillSt(id); if (!s) return;
  if (G.cmbt.inCombat) combatDisconnect();
  if (!s.unlocked) {
    const c = skillCfg(id);
    if (!c || !c.cost) return;
    if (c.req) {
      for (const [reqId, reqLvl] of Object.entries(c.req)) {
        const rs = skillSt(reqId);
        if (!rs || rs.lvl < reqLvl) { toast('Need '+c.reqLabel, 'error'); return; }
      }
    }
    if (!canPay(c.cost)) { toast('Need '+c.costLabel, 'error'); return; }
    pay(c.cost); s.unlocked = true; s.active = true;
    toast(c.name+' unlocked!', 'loot');
    checkAchievements();
    return;
  }
  if (!s.active && G.skills.filter(x => x.active).length >= maxActiveSkills()) {
    toast('Max active skills reached. Upgrade subscription for more.', 'error');
    return;
  }
  s.active = !s.active;
  if (s.active) toast(skillCfg(id).name+' started', 'info');
}

function clickUpgrade(id) {
  const u = upgSt(id), c = upgCfg(id);
  if (!u||!c||u.lvl>=c.max) return;
  const cost = {};
  Object.entries(c.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*Math.pow(c.mult, u.lvl)); });
  if (!canPay(cost)) { toast('Cannot afford', 'error'); return; }
  pay(cost); u.lvl++;
  toast(c.name.replace('{level}',u.lvl)+' bought', 'loot');
  checkAchievements();
}

function clickCraft(id) {
  const c = CRAFTS.find(x=>x.id===id); if (!c) return;
  if (!canPay(c.cost)) { toast('Not enough resources', 'error'); return; }
  pay(c.cost);
  G.inv[c.result] = (G.inv[c.result]||0) + 1;
  G.stats.itemsCrafted = (G.stats.itemsCrafted||0) + 1;
  G.skills.forEach(s => {
    if (!s.unlocked) return;
    const xp = 5 + Math.floor(s.lvl*0.5);
    s.xp += xp;
    const req = xpReq(s.lvl);
    while (s.xp >= req && s.lvl < 99) { s.xp -= req; s.lvl++; }
  });
  toast('Crafted '+c.name, 'loot');
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
  G.cmbt.log = [];
  logCombat('Engaged '+ENEMIES[idx].name+' [Lv.'+ENEMIES[idx].lvl+']');
  toast('Hacking '+ENEMIES[idx].name+'!', 'info');
}

function combatAttack() {
  if (!G.cmbt.inCombat) return;
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
  logCombat('BREACHED '+e.name+'! Rewards: '+Object.entries(e.reward).map(([r,a])=>fmt(a)+' '+r).join(', '));
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
  save(); toast('Prestige! Level '+G.prest.lvl, 'loot');
  rebuildUI();
  const dm = G.skills[0];
  if (dm && !dm.active) { dm.active = true; }
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
  const dm = G.skills[0];
  if (dm && !dm.active) { dm.active = true; }
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
      toast('Achievement: '+a.name+'!', 'loot');
    }
  });
}

// Dev
function isDev() { return USER.toLowerCase() === 'dev'; }
function devAddRes(id, amt) { addRes(id, amt); toast('Added '+fmt(amt)+' '+id, 'loot'); }
function devMaxSkills() { G.skills.forEach(s=>{s.lvl=50;s.xp=0;s.unlocked=true;}); toast('Skills maxed', 'loot'); rebuildUI(); }
function devUnlockAll() { G.skills.forEach(s=>{s.unlocked=true;}); G.cmbt.unlocked=true; G.zones.forEach(z=>{z.unlocked=true;}); toast('All unlocked', 'loot'); rebuildUI(); }
function devSpeed(v) { G._speed=v||1; toast('Speed x'+(v||1), 'info'); }

// Auto-combat
function combatAutoAttack() {
  if (!G.cmbt.inCombat) return;
  if (!isSubActive()) return;
  combatAttack();
}
