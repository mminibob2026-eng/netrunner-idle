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
    _nextMiniGameCooldown: 0,
    _pendingMiniGameEvent: false,
    _quests: [], _questDate: '', _questProgress: {}, _questCompleted: [],
    _questWeekly: 0, _questWeeklyDate: '',
    _zoneTiers: {},
    _consumables: {},
    _enhance: { program:0, hardware:0, exploit:0 },
    _enhanceSlot: 'program',
    _enemyAbilityCd: 0,
    _projects: {},
    _libraries: {},
    _specialization: null,
    _sprint: null, _sprintDate: '',
    _sprintCompleted: 0,
    ver: SAVE_VERSION,
  };
}

function migrateState(d) {
  if (!d.ver || d.ver < 6) {
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
    if (!d._autoCraft) d._autoCraft = null;
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
  }
  if (d.ver < 7) {
    if (!d._quests) d._quests = [];
    if (!d._questDate) d._questDate = '';
    if (!d._questProgress) d._questProgress = {};
    if (!d._questCompleted) d._questCompleted = [];
    if (!d._questWeekly) d._questWeekly = 0;
    if (!d._questWeeklyDate) d._questWeeklyDate = '';
    if (!d._zoneTiers) d._zoneTiers = {};
    if (!d._consumables) d._consumables = {};
    if (!d._enhance) d._enhance = { program:0, hardware:0, exploit:0 };
    if (!d._enhanceSlot) d._enhanceSlot = 'program';
    if (!d._enemyAbilityCd) d._enemyAbilityCd = 0;
    if (!d._pendingMiniGameEvent) d._pendingMiniGameEvent = false;
    if (!d._nextMiniGameCooldown) d._nextMiniGameCooldown = 0;
  }
  if (d.ver < 8) {
    // Rebuild branches for new language-based system (old saves have stale IDs)
    const branches = {};
    BRANCHES.forEach(b => {
      branches[b.id] = {};
      b.nodes.forEach(n => { branches[b.id][n.id] = 0; });
      branches[b.id][b.nodes[0].id] = 1;
    });
    d.branches = branches;
    // Reset upgrades (old saves have stale upgrade IDs)
    d.upgs = UPGRADES.map(u => ({ id:u.id, lvl:0 }));
    // Reset inv to fresh state keys (old item IDs no longer valid)
    d.inv = { program:0, hardware:0, exploit:0, neuralLinks:0, turboChargers:0, qProgram:0, qHardware:0, qExploit:0, dataShard:0, fwShard:0, iceCore:0, aiMod:0, encKey:0, dnToken:0, coreFrag:0 };
    // Clear stale quests
    d.quests = [];
    d._questProgress = {};
    d.neuralPoints = (d.neuralPoints || 0) + 20;
  }
  d.ver = SAVE_VERSION;
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
  BRANCHES.forEach(branch => {
    branch.nodes.forEach(n => {
      const lvl = branchLevel(branch.id, n.id);
      if (lvl < 1) return;
      if (!n.gen) return;
      const gen = n.gen(lvl);
      Object.entries(gen).forEach(([res, amt]) => {
        addRes(res, amt * duration * rate * branchProdMult());
      });
    });
  });
  G.neuralPoints += duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1);
  const kpReward = Math.floor(duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1));
  G.stats.offlineTime += duration;
  const minutes = Math.floor(duration / 60);
  if (minutes > 0) toast(`Offline progress: ${minutes}m | +${fmt(kpReward)} KP | ${Math.round(rate*100)}% resource rate`, 'loot');
}
