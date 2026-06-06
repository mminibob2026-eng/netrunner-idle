function freshState() {
  const branches = {};
  BRANCHES.forEach(b => {
    branches[b.id] = {};
    b.nodes.forEach(n => { branches[b.id][n.id] = 0; });
    branches[b.id][b.nodes[0].id] = 1;
  });
  return {
    res: { data:0, credits:0, cpu:0, bandwidth:0, darkMatter:0 },
    branches: branches,
    neuralPoints: 0,
    upgs: UPGRADES.map(u => ({ id:u.id, lvl:0 })),
    inv: { program:0, hardware:0, exploit:0, neuralLinks:0, turboChargers:0, qProgram:0, qHardware:0, qExploit:0, dataShard:0, fwShard:0, iceCore:0, aiMod:0, encKey:0, dnToken:0, coreFrag:0 },
    cmbt: { idx:0, hp:50, php:100, mxhp:100, atk:10, def:5, accum:0, unlocked:false, inCombat:false, log:[], _bonus:0, burstCd:0 },
    prest: { lvl:0, dm:0, times:0, transcendLvl:0, transcendTimes:0 },
    stats: { earned:{data:0,credits:0,cpu:0,bandwidth:0,darkMatter:0}, enemiesDefeated:0, itemsCrafted:0, totalPrestige:0, offlineTime:0 },
    zones: ZONES.map(z => ({ id:z.id, unlocked:z.id === 'perimeter' })),
    achievements: ACHIEVEMENTS.map(a => ({ id:a.id, unlocked:false })),
    lastSave: Date.now(),
    _subActive: false,
    _pw: '',
    _lastMiniGameEvent: 0,
    ver: SAVE_VERSION,
  };
}

function migrateState(d) {
  if (!d.ver || d.ver < SAVE_VERSION) {
    if (!d.zones) d.zones = ZONES.map(z => ({ id:z.id, unlocked:z.id === 'perimeter' }));
    if (!d.achievements) d.achievements = ACHIEVEMENTS.map(a => ({ id:a.id, unlocked:false }));
    if (!d.stats) d.stats = { earned:{data:0,credits:0,cpu:0,bandwidth:0,darkMatter:0}, enemiesDefeated:0, itemsCrafted:0, totalPrestige:0, offlineTime:0 };
    if (!d.stats.enemiesDefeated) d.stats.enemiesDefeated = 0;
    if (!d.stats.itemsCrafted) d.stats.itemsCrafted = 0;
    if (!d.stats.totalPrestige) d.stats.totalPrestige = 0;
    if (!d.stats.offlineTime) d.stats.offlineTime = 0;
    if (!d.prest.transcendLvl) d.prest.transcendLvl = 0;
    if (!d.prest.transcendTimes) d.prest.transcendTimes = 0;
    if (d._subActive === undefined) d._subActive = false;
    if (!d.lastSave) d.lastSave = Date.now();
    if (!d.branches) {
      const branches = {};
      BRANCHES.forEach(b => {
        branches[b.id] = {};
        b.nodes.forEach(n => { branches[b.id][n.id] = 0; });
        branches[b.id][b.nodes[0].id] = 1;
      });
      d.branches = branches;
    }
    if (!d.neuralPoints) d.neuralPoints = 0;
    if (!d._lastMiniGameEvent) d._lastMiniGameEvent = 0;
    delete d.skills;
    delete d.specializations;
    d.ver = SAVE_VERSION;
  }
  return d;
}

function save() {
  try {
    G.lastSave = Date.now();
    localStorage.setItem('nri_'+USER, JSON.stringify(G));
  } catch(e) {}
  if (isSubActive()) {
    cloudSave().then(ok => {
      const ci = document.getElementById('cloud-indicator');
      if (ci) ci.textContent = ok ? '☁' : '☁⚠';
    });
  }
  const si = document.getElementById('save-indicator');
  if (si) si.textContent = 'saved '+new Date().toLocaleTimeString();
}

function load() {
  try {
    const raw = localStorage.getItem('nri_'+USER);
    if (raw) {
      const d = JSON.parse(raw);
      migrateState(d);
      G = Object.assign(freshState(), d);
      while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
      while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
      while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      return true;
    }
  } catch(e) { err('Load error: '+e.message); }
  return false;
}

function calcOfflineProgress() {
  const now = Date.now();
  const elapsed = (now - G.lastSave) / 1000;
  if (elapsed < 10) return;
  let rate = isSubActive() ? 1 : 0.25;
  let cap = isSubActive() ? 86400 : 21600;
  const duration = Math.min(elapsed, cap);
  const branch = BRANCHES.find(b => b.id === 'data');
  if (branch) {
    branch.nodes.forEach(n => {
      const lvl = branchLevel('data', n.id);
      if (lvl < 1) return;
      const gen = n.gen(lvl);
      Object.entries(gen).forEach(([res, amt]) => {
        addRes(res, amt * duration * rate * branchProdMult());
      });
    });
  }
  G.neuralPoints += duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1);
  const npReward = Math.floor(duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1));
  G.stats.offlineTime += duration;
  const minutes = Math.floor(duration / 60);
  if (minutes > 0) toast(`Offline progress: ${minutes}m | +${fmt(npReward)} NP | ${Math.round(rate*100)}% resource rate`, 'loot');
}
