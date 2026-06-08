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
    const branches = {};
    BRANCHES.forEach(b => {
      branches[b.id] = {};
      b.nodes.forEach(n => { branches[b.id][n.id] = 0; });
      branches[b.id][b.nodes[0].id] = 1;
    });
    d.branches = branches;
    d.upgs = UPGRADES.map(u => ({ id:u.id, lvl:0 }));
    d.inv = { program:0, hardware:0, exploit:0, neuralLinks:0, turboChargers:0, qProgram:0, qHardware:0, qExploit:0, dataShard:0, fwShard:0, iceCore:0, aiMod:0, encKey:0, dnToken:0, coreFrag:0 };
    d.quests = [];
    d._questProgress = {};
    d.neuralPoints = (d.neuralPoints || 0) + 20;
  }
  d.ver = SAVE_VERSION;
  return d;
}

// ===== ACCOUNT / MULTI-PROFILE SYSTEM =====
let ACCOUNT = null; // { uid, authMethod, email, activeProfile, profiles: [{id, name, spec}] }
const PROFILES_MAX = 4;

function getAccountKey() { return 'cj_account_' + (ACCOUNT ? ACCOUNT.uid : USER); }
function profileStateKey(pid) { return 'cj_state_' + ACCOUNT.uid + '_' + pid; }

function freshProfileMeta(idx) {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  return { id:'char'+(idx+1), name: names[idx], spec: null };
}

function createAccount(uid, email, authMethod) {
  ACCOUNT = {
    uid: uid,
    email: email || '',
    authMethod: authMethod || 'legacy',
    activeProfile: 0,
    profiles: [],
  };
  for (let i = 0; i < PROFILES_MAX; i++) {
    ACCOUNT.profiles.push(freshProfileMeta(i));
  }
}

function saveAccount() {
  if (!ACCOUNT) return;
  try {
    const data = {
      uid: ACCOUNT.uid,
      email: ACCOUNT.email,
      authMethod: ACCOUNT.authMethod,
      activeProfile: ACCOUNT.activeProfile,
      profiles: ACCOUNT.profiles.map(p => ({ id:p.id, name:p.name, spec:p.spec })),
    };
    localStorage.setItem(getAccountKey(), JSON.stringify(data));
  } catch(e) {}
}

function loadAccount(uid) {
  try {
    const raw = localStorage.getItem('cj_account_' + uid);
    if (raw) {
      const d = JSON.parse(raw);
      ACCOUNT = {
        uid: d.uid,
        email: d.email || '',
        authMethod: d.authMethod || 'google',
        activeProfile: d.activeProfile || 0,
        profiles: d.profiles || [],
      };
      while (ACCOUNT.profiles.length < PROFILES_MAX) {
        ACCOUNT.profiles.push(freshProfileMeta(ACCOUNT.profiles.length));
      }
      return true;
    }
  } catch(e) { err('Load account error: '+e.message); }
  return false;
}

function saveProfile() {
  if (!ACCOUNT || !G) return;
  try {
    const profile = ACCOUNT.profiles[ACCOUNT.activeProfile];
    if (!profile) return;
    G.lastSave = Date.now();
    localStorage.setItem(profileStateKey(profile.id), JSON.stringify(G));
    saveAccount();
  } catch(e) {}
}

function loadProfile(pid) {
  try {
    const raw = localStorage.getItem(profileStateKey(pid));
    if (raw) {
      const d = JSON.parse(raw);
      migrateState(d);
      G = Object.assign(freshState(), d);
      while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
      while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
      while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      return true;
    }
  } catch(e) { err('Load profile error: '+e.message); }
  return false;
}

function switchProfile(idx) {
  if (!ACCOUNT || idx === ACCOUNT.activeProfile) return;
  saveProfile();
  ACCOUNT.activeProfile = idx;
  const profile = ACCOUNT.profiles[idx];
  if (!loadProfile(profile.id)) {
    G = freshState();
    G._pw = ACCOUNT.uid;
  }
  rebuildUI();
  updateUI();
  toast('Switched to ' + profile.name, 'info');
}

function save() {
  if (ACCOUNT) {
    saveProfile();
    if (isSubActive()) {
      cloudSave().then(ok => {
        const ci = document.getElementById('cloud-indicator');
        if (ci) ci.textContent = ok ? '☁' : '☁⚠';
      });
    }
  } else if (USER) {
    try {
      G.lastSave = Date.now();
      localStorage.setItem('nri_'+USER, JSON.stringify(G));
    } catch(e) {}
  }
  const si = document.getElementById('save-indicator');
  if (si) si.textContent = 'saved '+new Date().toLocaleTimeString();
}

function load() {
  if (!USER) return false;
  // Try account-based load first
  if (loadAccount(USER)) {
    const profile = ACCOUNT.profiles[ACCOUNT.activeProfile];
    if (loadProfile(profile.id)) return true;
    G = freshState();
    G._pw = ACCOUNT.uid;
    return true;
  }
  // Fallback to legacy single-profile save
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

function migrateLegacySave() {
  if (ACCOUNT) return;
  if (!USER) return;
  const raw = localStorage.getItem('nri_'+USER);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d && d.branches) {
      createAccount(USER, '', 'legacy');
      const profile = ACCOUNT.profiles[0];
      profile.name = USER;
      saveAccount();
      migrateState(d);
      G = Object.assign(freshState(), d);
      while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
      while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
      while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      saveProfile();
      // Keep legacy save as backup
      toast('Profile migrated to multi-character system!', 'info');
    }
  } catch(e) {}
}

function calcOfflineProgress() {
  const now = Date.now();
  const elapsed = (now - G.lastSave) / 1000;
  if (elapsed < 10) return;
  let rate = isSubActive() ? 2 : 1;
  let cap = 86400;
  const duration = Math.min(elapsed, cap);
  BRANCHES.forEach(branch => {
    const langMult = getLangBonus(branch.id);
    branch.nodes.forEach(n => {
      const lvl = branchLevel(branch.id, n.id);
      if (lvl < 1) return;
      if (!n.gen) return;
      const gen = n.gen(lvl);
      Object.entries(gen).forEach(([res, amt]) => {
        addRes(res, amt * duration * rate * branchProdMult() * langMult);
      });
    });
  });
  G.neuralPoints += duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1);
  const kpReward = Math.floor(duration * 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1));
  G.stats.offlineTime += duration;
  const minutes = Math.floor(duration / 60);
  if (minutes > 0) toast(`Offline progress: ${minutes}m | +${fmt(kpReward)} KP | ${Math.round(rate*100)}% resource rate`, 'loot');
}
