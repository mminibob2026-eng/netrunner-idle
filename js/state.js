function freshState() {
  return {
    res: { data:0, credits:0, cpu:0, bandwidth:0, darkMatter:0 },
    skills: SKILLS.map(s => ({ id:s.id, lvl:1, xp:0, active:false, unlocked:!s.cost, prog:0 })),
    upgs: UPGRADES.map(u => ({ id:u.id, lvl:0 })),
    inv: { program:0, hardware:0, exploit:0, neuralLinks:0, turboChargers:0, qProgram:0, qHardware:0, qExploit:0, dataShard:0, fwShard:0, iceCore:0, aiMod:0, encKey:0, dnToken:0, coreFrag:0 },
    cmbt: { idx:0, hp:50, php:100, mxhp:100, atk:10, def:5, accum:0, unlocked:false, inCombat:false, log:[], _bonus:0, burstCd:0 },
    prest: { lvl:0, dm:0, times:0, transcendLvl:0, transcendTimes:0 },
    stats: { earned:{data:0,credits:0,cpu:0,bandwidth:0,darkMatter:0}, enemiesDefeated:0, itemsCrafted:0, totalPrestige:0, offlineTime:0 },
    zones: ZONES.map(z => ({ id:z.id, unlocked:z.id === 'perimeter' })),
    achievements: ACHIEVEMENTS.map(a => ({ id:a.id, unlocked:false })),
    specializations: SPECIALIZATIONS.map(s => ({ id:s.id, purchased:false })),
    lastSave: Date.now(),
    _subActive: false,
    _pw: '',
    ver: SAVE_VERSION,
  };
}

function migrateState(d) {
  if (!d.ver || d.ver < 5) {
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
    if (!d.specializations) d.specializations = SPECIALIZATIONS.map(s => ({ id:s.id, purchased:false }));
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
      while (G.skills.length < SKILLS.length) G.skills.push({ id:SKILLS[G.skills.length].id, lvl:1, xp:0, active:false, unlocked:false, prog:0 });
      while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
      while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
      while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      while (G.specializations.length < SPECIALIZATIONS.length) G.specializations.push({ id:SPECIALIZATIONS[G.specializations.length].id, purchased:false });
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
  G.skills.forEach(s => {
    if (!s.unlocked || !s.active) return;
    if (!isSubActive() && G.skills.filter(x => x.active).indexOf(s) >= 2) return;
    const c = skillCfg(s.id);
    const t = skillTime(s.id);
    const cycles = duration / t;
    if (c.res === 'all') {
      addRes('data', 2 * (1 + (s.lvl-1)*0.1) * cycles * rate);
      addRes('credits', 2 * (1 + (s.lvl-1)*0.1) * cycles * rate);
      addRes('cpu', 1 * (1 + (s.lvl-1)*0.1) * cycles * rate);
      addRes('bandwidth', 0.5 * (1 + (s.lvl-1)*0.1) * cycles * rate);
    } else {
      addRes(c.res, skillYield(c.id) * cycles * rate);
    }
    const xp = c.xp * (1 + (s.lvl-1)*0.04) * cycles * rate;
    s.xp += xp;
    const req = xpReq(s.lvl);
    while (s.xp >= req && s.lvl < 99) { s.xp -= req; s.lvl++; }
  });
  G.stats.offlineTime += duration;
  const minutes = Math.floor(duration / 60);
  if (minutes > 0) toast(`Offline progress: ${minutes}m earned (${Math.round(rate*100)}% rate)`, 'loot');
}
