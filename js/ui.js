// ========== BUILD UI ==========
function buildSkills() {
  const c = document.getElementById('skills-container'); if (!c) return;
  c.innerHTML = '';
  SKILLS.forEach(cfg => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    const specs = SPECIALIZATIONS.filter(sp => sp.skillId === cfg.id);
    let specsHTML = '';
    if (specs.length > 0) {
      specsHTML = '<div class="specs-container">';
      specs.forEach(sp => {
        const owned = G.specializations.find(s => s.id === sp.id);
        const purchased = owned && owned.purchased;
        specsHTML += '<div class="spec-item'+(purchased?' purchased':'')+'" data-spec="'+sp.id+'">' +
          '<span class="spec-name">'+(purchased?'✓ ':'')+sp.name+'</span>' +
          '<span class="spec-desc">'+sp.desc+'</span>' +
          (!purchased ? '<button class="spec-btn" data-spec="'+sp.id+'">BUY</button>' : '') +
        '</div>';
      });
      specsHTML += '</div>';
    }
    card.innerHTML =
      '<div class="skill-header"><span class="skill-name">'+cfg.name+'</span><span class="skill-level">Lv.1</span></div>' +
      '<div class="skill-progress"><div class="skill-progress-bar"></div></div>' +
      '<div class="skill-info"><span class="skill-yield">0</span><span class="skill-xp">0 XP</span></div>' +
      '<div class="skill-desc">'+(cfg.cost?'Unlock: '+cfg.costLabel+(cfg.req?' | Req: '+cfg.reqLabel:''):cfg.desc)+'</div>' +
      '<button class="skill-btn" data-id="'+cfg.id+'">START</button>' +
      specsHTML;
    card.querySelectorAll('.spec-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); buySpecialization(btn.dataset.spec); });
    });
    card.querySelector('.skill-btn').addEventListener('click', e => { e.stopPropagation(); clickSkill(cfg.id); });
    c.appendChild(card);
  });
}

function buildUpgrades() {
  const c = document.getElementById('upgrades-container'); if (!c) return;
  c.innerHTML = '';
  UPGRADES.forEach(cfg => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML =
      '<div class="flex-between"><span class="upgrade-name">'+cfg.name.replace('{level}',1)+'</span><span class="upgrade-level">Lv.0/'+cfg.max+'</span></div>' +
      '<div class="upgrade-desc">'+cfg.desc+'</div>' +
      '<div class="upgrade-cost">Cost: -</div>' +
      '<button class="upgrade-btn" data-id="'+cfg.id+'">BUY</button>';
    card.querySelector('.upgrade-btn').addEventListener('click', e => { e.stopPropagation(); clickUpgrade(cfg.id); });
    c.appendChild(card);
  });
}

function buildCrafting() {
  const c = document.getElementById('craft-container'); if (!c) return;
  c.innerHTML = '';
  CRAFTS.forEach(cfg => {
    const card = document.createElement('div');
    card.className = 'craft-card';
    card.innerHTML =
      '<div class="craft-name">'+cfg.name+'</div>' +
      '<div class="craft-desc">'+cfg.desc+'</div>' +
      '<div class="craft-cost">Cost: '+Object.entries(cfg.cost).map(([r,a])=>fmt(a)+' '+r).join(', ')+'</div>' +
      '<button class="craft-btn" data-id="'+cfg.id+'">CRAFT</button>';
    card.querySelector('.craft-btn').addEventListener('click', e => { e.stopPropagation(); clickCraft(cfg.id); });
    c.appendChild(card);
  });
}

function buildCombat() {
  const grid = document.getElementById('enemy-grid'); if (!grid) return;
  grid.innerHTML = '';
  ENEMIES.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'enemy-card' + (!G.cmbt.unlocked ? ' locked' : '');
    card.innerHTML =
      '<div class="e-name">'+e.name+'</div>' +
      '<div class="e-lvl">Lv.'+e.lvl+' | HP: '+e.hp+'</div>' +
      '<div class="e-reward">'+Object.entries(e.reward).map(([r,a])=>fmt(a)+' '+r).join(', ')+'</div>' +
      '<div class="e-drop" style="font-size:9px;color:#0ff;margin-top:2px">Drop: '+DROP_LABELS[e.drop]+' (30%)</div>';
    card.addEventListener('click', () => combatEngage(i));
    grid.appendChild(card);
  });

  // Burst exploit buttons
  const burstArea = document.getElementById('burst-actions');
  if (burstArea) {
    burstArea.innerHTML = '';
    BURST_EXPLOITS.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'combat-btn item-btn burst-btn';
      btn.textContent = b.name+' ('+b.damage+'dmg)';
      btn.title = b.desc;
      btn.addEventListener('click', () => combatBurst(b.id));
      burstArea.appendChild(btn);
    });
  }
}

function buildZones() {
  const c = document.getElementById('zones-container'); if (!c) return;
  c.innerHTML = '';
  ZONES.forEach((z, zi) => {
    const zs = G.zones[zi];
    const card = document.createElement('div');
    card.className = 'zone-card' + (zs.unlocked ? '' : ' locked');
    card.innerHTML =
      '<div class="zone-name">'+(zs.unlocked?'✓ ':'🔒 ')+z.name+'</div>' +
      '<div class="zone-desc">'+z.desc+'</div>' +
      (zs.unlocked
        ? '<div class="zone-bonus">Bonus: '+Object.entries(z.bonuses).map(([k,v])=>fmtBonus(k,v)).join(', ')+'</div>'
        : '<div class="zone-req">Defeat '+z.reqDefeated+' enemies total to unlock</div>');
    c.appendChild(card);
  });
}

function buildAchievements() {
  const c = document.getElementById('achievements-container'); if (!c) return;
  c.innerHTML = '';
  ACHIEVEMENTS.forEach((a, i) => {
    const as = G.achievements[i];
    const card = document.createElement('div');
    card.className = 'achievement-card' + (as.unlocked ? ' unlocked' : '');
    card.innerHTML =
      '<div class="ach-name">'+(as.unlocked?'✓ ':'')+a.name+'</div>' +
      '<div class="ach-desc">'+a.desc+'</div>' +
      (as.unlocked ? '<div class="ach-reward">Reward active</div>' : '');
    c.appendChild(card);
  });
}

function buildDevPanel() {
  const p = document.getElementById('dev-panel'); if (!p) return;
  p.innerHTML =
    '<h3>DEV MODE</h3>' +
    '<div class="dev-row">' +
      '<button onclick="devAddRes(\'data\',1000)">+1K DATA</button>' +
      '<button onclick="devAddRes(\'credits\',1000)">+1K CREDITS</button>' +
      '<button onclick="devAddRes(\'cpu\',500)">+500 CPU</button>' +
      '<button onclick="devAddRes(\'bandwidth\',200)">+200 BW</button>' +
      '<button onclick="devAddRes(\'darkMatter\',100)">+100 DM</button>' +
    '</div>' +
    '<div class="dev-row">' +
      '<button onclick="devMaxSkills()">MAX SKILLS</button>' +
      '<button onclick="devUnlockAll()">UNLOCK ALL</button>' +
      '<button onclick="devSpeed(10)">x10 SPEED</button>' +
      '<button onclick="devSpeed(1)">x1 SPEED</button>' +
      '<button onclick="subscribe()">SUB ON</button>' +
      '<button onclick="unsubscribe()">SUB OFF</button>' +
    '</div>';
}

function buildUI() {
  buildSkills();
  buildUpgrades();
  buildCrafting();
  buildCombat();
  buildZones();
  buildAchievements();
  if (isDev()) buildDevPanel();
}

// ========== UPDATE UI ==========
function updateUI() {
  if (!G) return;

  // Resources
  ['data','credits','cpu','bandwidth','darkMatter'].forEach(id => {
    const el = document.getElementById('r-'+id);
    if (!el) return;
    const amt = G.res[id]||0;
    const max = resMax(id);
    el.textContent = max === 1/0 ? fmt(amt) : fmt(amt)+'/'+fmt(max);
  });
  const ul = document.getElementById('user-label');
  if (ul) ul.textContent = USER+(isDev()?' [DEV]':'')+(isSubActive()?' [NETRUNNER+]':'');

  // Skills
  const cw = document.getElementById('combat-pause-warning');
  if (cw) cw.style.display = G.cmbt.inCombat ? 'block' : 'none';

  // Active skill count indicator
  const activeSkillCount = document.getElementById('active-skill-count');
  if (activeSkillCount) {
    const activeCount = G.skills.filter(s => s.active).length;
    const maxActive = maxActiveSkills();
    activeSkillCount.textContent = 'Active: '+activeCount+'/'+maxActive;
    activeSkillCount.style.color = activeCount >= maxActive ? '#ff0' : '#0f0';
  }
  const sc = document.getElementById('skills-container');
  if (sc && sc.children.length === SKILLS.length) {
    SKILLS.forEach((cfg, i) => {
      const s = G.skills[i];
      const card = sc.children[i];
      if (!card) return;
      card.className = 'skill-card' + (s.unlocked?'':' locked') + (s.active?' active-skill':'');
      card.querySelector('.skill-level').textContent = 'Lv.'+s.lvl+(s.lvl>=99?' MAX':'');
      const pct = s.lvl>=99?100:(xpReq(s.lvl)>0?s.xp/xpReq(s.lvl)*100:0);
      card.querySelector('.skill-progress-bar').style.width = Math.min(100,pct)+'%';
      card.querySelector('.skill-yield').textContent = fmt(skillYield(cfg.id))+' '+cfg.res+'/s';
      card.querySelector('.skill-xp').textContent = s.lvl>=99?'MAX':fmt(xpReq(s.lvl)-s.xp)+' XP';
      const reqStr = cfg.req ? ' | Req: '+cfg.reqLabel : '';
      card.querySelector('.skill-desc').textContent = !s.unlocked ? 'Unlock: '+cfg.costLabel + reqStr : cfg.desc;
      const btn = card.querySelector('.skill-btn');
      btn.textContent = s.unlocked ? (s.active?'ACTIVE':'START') : 'UNLOCK';
      btn.className = 'skill-btn' + (s.active?' active-btn':'');
    });
  }

  // Upgrades
  const uc = document.getElementById('upgrades-container');
  if (uc && uc.children.length === UPGRADES.length) {
    UPGRADES.forEach((cfg, i) => {
      const u = G.upgs[i];
      const card = uc.children[i]; if (!card) return;
      const maxed = u.lvl >= cfg.max;
      card.className = 'upgrade-card' + (maxed?' maxed':'');
      card.querySelector('.upgrade-name').textContent = cfg.name.replace('{level}', u.lvl+1);
      card.querySelector('.upgrade-level').textContent = maxed?'MAX':'Lv.'+u.lvl+'/'+cfg.max;
      const cost = {};
      Object.entries(cfg.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*Math.pow(cfg.mult,u.lvl)); });
      card.querySelector('.upgrade-cost').textContent = maxed?'MAXED':'Cost: '+Object.entries(cost).map(([r,a])=>fmt(a)+' '+r).join(', ');
      const btn = card.querySelector('.upgrade-btn');
      btn.disabled = maxed || !canPay(cost);
    });
  }

  // Crafting
  const cc = document.getElementById('craft-container');
  if (cc && cc.children.length === CRAFTS.length) {
    CRAFTS.forEach((cfg, i) => {
      const card = cc.children[i]; if (!card) return;
      const btn = card.querySelector('.craft-btn');
      if (btn) btn.disabled = !canPay(cfg.cost);
    });
  }

  // Inventory
  const inv = document.getElementById('inventory-container');
  if (inv) {
    inv.innerHTML = '';
    const items = [['program','Programs'],['hardware','Hardware'],['exploit','Exploits'],['qProgram','Quantum Programs'],['qHardware','Armor Shields'],['qExploit','Zero Days'],['neuralLinks','Neural Links'],['turboChargers','Turbo Chargers']];
    Object.keys(DROP_LABELS).forEach(k => items.push([k, DROP_LABELS[k]]));
    items.forEach(([id,label]) => {
      const d=document.createElement('div'); d.style.cssText='background:rgba(0,255,65,0.04);border:1px solid rgba(0,255,65,0.12);border-radius:4px;padding:6px 12px;font-size:12px;';
      d.innerHTML='<span style="color:#0ff">'+label+':</span> <span style="color:#ff0">'+(G.inv[id]||0)+'</span>';
      inv.appendChild(d);
    });
  }

  // Combat
  const grid = document.getElementById('enemy-grid');
  if (grid && grid.children.length === ENEMIES.length) {
    ENEMIES.forEach((e, i) => {
      const card = grid.children[i]; if (!card) return;
      card.className = 'enemy-card' + (G.cmbt.inCombat && G.cmbt.idx === i ? ' active' : '') + (!G.cmbt.unlocked ? ' locked' : '');
    });
  }

  const ba = document.getElementById('battle-area');
  if (ba) ba.style.display = G.cmbt.unlocked && G.cmbt.inCombat ? 'block' : 'none';

  if (G.cmbt.unlocked && G.cmbt.inCombat) {
    const e = ENEMIES[G.cmbt.idx];
    const en = document.getElementById('enemy-name');
    const ef = document.getElementById('enemy-hp-fill');
    const et = document.getElementById('enemy-hp-text');
    const { a, d } = cmbtPow();
    if (en) en.textContent = e.name + ' [Lv.'+e.lvl+']';
    if (ef) ef.style.width = Math.max(0, (G.cmbt.hp/e.hp)*100)+'%';
    if (et) et.textContent = 'HP: '+Math.max(0,Math.floor(G.cmbt.hp))+'/'+e.hp;
    const pa = document.getElementById('p-atk'); if (pa) pa.textContent = a;
    const pd = document.getElementById('p-def'); if (pd) pd.textContent = d;
    const ph = document.getElementById('p-hp'); if (ph) ph.textContent = Math.max(0,Math.floor(G.cmbt.php));
    const pm = document.getElementById('p-maxhp'); if (pm) pm.textContent = G.cmbt.mxhp;
    ['program','hardware','exploit'].forEach(id => {
      const el = document.getElementById('item-'+id);
      if (el) el.textContent = G.inv[id]||0;
    });
    const cl = document.getElementById('combat-log');
    if (cl) {
      cl.innerHTML = G.cmbt.log.map(msg => '<div>'+msg+'</div>').join('');
      cl.scrollTop = cl.scrollHeight;
    }
  }

  // Prestige
  const g = prestigeGain();
  const pnl = document.getElementById('pnl'); if (pnl) pnl.textContent = G.prest.lvl;
  const pg = document.getElementById('pnl-gain'); if (pg) pg.textContent = g;
  const ld = document.getElementById('lifetime-dm'); if (ld) ld.textContent = fmt(G.prest.dm);
  const pb = document.getElementById('prestige-btn'); if (pb) pb.disabled = g < 1;
  const dr = document.getElementById('dm-required');
  if (dr) {
    const nextDm = 10 * (g+1) * (g+1);
    const have = G.prest.dm || 0;
    dr.textContent = have >= nextDm ? 'Ready!' : fmt(nextDm) + ' DM needed (have ' + fmt(have) + ')';
  }

  // Transcend
  const tc = document.getElementById('transcend-btn');
  if (tc) {
    const can = canTranscend();
    tc.disabled = !can;
    tc.textContent = can ? 'TRANSCEND (cost: '+transcendCost()+' prestige)' : 'TRANSCEND (need '+(transcendCost()*2)+' prestige)';
  }
  const tcl = document.getElementById('transcend-lvl');
  if (tcl) tcl.textContent = G.prest.transcendLvl;
  const tct = document.getElementById('transcend-times');
  if (tct) tct.textContent = G.prest.transcendTimes;
  const tcc = document.getElementById('transcend-cost');
  if (tcc) tcc.textContent = transcendCost();

  // Zones (rebuild on progression tab visible)
  const progTab = document.getElementById('tab-progression');
  if (progTab && progTab.classList.contains('active')) {
    buildZones();
    buildAchievements();
  }

  // Subscription status
  const subStatus = document.getElementById('sub-status');
  if (subStatus) {
    subStatus.textContent = isSubActive() ? 'Netrunner+ Active' : 'Free Tier';
    subStatus.style.color = isSubActive() ? '#0f0' : '#888';
  }
  const subBtn = document.getElementById('sub-cta-btn');
  if (subBtn) {
    subBtn.style.display = isSubActive() ? 'none' : 'inline-block';
  }

  // Ad banner
  showAdBanner();
}

function rebuildUI() { buildUI(); }

// Login/Logout
function initLogin() {
  const input = document.getElementById('login-input');
  const passInput = document.getElementById('pass-input');
  const loginBtn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const overlay = document.getElementById('login-overlay');
  const game = document.getElementById('game');

  function doLogin() {
    try {
      const name = input.value.trim();
      const pass = passInput.value.trim();
      if (name.length < 2 || name.length > 20) { errEl.textContent='Username must be 2-20 characters'; errEl.style.display='block'; return; }
      if (pass.length < 4) { errEl.textContent='Password must be 4+ characters'; errEl.style.display='block'; return; }
      errEl.style.display='none';

      const raw = localStorage.getItem('nri_'+name);
      if (raw) {
        const d = JSON.parse(raw);
        if (d._pw && d._pw !== pass) { errEl.textContent='Wrong password'; errEl.style.display='block'; return; }
        if (!d._pw) { d._pw = pass; toast('Password set for '+name, 'info'); }
        G = Object.assign(freshState(), d);
        migrateState(G);
        while (G.skills.length < SKILLS.length) G.skills.push({ id:SKILLS[G.skills.length].id, lvl:1, xp:0, active:false, unlocked:false, prog:0 });
        while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
        while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
        while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
        while (G.specializations.length < SPECIALIZATIONS.length) G.specializations.push({ id:SPECIALIZATIONS[G.specializations.length].id, purchased:false });
      } else {
        G = freshState();
        G._pw = pass;
      }
      USER = name;
      localStorage.setItem('nr_user', USER);
      overlay.style.display='none';
      game.style.display='flex';
      buildUI();
      calcOfflineProgress();
      updateUI();
      startLoop();
      toast('Welcome, '+USER+'!', 'info');
      if (isDev()) toast('DEV MODE ACTIVE', 'loot');
      save();

      setTimeout(() => {
        if (G) { const dm = G.skills[0]; if (dm && !dm.active) { dm.active = true; toast('Data Mining started!', 'loot'); } }
      }, 500);

      const _unlockCheck = setInterval(() => {
        if (!G) return;
        if (!G.cmbt.unlocked && G.skills.filter(s=>s.unlocked&&s.lvl>=3).length>=2) {
          G.cmbt.unlocked = true;
          toast('Combat unlocked!', 'loot');
        }
      }, 3000);
    } catch(e) { err('Login: '+e.message); }
  }

  loginBtn.addEventListener('click', doLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus(); });
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  input.focus();
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  let savedUser = null;
  try { savedUser = localStorage.getItem('nr_user'); } catch(e) {}
  if (savedUser) { input.value = savedUser; passInput.focus(); }
}

function logout() {
  save();
  try { localStorage.removeItem('nr_user'); } catch(e) {}
  const game = document.getElementById('game');
  const overlay = document.getElementById('login-overlay');
  if (game) game.style.display = 'none';
  if (overlay) overlay.style.display = 'flex';
  document.getElementById('login-input').value = '';
  document.getElementById('login-input').focus();
  G = null;
  _loopStarted = false;
  toast('Logged out', 'info');
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    this.classList.add('active');
    const tab = document.getElementById('tab-'+this.dataset.tab);
    if (tab) tab.classList.add('active');
    const devPanel = document.getElementById('dev-panel');
    if (devPanel) {
      const isSkillsTab = this.dataset.tab === 'skills';
      devPanel.style.display = isSkillsTab && isDev() ? 'block' : 'none';
    }
  });
});

function fmtBonus(k, v) {
  const labels = { dataMult:'DATA x'+v, creditsMult:'Credits x'+v, cpuMult:'CPU x'+v, bwMult:'BW x'+v, allMult:'All x'+v };
  return labels[k] || k+':'+v;
}
