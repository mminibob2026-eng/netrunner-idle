// ========== BUILD UI ==========
function buildBranchTree() {
  const c = document.getElementById('branch-container');
  if (!c) return;
  c.innerHTML = '';
  BRANCHES.forEach(b => {
    const col = document.createElement('div');
    col.className = 'branch-column';
    col.style.borderColor = b.color;
    let html = '<div class="branch-header" style="color:'+b.color+'">' + b.name + '</div>';
    html += '<div class="branch-desc">' + b.desc + '</div>';
    b.nodes.forEach(n => {
      const lvl = branchLevel(b.id, n.id);
      const unlocked = branchNodeUnlocked(b.id, n.id);
      const viable = unlocked || lvl > 0;
      const cost = branchCost(b.id, n.id);
      const isFirst = b.nodes[0].id === n.id;
      const req = nodeRequirement(b.id, n.id);
      let effectStr = '';
      if (n.gen) {
        const gen = n.gen(Math.max(1, lvl));
        effectStr = Object.entries(gen).map(([r,a]) => fmt(a) + ' ' + r + '/s').join(', ');
      } else if (n.bonus) {
        const bon = n.bonus(Math.max(1, lvl));
        effectStr = Object.entries(bon).map(([k,v]) => {
          if (k === 'atk') return '+' + v + ' ATK';
          if (k === 'hp') return '+' + v + ' HP';
          if (k === 'atkPct') return '+' + v + '% ATK';
          if (k === 'burst') return '+' + v + ' burst';
          if (k === 'npRate') return '+' + Math.round(v * 100) + '% NP';
          if (k === 'capMult') return '+' + Math.round(v * 100) + '% caps';
          if (k === 'costRed') return '-' + Math.round(v * 100) + '% cost';
          if (k === 'prodMult') return '+' + Math.round(v * 100) + '% prod';
          return '';
        }).join(', ');
      }
      const reqStr = req ? '<div class="node-req" style="color:#ff0">Requires: ' + req.node + ' Lv.' + req.level + '</div>' : '';
      const isCapped = n.id === 'costReduction' && lvl >= 20;
      html += '<div class="branch-node' + (viable ? '' : ' node-locked') + '" data-branch="' + b.id + '" data-node="' + n.id + '">';
      html += '<div class="node-header"><span class="node-name">' + n.name + '</span><span class="node-lvl">Lv.' + lvl + (lvl >= 30 ? ' MAX' : '') + '</span></div>';
      html += '<div class="node-desc">' + n.desc + '</div>';
      html += '<div class="node-effect" style="color:' + b.color + '">' + effectStr + '</div>';
      if (reqStr && !viable) html += reqStr;
      html += '<div class="node-cost">' + (lvl >= 30 ? 'MAXED' : isCapped ? 'Cost: ' + cost + ' NP (cap reached)' : 'Cost: ' + cost + ' NP') + '</div>';
      html += '</div>';
    });
    col.innerHTML = html;
    c.appendChild(col);
  });

  // Click handlers via event delegation
  c.addEventListener('click', function(e) {
    const node = e.target.closest('.branch-node');
    if (!node || node.classList.contains('node-locked')) return;
    const bid = node.dataset.branch;
    const nid = node.dataset.node;
    clickBranchNode(bid, nid);
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

  // Auto-craft UI for subscribers
  const autoDiv = document.createElement('div');
  autoDiv.style.cssText = 'margin-top:12px;padding:10px 12px;background:rgba(0,255,65,0.04);border:1px solid rgba(0,255,65,0.12);border-radius:4px;';
  autoDiv.innerHTML =
    '<div style="color:#0f0;font-size:12px;margin-bottom:6px;">AUTO-CRAFT ' + (isSubActive() ? '' : '<span style="color:#888">(Netrunner+ feature)</span>') + '</div>' +
    '<select id="auto-craft-select" style="width:100%;padding:6px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(0,255,65,0.3);color:#0f0;font-family:inherit;font-size:12px;border-radius:3px;' + (isSubActive() ? '' : 'opacity:0.4;pointer-events:none') + '">' +
      '<option value="">-- None --</option>' +
      CRAFTS.map(cfg => '<option value="'+cfg.id+'"'+(G._autoCraft===cfg.id?' selected':'')+'>'+cfg.name+'</option>').join('') +
    '</select>';
  c.appendChild(autoDiv);
  const sel = document.getElementById('auto-craft-select');
  if (sel) sel.addEventListener('change', function() {
    G._autoCraft = this.value || null;
    toast('Auto-craft: ' + (G._autoCraft ? 'Crafting ' + CRAFTS.find(c=>c.id===G._autoCraft)?.name : 'Disabled'), 'info');
    save();
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
      '<div class="e-reward">'+Object.entries(e.reward).map(([r,a])=>fmt(a)+' '+r).join(', ')+' +1 NP</div>' +
      '<div class="e-drop" style="font-size:9px;color:#0ff;margin-top:2px">Drop: '+DROP_LABELS[e.drop]+' (30%)</div>';
    card.addEventListener('click', () => combatEngage(i));
    grid.appendChild(card);
  });

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
      '<button onclick="devMaxBranch()">MAX BRANCHES</button>' +
      '<button onclick="devUnlockAll()">UNLOCK ALL</button>' +
      '<button onclick="devAddNp(100)">+100 NP</button>' +
      '<button onclick="devAddNp(1000)">+1K NP</button>' +
      '<button onclick="devSpeed(10)">x10 SPEED</button>' +
      '<button onclick="devSpeed(1)">x1 SPEED</button>' +
      '<button onclick="subscribe()">SUB ON</button>' +
      '<button onclick="unsubscribe()">SUB OFF</button>' +
    '</div>';
}

function buildUI() {
  buildBranchTree();
  buildUpgrades();
  buildCrafting();
  buildCombat();
  buildZones();
  buildAchievements();
  buildRoadMap();
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

  // NP display
  const npEl = document.getElementById('np-display');
  if (npEl) npEl.textContent = fmt(Math.floor(G.neuralPoints));

  // Branch tree - update levels
  const bc = document.getElementById('branch-container');
  if (bc) {
    BRANCHES.forEach(b => {
      b.nodes.forEach(n => {
        const lvl = branchLevel(b.id, n.id);
        const el = bc.querySelector('[data-branch="'+b.id+'"][data-node="'+n.id+'"]');
        if (!el) return;
        const unlocked = branchNodeUnlocked(b.id, n.id);
        el.className = 'branch-node' + (unlocked || lvl > 0 ? '' : ' node-locked');
        el.querySelector('.node-lvl').textContent = 'Lv.' + lvl + (lvl >= 30 ? ' MAX' : '');
        if (n.gen) {
          const gen = n.gen(Math.max(1, lvl));
          const effectStr = Object.entries(gen).map(([r,a]) => fmt(a) + ' ' + r + '/s').join(', ');
          el.querySelector('.node-effect').textContent = effectStr;
        } else if (n.bonus) {
          const bon = n.bonus(Math.max(1, lvl));
          const effectStr = Object.entries(bon).map(([k,v]) => {
            if (k === 'atk') return '+' + v + ' ATK';
            if (k === 'hp') return '+' + v + ' HP';
            if (k === 'atkPct') return '+' + v + '% ATK';
            if (k === 'burst') return '+' + v + ' burst';
            if (k === 'npRate') return '+' + Math.round(v * 100) + '% NP';
            if (k === 'capMult') return '+' + Math.round(v * 100) + '% caps';
            if (k === 'costRed') return '-' + Math.round(v * 100) + '% cost';
            if (k === 'prodMult') return '+' + Math.round(v * 100) + '% prod';
            return '';
          }).join(', ');
          el.querySelector('.node-effect').textContent = effectStr;
        }
        const cost = branchCost(b.id, n.id);
        const isCapped = n.id === 'costReduction' && lvl >= 20;
        el.querySelector('.node-cost').textContent = lvl >= 30 ? 'MAXED' : isCapped ? 'Cost: ' + cost + ' NP (cap reached)' : 'Cost: ' + cost + ' NP';
      });
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
      const genUpgIds = ['miningSpeed','sniffingSpeed','cryptoSpeed','scoutSpeed'];
      card.querySelector('.upgrade-name').textContent = cfg.name.replace('{level}', u.lvl+1);
      card.querySelector('.upgrade-level').textContent = maxed ? 'MAX' : 'Lv.'+u.lvl+'/'+cfg.max + (genUpgIds.includes(cfg.id) ? ' (' + (1 + u.lvl * 0.2) + 'x)' : '');
      const cost = {};
      const cr = branchCostRed();
      Object.entries(cfg.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*(1-cr)*Math.pow(cfg.mult,u.lvl)); });
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
      if (btn) {
        const cr = branchCostRed();
        const cost = {};
        Object.entries(cfg.cost).forEach(([r,a])=>{ cost[r]=Math.floor(a*(1-cr)); });
        btn.disabled = !canPay(cost);
      }
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
    const pm = document.getElementById('p-maxhp'); if (pm) pm.textContent = G.cmbt.mxhp + branchHpBonus();
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
    const nextDm = (g + 1) * (g + 1) * 10;
    const have = G.prest.dm || 0;
    dr.textContent = have >= nextDm ? 'Ready!' : fmt(nextDm) + ' DM needed for next level (have ' + fmt(have) + ')';
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

  // Combat pause warning (paused during combat)
  const cw = document.getElementById('combat-pause-warning');
  if (cw) cw.style.display = G.cmbt.inCombat ? 'block' : 'none';

  // Ad banner
  showAdBanner();

  // Road map
  updateRoadMap();
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
        while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
        while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
        while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      } else {
        G = freshState();
        G._pw = pass;
        G.neuralPoints = 2;
        toast('TIP: Spend your Neural Points (NP) on branch nodes to start generating resources!', 'info');
      }
      USER = name;
      localStorage.setItem('nr_user', USER);
      overlay.style.display='none';
      game.style.display='flex';
      buildUI();
      calcOfflineProgress();
      initCloud();
      syncCloud();
      updateUI();
      startLoop();
      toast('Welcome, '+USER+'!', 'info');
      if (isDev()) toast('DEV MODE ACTIVE', 'loot');
      trackEvent('login', { username: USER });
      save();

      const _unlockCheck = setInterval(() => {
        if (!G) return;
        if (!G.cmbt.unlocked && G.neuralPoints >= 25) {
          G.cmbt.unlocked = true;
          toast('Combat unlocked! Spend NP to grow stronger.', 'loot');
          clearInterval(_unlockCheck);
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

// ========== ROAD MAP ==========
function buildRoadMap() {
  const c = document.getElementById('road-map');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const m = document.createElement('div');
    m.className = 'road-map-item';
    m.id = 'road-map-' + i;
    c.appendChild(m);
  }
}

function updateRoadMap() {
  const ms = getNextMilestones();
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById('road-map-' + i);
    if (!el) continue;
    if (i < ms.length) {
      const m = ms[i];
      el.style.display = 'flex';
      el.className = 'road-map-item ' + (m.ready ? 'ready' : '');
      el.innerHTML = '<span class="road-num">' + (i + 1) + '</span><span class="road-label">' + m.label + '</span>' + (m.extra ? '<span class="road-extra">' + m.extra + '</span>' : '');
    } else {
      el.style.display = 'none';
    }
  }
}

function getNextMilestones() {
  const ms = [];

  // 1. Best next branch action
  // Find affordable level-ups first, then unlockable nodes, then locked nodes
  let branchAction = null;
  let branchAffordable = null;
  BRANCHES.forEach(b => {
    b.nodes.forEach(n => {
      const lvl = branchLevel(b.id, n.id);
      if (lvl >= 30) return;
      if (!branchNodeUnlocked(b.id, n.id)) {
        const req = nodeRequirement(b.id, n.id);
        const reqLvl = branchLevel(b.id, req.node);
        if (!branchAction) {
          branchAction = { label: 'Unlock ' + n.name, extra: 'Need ' + req.node + ' Lv.' + req.level + ' (have ' + reqLvl + ')', ready: reqLvl >= req.level && G.neuralPoints >= branchCost(b.id, n.id) };
        }
      } else {
        const cost = branchCost(b.id, n.id);
        const aff = G.neuralPoints >= cost;
        if (aff) {
          if (!branchAffordable || cost < branchCost(branchAffordable.b, branchAffordable.n)) {
            branchAffordable = { label: 'Level ' + n.name, extra: cost + ' NP → ' + b.name, ready: true, b: b.id, n: n.id };
          }
        } else if (!branchAction) {
          branchAction = { label: 'Level ' + n.name, extra: cost + ' NP → ' + b.name, ready: false };
        }
      }
    });
  });
  if (branchAffordable) ms.push(branchAffordable);
  else if (branchAction) ms.push(branchAction);
  else ms.push({ label: 'All nodes maxed!', extra: 'Great work, runner', ready: false });

  // 2. Combat progress
  if (!G.cmbt.unlocked) {
    const npNeeded = Math.max(0, 25 - Math.floor(G.neuralPoints));
    ms.push({ label: 'Unlock COMBAT', extra: 'Need ' + npNeeded + ' NP', ready: G.neuralPoints >= 25 });
  } else {
    const zi = ZONES.slice().reverse().findIndex(z => !G.zones[ZONES.indexOf(z)].unlocked);
    if (zi !== -1) {
      const z = ZONES[ZONES.length - 1 - zi];
      const d = Math.max(0, z.reqDefeated - (G.stats.enemiesDefeated || 0));
      const remain = ZONES.length - 1 - zi;
      ms.push({ label: 'Unlock ' + z.name, extra: 'Defeat ' + d + ' more enemies (zone ' + (ZONES.length - remain + 1) + '/' + ZONES.length + ')', ready: (G.stats.enemiesDefeated || 0) >= z.reqDefeated });
    } else {
      ms.push({ label: 'All zones unlocked!', extra: 'Transcend to grow stronger', ready: false });
    }
  }

  // 3. Prestige
  const pg = prestigeGain();
  if (pg < 1) {
    const d = Math.max(0, 10 - (G.prest.dm || 0));
    ms.push({ label: 'PRESTIGE', extra: fmt(d) + ' DM needed (have ' + fmt(G.prest.dm || 0) + ')', ready: pg >= 1 });
  } else {
    ms.push({ label: 'PRESTIGE READY!', extra: '+' + pg + ' levels', ready: true });
  }

  return ms.slice(0, 3);
}

function fmtBonus(k, v) {
  const labels = { dataMult:'DATA x'+v, creditsMult:'Credits x'+v, cpuMult:'CPU x'+v, bwMult:'BW x'+v, allMult:'All x'+v };
  return labels[k] || k+':'+v;
}
