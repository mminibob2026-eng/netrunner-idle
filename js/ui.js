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
        effectStr = Object.entries(gen).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r) + '/s').join(', ');
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
      let reqStr = '';
      if (req) {
        const reqNodeName = branchNodeCfg(b.id, req.node)?.name || req.node;
        const reqHave = branchLevel(b.id, req.node);
        reqStr = '<div class="node-req" style="color:' + (reqHave >= req.level ? '#0f0' : '#ff0') + '">Requires: ' + reqNodeName + ' Lv.' + req.level + ' (have Lv.' + reqHave + ')</div>';
      }
      const isCapped = n.id === 'costReduction' && lvl >= 20;
      html += '<div class="branch-node' + (viable ? '' : ' node-locked') + '" data-branch="' + b.id + '" data-node="' + n.id + '">';
      html += '<div class="node-header"><span class="node-name">' + n.name + '</span><span class="node-lvl">Lv.' + lvl + (lvl >= 30 ? ' MAX' : '') + '</span></div>';
      html += '<div class="node-desc">' + n.desc + '</div>';
      html += '<div class="node-effect" style="color:' + b.color + '">' + effectStr + '</div>';
      if (reqStr && (!unlocked || lvl === 0)) html += reqStr;
      html += '<div class="node-cost">' + (lvl >= 30 ? 'MAXED' : isCapped ? 'Cost: ' + cost + ' KP (cap reached)' : 'Cost: ' + cost + ' KP') + '</div>';
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
      '<div class="craft-cost">Cost: '+Object.entries(cfg.cost).map(([r,a])=>(RES[r]?RES[r].n:r)+' '+fmt(a)).join(', ')+'</div>' +
      '<button class="craft-btn" data-id="'+cfg.id+'">BUILD</button>';
    card.querySelector('.craft-btn').addEventListener('click', e => { e.stopPropagation(); clickCraft(cfg.id); });
    c.appendChild(card);
  });

  // Auto-build UI for subscribers
  const autoDiv = document.createElement('div');
  autoDiv.style.cssText = 'margin-top:12px;padding:10px 12px;background:rgba(0,255,65,0.04);border:1px solid rgba(0,255,65,0.12);border-radius:4px;';
  autoDiv.innerHTML =
    '<div style="color:#0f0;font-size:12px;margin-bottom:6px;">AUTO-BUILD ' + (isSubActive() ? '' : '<span style="color:#888">(Code Journey Pro feature)</span>') + '</div>' +
    '<select id="auto-craft-select" style="width:100%;padding:6px 8px;background:rgba(0,0,0,0.3);border:1px solid rgba(0,255,65,0.3);color:#0f0;font-family:inherit;font-size:12px;border-radius:3px;' + (isSubActive() ? '' : 'opacity:0.4;pointer-events:none') + '">' +
      '<option value="">-- None --</option>' +
      CRAFTS.map(cfg => '<option value="'+cfg.id+'"'+(G._autoCraft===cfg.id?' selected':'')+'>'+cfg.name+'</option>').join('') +
    '</select>';
  c.appendChild(autoDiv);
  const sel = document.getElementById('auto-craft-select');
  if (sel) sel.addEventListener('change', function() {
    G._autoCraft = this.value || null;
    toast('Auto-build: ' + (G._autoCraft ? 'Building ' + CRAFTS.find(c=>c.id===G._autoCraft)?.name : 'Disabled'), 'info');
    save();
  });
}

function buildCombat() {
  const grid = document.getElementById('enemy-grid'); if (!grid) return;
  grid.innerHTML = '';
  ENEMIES.forEach((e, i) => {
    const ai = ENEMY_ABILITY_MAP[i % ENEMY_ABILITY_MAP.length];
    const ab = ENEMY_ABILITIES[ai];
    const card = document.createElement('div');
    card.className = 'enemy-card' + (!G.cmbt.unlocked ? ' locked' : '');
    card.innerHTML =
      '<div class="e-name">'+e.name+'</div>' +
      '<div class="e-lvl">Lv.'+e.lvl+' | HP: '+e.hp+'</div>' +
      '<div class="e-ability" style="font-size:9px;color:#f44">' + ab.name + ': ' + ab.desc + '</div>' +
      '<div class="e-reward">'+Object.entries(e.reward).map(([r,a])=>(RES[r]?RES[r].n:r)+' '+fmt(a)).join(', ')+' +1 KP</div>' +
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
    const tier = getZoneTier(z.id);
    let html = '<div class="zone-name">'+(zs.unlocked?'✓ ':'🔒 ')+z.name+'</div>' +
      '<div class="zone-desc">'+z.desc+'</div>';
    if (zs.unlocked) {
      html += '<div class="zone-bonus">Bonus: '+Object.entries(z.bonuses).map(([k,v])=>fmtBonus(k,v)).join(', ')+'</div>';
      html += '<div class="zone-tier-select">Tier: ' + TIER_BONUSES.map((tb, ti) =>
        '<button class="tier-btn' + (ti === tier ? ' active' : '') + '" data-zone="' + z.id + '" data-tier="' + ti + '" style="background:' + (ti === tier ? tb.color : 'transparent') + ';border:1px solid ' + tb.color + ';color:' + tb.color + ';padding:2px 6px;margin:2px;font-size:10px;cursor:pointer;border-radius:2px;">' + tb.name + '</button>'
      ).join('') + '</div>';
    } else {
      html += '<div class="zone-req">Defeat '+z.reqDefeated+' enemies total to unlock</div>';
    }
    card.innerHTML = html;
    card.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        setZoneTier(this.dataset.zone, parseInt(this.dataset.tier));
        buildZones();
        toast('Zone tier: ' + TIER_BONUSES[parseInt(this.dataset.tier)].name, 'info');
      });
    });
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

const QUEST_TAB = {
  qEarnXp:'skills', qEarnLoc:'skills', qDebug:'combat', qBuild:'crafting',
  qLearn:'skills', qDeepFix:'combat', qMastery:'combat',
};

function buildContracts() {
  const c = document.getElementById('contracts-container'); if (!c) return;
  c.innerHTML = '';
  const quests = getActiveQuests();
  const weekStart = getWeekStart();
  if (G._questWeeklyDate !== weekStart) { G._questWeekly = 0; G._questWeeklyDate = weekStart; }

  const header = document.createElement('div');
  header.style.cssText = 'color:#888;font-size:11px;margin-bottom:8px;';
  header.textContent = 'Bonus progress: ' + (G._questWeekly || 0) + '/3 weekly';
  c.appendChild(header);

  quests.forEach((q, i) => {
    const done = G._questCompleted.includes(i);
    const progress = q.check(G);
    const ready = !done && progress >= q.target;
    const pct = Math.min(100, Math.round((progress / q.target) * 100));
    const card = document.createElement('div');
    card.className = 'contract-card' + (done ? ' completed' : '') + (ready ? ' ready' : '');

    const rewardStr = q.rewardNP + ' KP' + Object.entries(q.reward).map(([r,a]) => ' + ' + fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join('');
    card.innerHTML =
      '<div class="contract-name">' + q.desc + '</div>' +
      '<div class="contract-progress-bar"><div class="contract-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="contract-progress-text">' + progress + '/' + q.target + '</div>' +
      '<div class="contract-reward">' + rewardStr + '</div>' +
      '<div style="margin-top:6px;">' +
      (done ? '<span style="color:#0f0;font-size:10px;">✓ Claimed</span>' :
       ready ? '<button class="claim-btn" data-i="' + i + '">CLAIM</button>' :
       '<button class="goto-btn" data-i="' + i + '" style="background:transparent;border:1px solid #666;color:#888;font-family:inherit;font-size:9px;cursor:pointer;border-radius:2px;padding:2px 8px;">GO</button>') +
      '</div>';
    c.appendChild(card);

    card.querySelector('.claim-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      claimQuest(parseInt(e.target.dataset.i));
    });

    card.querySelector('.goto-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      const tab = QUEST_TAB[q.id] || 'branches';
      switchTab(tab);
    });
  });

  if ((G._questWeekly || 0) >= 3) {
    const weekly = document.createElement('div');
    weekly.style.cssText = 'color:#0f0;font-size:12px;margin-top:6px;';
    weekly.textContent = 'Weekly bonus claimed! Complete 3 more for another bonus.';
    c.appendChild(weekly);
  }
}

function buildConsumables() {
  const c = document.getElementById('consumables-container'); if (!c) return;
  c.innerHTML = '';
  CONSUMABLES.forEach(cfg => {
    const active = hasConsumableEffect(cfg.id);
    const expires = G._consumables[cfg.id];
    const remaining = expires ? Math.max(0, Math.round((expires - Date.now()) / 1000)) : 0;
    const card = document.createElement('div');
    card.className = 'consumable-card' + (active ? ' active' : '');
    card.innerHTML =
      '<div class="consumable-name">' + cfg.name + '</div>' +
      '<div class="consumable-desc">' + cfg.desc + '</div>' +
      '<div class="consumable-cost">Cost: ' + Object.entries(cfg.cost).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join(', ') + '</div>' +
      (active ? '<div class="consumable-timer">Active: ' + remaining + 's</div>' : '') +
      '<button class="consumable-btn" data-id="' + cfg.id + '"' + (active ? ' disabled' : '') + '>' + (active ? 'ACTIVE' : 'USE') + '</button>';
    card.querySelector('.consumable-btn').addEventListener('click', e => { e.stopPropagation(); craftConsumable(cfg.id); });
    c.appendChild(card);
  });
}

function buildEnhance() {
  const c = document.getElementById('enhance-container'); if (!c) return;
  c.innerHTML = '';
  const slotRow = document.createElement('div');
  slotRow.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;';
  ENHANCE_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'enhance-slot-btn' + (G._enhanceSlot === item.id ? ' active' : '');
    btn.textContent = item.label + ' Lv.' + (G._enhance[item.id] || 0);
    btn.addEventListener('click', () => { G._enhanceSlot = item.id; buildEnhance(); });
    slotRow.appendChild(btn);
  });
  c.appendChild(slotRow);
  const sel = ENHANCE_ITEMS.find(x => x.id === G._enhanceSlot);
  if (!sel) return;
  const lvl = G._enhance[sel.id] || 0;
  const info = document.createElement('div');
  info.style.cssText = 'background:rgba(0,255,65,0.04);border:1px solid rgba(0,255,65,0.12);border-radius:4px;padding:10px 12px;margin-bottom:8px;font-size:12px;';
  info.innerHTML =
    '<div style="color:#0ff">' + sel.label + ' Lv.' + lvl + '/' + sel.maxLvl + '</div>' +
    '<div style="color:#888;font-size:11px;">' + sel.bonusLabel + ' per level</div>' +
    '<div style="color:#ff0;font-size:11px;">Current bonus: +' + getEnhanceBonus(sel.id) + '</div>' +
    '<div style="color:#888;font-size:11px;margin-top:4px;">Success rate: ' + Math.round(enhanceSuccessRate(lvl) * 100) + '%</div>' +
    '<div style="color:#888;font-size:11px;">Cost: ' + Object.entries(enhanceCost(lvl)).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join(', ') + ' + 1 ' + sel.label + '</div>';
  c.appendChild(info);
  const craftBtn = document.createElement('button');
  craftBtn.className = 'enhance-btn';
  craftBtn.textContent = 'ENHANCE (consume 1 ' + sel.label + ')';
  craftBtn.disabled = lvl >= sel.maxLvl || (G.inv[sel.id] || 0) < 1;
  craftBtn.addEventListener('click', () => { enhanceItem(sel.id); buildEnhance(); });
  c.appendChild(craftBtn);
  const need = document.createElement('div');
  need.style.cssText = 'color:#888;font-size:10px;margin-top:4px;';
  need.textContent = 'Owned: ' + (G.inv[sel.id] || 0) + ' | Max: ' + sel.maxLvl;
  c.appendChild(need);
}

function buildDevPanel() {
  const p = document.getElementById('dev-panel'); if (!p) return;
  p.innerHTML =
    '<h3>DEV MODE</h3>' +
    '<div class="dev-row">' +
      '<button onclick="devAddRes(\'data\',1000)">+1K XP</button>' +
      '<button onclick="devAddRes(\'credits\',1000)">+1K LOC</button>' +
      '<button onclick="devAddRes(\'cpu\',500)">+500 Proc</button>' +
      '<button onclick="devAddRes(\'bandwidth\',200)">+200 Insight</button>' +
      '<button onclick="devAddRes(\'darkMatter\',100)">+100 Mastery</button>' +
      '<button onclick="devResetAll()" style="border-color:#f44;color:#f44;">RESET ALL</button>' +
    '</div>' +
    '<div class="dev-row">' +
      '<button onclick="devMaxBranch()">MAX LANGUAGES</button>' +
      '<button onclick="devUnlockAll()">UNLOCK ALL</button>' +
      '<button onclick="devAddNp(100)">+100 KP</button>' +
      '<button onclick="devAddNp(1000)">+1K KP</button>' +
      '<button onclick="devSpeed(10)">x10 SPEED</button>' +
      '<button onclick="devSpeed(1)">x1 SPEED</button>' +
      '<button onclick="subscribe(true)">SUB ON</button>' +
      '<button onclick="subscribe(false)">SUB OFF</button>' +
    '</div>';
}

function buildProjects() {
  const c = document.getElementById('projects-container'); if (!c) return;
  c.innerHTML = '';
  PROJECTS.forEach(p => {
    const active = G._projects[p.id];
    const done = active?.done;
    const pct = active ? Math.max(0, Math.min(100, 100 - (active.timeLeft / p.duration) * 100)) : 0;
    const card = document.createElement('div');
    card.className = 'project-card' + (done ? ' done' : '');
    card.innerHTML =
      '<div class="project-name">' + p.name + '</div>' +
      '<div class="project-desc">' + p.desc + '</div>' +
      '<div class="project-bonus" style="color:#ff0;font-size:10px;">' + Object.entries(p.bonus).map(([k,v]) => fmtBonus(k,v)).join(', ') + '</div>' +
      (active ? '<div class="project-progress"><div class="project-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="project-time">' + (done ? 'COMPLETE!' : Math.ceil(active.timeLeft) + 's remaining') + '</div>'
      : '<div class="project-cost">Cost: ' + p.kpCost + ' KP</div>' +
        '<button class="project-btn" data-id="' + p.id + '">START BUILD</button>');
    if (!active) {
      card.querySelector('.project-btn').addEventListener('click', e => { e.stopPropagation(); startProject(p.id); });
    }
    c.appendChild(card);
  });
}

function buildSprints() {
  const c = document.getElementById('sprints-container'); if (!c) return;
  c.innerHTML = '';
  const s = getActiveSprint();
  if (!s) { c.innerHTML = '<div style="color:#888;font-size:11px;">No sprint available</div>'; return; }
  const card = document.createElement('div');
  card.className = 'sprint-card';
  card.innerHTML =
    '<div class="sprint-name">Daily Sprint: ' + s.desc + '</div>' +
    '<div class="sprint-req">Deliver: ' + Object.entries(s.req).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join(', ') + '</div>' +
    '<div class="sprint-reward">Reward: ' + s.rewardNP + ' KP' + Object.entries(s.reward).map(([r,a]) => ' + ' + fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join('') + '</div>' +
    '<div class="sprint-count">Sprints completed: ' + (G._sprintCompleted || 0) + '</div>' +
    '<button class="sprint-btn" onclick="deliverSprint()">DELIVER</button>';
  c.appendChild(card);
}

function buildLibraries() {
  const c = document.getElementById('libraries-container'); if (!c) return;
  c.innerHTML = '';
  LIBRARIES.forEach(lib => {
    const lvl = G._libraries[lib.id] || 0;
    const maxed = lvl >= lib.max;
    const cost = {};
    Object.entries(lib.baseCost).forEach(([r,a]) => { cost[r] = Math.floor(a * Math.pow(lib.mult, lvl)); });
    const bon = lib.bonus(lvl);
    const card = document.createElement('div');
    card.className = 'library-card' + (maxed ? ' maxed' : '');
    card.innerHTML =
      '<div class="library-name">' + lib.name + '</div>' +
      '<div class="library-desc">' + lib.desc + '</div>' +
      '<div class="library-effect" style="color:#0ff;">' + Object.entries(bon).map(([k,v]) => fmtBonus(k,v)).join(', ') + '</div>' +
      '<div class="library-level">Lv.' + lvl + '/' + lib.max + '</div>' +
      (maxed ? '<div class="library-max">MAXED</div>' : '<div class="library-cost">Cost: ' + Object.entries(cost).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r)).join(', ') + '</div>' +
        '<button class="library-btn" data-id="' + lib.id + '">UPGRADE</button>');
    if (!maxed) {
      card.querySelector('.library-btn').addEventListener('click', e => { e.stopPropagation(); upgradeLibrary(lib.id); });
    }
    c.appendChild(card);
  });
}

function specLangStr(spec) {
  if (!spec.langBonus) return '';
  return Object.entries(spec.langBonus).map(([lid, mult]) => {
    const b = BRANCHES.find(x => x.id === lid);
    return (b ? b.name : lid) + ' ×' + mult;
  }).join(' · ');
}

function specBonusStr(spec) {
  if (!spec.bonus) return '';
  const labels = {
    projectSpeed:'Projects ×'+spec.bonus.projectSpeed,
    capMult:'Caps ×'+spec.bonus.capMult,
    defMult:'Def ×'+spec.bonus.defMult,
    npRate:'KP ×'+spec.bonus.npRate,
    autoAction:'Auto-pilot',
  };
  return Object.entries(spec.bonus).map(([k,v]) => labels[k] || (k+':'+v)).join(' · ');
}

function buildSpecializations() {
  const c = document.getElementById('specializations-container'); if (!c) return;
  c.innerHTML = '';
  if (G._specialization) {
    const spec = SPECIALIZATIONS.find(x => x.id === G._specialization);
    c.innerHTML = '<div class="spec-card" style="border-color:#0ff;">' +
      '<div class="spec-name" style="color:#0ff;">' + spec.name + '</div>' +
      '<div class="spec-desc">' + spec.desc + '</div>' +
      '<div style="color:#ff0;font-size:11px;margin:2px 0;">' + specLangStr(spec) + '</div>' +
      '<div class="spec-bonus" style="color:#0f0;">' + specBonusStr(spec) + '</div>' +
      '<div style="color:#888;font-size:10px;margin-top:4px;">Enlightenment to respecialize</div></div>';
    return;
  }
  SPECIALIZATIONS.forEach(spec => {
    const card = document.createElement('div');
    card.className = 'spec-card';
    card.innerHTML =
      '<div class="spec-name" style="color:'+spec.color+'">' + spec.name + '</div>' +
      '<div class="spec-desc">' + spec.desc + '</div>' +
      '<div style="color:#ff0;font-size:10px;margin:2px 0;">' + specLangStr(spec) + '</div>' +
      '<div class="spec-bonus">' + specBonusStr(spec) + '</div>' +
      '<button class="spec-btn" data-id="' + spec.id + '" style="border-color:'+spec.color+';color:'+spec.color+'">CHOOSE</button>';
    card.querySelector('.spec-btn').addEventListener('click', e => { e.stopPropagation(); selectSpecialization(spec.id); });
    c.appendChild(card);
  });
}

function buildUI() {
  buildBranchTree();
  buildUpgrades();
  buildCrafting();
  buildCombat();
  buildZones();
  buildAchievements();
  buildContracts();
  buildConsumables();
  buildEnhance();
  buildProjects();
  buildSprints();
  buildLibraries();
  buildSpecializations();
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
  if (ul) {
    let label = '';
    if (ACCOUNT) {
      const p = ACCOUNT.profiles[ACCOUNT.activeProfile];
      label = p ? p.name : 'Character';
    } else {
      label = USER || 'Player';
    }
    if (isDev()) label += ' [DEV]';
    if (isSubActive()) label += ' [PRO]';
    ul.textContent = label;
  }

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
          const effectStr = Object.entries(gen).map(([r,a]) => fmt(a) + ' ' + (RES[r]?RES[r].n:r) + '/s').join(', ');
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
        el.querySelector('.node-cost').textContent = lvl >= 30 ? 'MAXED' : isCapped ? 'Cost: ' + cost + ' KP (cap reached)' : 'Cost: ' + cost + ' KP';
        // Update requirement display
        const req = nodeRequirement(b.id, n.id);
        const reqEl = el.querySelector('.node-req');
        if (req) {
          const reqNodeName = branchNodeCfg(b.id, req.node)?.name || req.node;
          const reqHave = branchLevel(b.id, req.node);
          const reqText = 'Requires: ' + reqNodeName + ' Lv.' + req.level + ' (have Lv.' + reqHave + ')';
          if (reqEl) {
            reqEl.textContent = reqText;
            reqEl.style.color = reqHave >= req.level ? '#0f0' : '#ff0';
          }
        }
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
      card.querySelector('.upgrade-cost').textContent = maxed?'MAXED':'Cost: '+Object.entries(cost).map(([r,a])=>(RES[r]?RES[r].n:r)+' '+fmt(a)).join(', ');
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
    const items = ITEM_LABELS ? Object.entries(ITEM_LABELS) : [['program','Scripts'],['hardware','Web Pages'],['exploit','Libraries'],['qProgram','Databases'],['qHardware','Games'],['qExploit','OS Modules'],['neuralLinks','Frameworks'],['turboChargers','APIs']];
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
  const pb = document.getElementById('prestige-btn'); if (pb) { pb.disabled = g < 1; pb.textContent = g < 1 ? 'MASTERY RESET (LOCKED)' : 'MASTERY RESET'; }
  const dr = document.getElementById('dm-required');
  if (dr) {
    const nextDm = (g + 1) * (g + 1) * 10;
    const have = G.prest.dm || 0;
    dr.textContent = have >= nextDm ? 'Ready!' : fmt(nextDm) + ' Mastery needed for next level (have ' + fmt(have) + ')';
  }

  // Transcend
  const tc = document.getElementById('transcend-btn');
  if (tc) {
    const can = canTranscend();
    tc.disabled = !can;
    tc.textContent = can ? 'ENLIGHTEN (pay '+transcendCost()+' levels)' : 'ENLIGHTEN (need '+(transcendCost()*2)+' levels, pay '+transcendCost()+')';
  }
  const tcl = document.getElementById('transcend-lvl');
  if (tcl) tcl.textContent = G.prest.transcendLvl;
  const tct = document.getElementById('transcend-times');
  if (tct) tct.textContent = G.prest.transcendTimes;
  const tcc = document.getElementById('transcend-cost');
  if (tcc) tcc.textContent = transcendCost();

  // Character switch button
  const csBtn = document.getElementById('char-switch-btn');
  if (csBtn) {
    if (ACCOUNT && ACCOUNT.profiles.length > 1) {
      csBtn.style.display = 'inline-block';
      csBtn.onclick = () => {
        saveProfile();
        const game = document.getElementById('game');
        if (game) game.style.display = 'none';
        showCharacterSelect();
      };
    } else {
      csBtn.style.display = 'none';
    }
  }

  // Subscription status (lightweight, safe every frame)
  const subStatus = document.getElementById('sub-status');
  if (subStatus) {
    subStatus.textContent = isSubActive() ? 'Code Journey Pro Active' : 'Free Tier';
    subStatus.style.color = isSubActive() ? '#0f0' : '#888';
  }
  const subBtn = document.getElementById('sub-cta-btn');
  if (subBtn) {
    subBtn.style.display = isSubActive() ? 'none' : 'inline-block';
  }

  // Combat pause warning (paused during combat)
  const cw = document.getElementById('combat-pause-warning');
  if (cw) cw.style.display = G.cmbt.inCombat ? 'block' : 'none';

  // Only rebuild tab content when the active tab changes (not every 60fps frame)
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (activeTab && activeTab !== G._lastActiveTab) {
    G._lastActiveTab = activeTab;
    if (activeTab === 'progression') { buildZones(); buildAchievements(); }
    if (activeTab === 'contracts') { buildContracts(); }
    if (activeTab === 'enhance') { buildConsumables(); buildEnhance(); }
    if (activeTab === 'crafting') { buildProjects(); buildSprints(); buildLibraries(); buildSpecializations(); }
    if (activeTab === 'skills') { buildSpecializations(); }
  }

  // Update active project progress bars every tick
  const pc = document.getElementById('projects-container');
  if (pc) {
    PROJECTS.forEach((p, i) => {
      const active = G._projects[p.id];
      const card = pc.children[i];
      if (!card) return;
      if (active && !active.done) {
        const pct = Math.max(0, Math.min(100, 100 - (active.timeLeft / p.duration) * 100));
        const fill = card.querySelector('.project-fill');
        const time = card.querySelector('.project-time');
        if (fill) fill.style.width = pct + '%';
        if (time) time.textContent = Math.ceil(active.timeLeft) + 's remaining';
      }
      if (active?.done) {
        const time = card.querySelector('.project-time');
        if (time) time.textContent = 'COMPLETE!';
        card.className = 'project-card done';
      }
    });
  }

  // Enemy ability indicator
  const eai = document.getElementById('enemy-ability-indicator');
  if (G.cmbt.inCombat && eai) {
    const ei = G.cmbt.idx;
    const ai = ENEMY_ABILITY_MAP[ei % ENEMY_ABILITY_MAP.length];
    const ab = ENEMY_ABILITIES[ai];
    const hpPct = G.cmbt.hp / ENEMIES[ei].hp;
    eai.style.display = 'block';
    eai.textContent = 'Ability: ' + ab.name + ' (' + Math.round(hpPct * 100) + '% HP - triggers at ' + Math.round(ab.hpThreshold * 100) + '%)';
    eai.style.color = hpPct <= ab.hpThreshold ? '#f44' : '#888';
  } else if (eai) {
    eai.style.display = 'none';
  }

  // Ad banner
  showAdBanner();

  // Knowledge visualizer
  updateVisualizer();

  // Road map
  updateRoadMap();
}

function rebuildUI() { buildUI(); }

// Login/Logout
function initLogin() {
  const input = document.getElementById('login-input');
  const passInput = document.getElementById('pass-input');
  const loginBtn = document.getElementById('login-btn');
  const googleBtn = document.getElementById('google-login-btn');
  const errEl = document.getElementById('login-error');
  const overlay = document.getElementById('login-overlay');
  const game = document.getElementById('game');

  async function doLogin() {
    try {
      const name = input.value.trim();
      const pass = passInput.value.trim();
      if (name.length < 2 || name.length > 20) { errEl.textContent='Username must be 2-20 characters'; errEl.style.display='block'; return; }
      if (pass.length < 4) { errEl.textContent='Password must be 4+ characters'; errEl.style.display='block'; return; }
      errEl.style.display='none';

      const pHash = await hashPassword(pass);

      // Try account-based load first
      if (loadAccount(name)) {
        const fProfile = ACCOUNT.profiles[0];
        if (fProfile) {
          loadProfile(fProfile.id);
        } else {
          G = freshState();
        }
        const storedPw = G && G._pw ? G._pw : '';
        if (storedPw.length === 64) {
          if (storedPw !== pHash) { errEl.textContent='Wrong password'; errEl.style.display='block'; ACCOUNT=null; G=null; return; }
        } else if (storedPw && storedPw !== pass) { errEl.textContent='Wrong password'; errEl.style.display='block'; ACCOUNT=null; G=null; return; }
        USER = name;
        G._pw = pHash;
        if (G._pw && G._pw.length !== 64) G._pw = pHash;
        saveProfile();
        saveAccount();
        overlay.style.display='none';
        showCharacterSelect();
        return;
      }

      // Legacy single-profile save
      const raw = localStorage.getItem('nri_'+name);
      if (raw) {
        let d;
        try { d = JSON.parse(raw); } catch(e) { d = null; }
        if (!d || typeof d !== 'object') {
          localStorage.removeItem('nri_'+name);
          G = freshState();
          G._pw = pHash;
          migrateLegacySave();
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
          toast('Welcome, '+USER+'! (corrupted save reset)', 'info');
          if (isDev()) toast('DEV MODE ACTIVE', 'loot');
          save();
          return;
        }
        const storedPw = d._pw || '';
        if (storedPw.length === 64) {
          if (storedPw !== pHash) { errEl.textContent='Wrong password'; errEl.style.display='block'; return; }
        } else if (storedPw && storedPw !== pass) { errEl.textContent='Wrong password'; errEl.style.display='block'; return; }
        if (!d._pw) { d._pw = pHash; toast('Password set for '+name, 'info'); }
        if (d._pw && d._pw.length !== 64) { d._pw = pHash; }

        // Migrate to multi-profile system
        USER = name;
        migrateLegacySave();
        overlay.style.display='none';
        showCharacterSelect();
        return;
      }

      // New user — create account
      G = freshState();
      G._pw = pHash;
      G._showTutorial = true;
      USER = name;
      createAccount(name, '', 'legacy');
      G._pw = pHash;
      saveProfile();
      saveAccount();
      localStorage.setItem('nr_user', USER);
      startGameAfterLogin();
    } catch(e) { err('Login: '+e.message); }
  }

  async function doGoogleLogin() {
    try {
      googleBtn.disabled = true;
      googleBtn.textContent = 'SIGNING IN...';
      if (typeof firebase === 'undefined' || !firebase.auth) {
        errEl.textContent='Firebase Auth not loaded. Try again.';
        errEl.style.display='block';
        googleBtn.disabled = false;
        googleBtn.textContent = 'SIGN IN WITH GOOGLE';
        return;
      }
      if (!firebase.apps.length) {
        initCloud();
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      if (!user) {
        errEl.textContent='Google sign-in failed.';
        errEl.style.display='block';
        googleBtn.disabled = false;
        googleBtn.textContent = 'SIGN IN WITH GOOGLE';
        return;
      }
      const uid = user.uid;
      const email = user.email || '';
      USER = uid;
      localStorage.setItem('nr_user', USER);

      if (loadAccount(uid)) {
        ACCOUNT.email = email;
        saveAccount();
        overlay.style.display='none';
        showCharacterSelect();
      } else {
        createAccount(uid, email, 'google');
        G = freshState();
        G._pw = uid;
        G._showTutorial = true;
        saveProfile();
        saveAccount();
        startGameAfterLogin();
      }
    } catch(e) {
      errEl.textContent='Google sign-in error: '+(e.message||'unknown');
      errEl.style.display='block';
      googleBtn.disabled = false;
      googleBtn.textContent = 'SIGN IN WITH GOOGLE';
    }
  }

  function startGameAfterLogin() {
    const overlay = document.getElementById('login-overlay');
    const game = document.getElementById('game');
    overlay.style.display='none';
    game.style.display='flex';
    buildUI();
    calcOfflineProgress();
    initCloud();
    syncCloud();
    updateUI();
    startLoop();
    const adC = document.getElementById('ad-container');
    if (adC) { adC.style.display = 'block'; loadBannerAd('ad-container'); }
    verifySubscription();
  }

  function showCharacterSelect() {
  const csOverlay = document.getElementById('character-select-overlay');
  const grid = document.getElementById('character-grid');
  const backBtn = document.getElementById('character-back-btn');
  csOverlay.style.display = 'flex';

  grid.innerHTML = '';
  ACCOUNT.profiles.forEach((p, i) => {
    const isActive = i === ACCOUNT.activeProfile;
    const hasSpec = p.spec !== null;
    const specData = hasSpec ? SPECIALIZATIONS.find(s => s.id === p.spec) : null;

    // Load profile state to read stats
    const profileRaw = localStorage.getItem(profileStateKey(p.id));
    let stats = { lvl:0, enemies:0, projects:0 };
    if (profileRaw) {
      try {
        const pd = JSON.parse(profileRaw);
        stats.lvl = pd.prest?.lvl || 0;
        stats.enemies = pd.stats?.enemiesDefeated || 0;
        stats.projects = pd._totalProjectsBuilt || 0;
      } catch(e) {}
    }

    const card = document.createElement('div');
    card.className = 'char-card';
    if (isActive) {
      card.style.borderColor = '#0f0';
    } else if (specData) {
      card.style.borderColor = specData.color;
      card.style.borderWidth = '2px';
    }

    const specName = specData ? specData.name : 'Unspecialized';
    const specColor = specData ? specData.color : '#666';
    const langDesc = specData && specData.langBonus
      ? Object.entries(specData.langBonus).map(([lid, mult]) => {
          const b = BRANCHES.find(x => x.id === lid);
          return (b ? b.name : lid) + ' ×' + mult;
        }).join(', ')
      : 'Pick a path to mastery';

    card.innerHTML = `
      <div class="char-name">${p.name}</div>
      <div class="char-spec" style="color:${specColor}">${specName}</div>
      <div style="font-size:9px;color:#888;margin-bottom:6px;">${langDesc}</div>
      <div class="char-stats">Level ${stats.lvl} · ${stats.enemies} bugs fixed · ${stats.projects} projects built</div>
      ${isActive ? '<div class="char-active-badge">▶ ACTIVE</div>' : ''}
    `;

    // For unspecialized characters, add a choose-path button
    if (!hasSpec) {
      const chooseDiv = document.createElement('div');
      chooseDiv.style.marginTop = '8px';
      chooseDiv.innerHTML = '<button class="spec-btn" style="font-size:9px;padding:2px 8px;">CHOOSE PATH</button>';
      chooseDiv.querySelector('.spec-btn').addEventListener('click', e => {
        e.stopPropagation();
        showSpecPicker(card, i);
      });
      card.appendChild(chooseDiv);
    }

    card.addEventListener('click', () => {
      switchProfile(i);
      csOverlay.style.display = 'none';
      const game = document.getElementById('game');
      game.style.display = 'flex';
      buildUI();
      calcOfflineProgress();
      updateUI();
      startLoop();
      const adC = document.getElementById('ad-container');
      if (adC) { adC.style.display = 'block'; loadBannerAd('ad-container'); }
      verifySubscription();
    });
    grid.appendChild(card);
  });

  backBtn.onclick = () => {
    saveProfile();
    csOverlay.style.display = 'none';
    const loginOverlay = document.getElementById('login-overlay');
    loginOverlay.style.display = 'flex';
    USER = null;
    G = null;
    _loopStarted = false;
  };

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    saveProfile();
    csOverlay.style.display = 'none';
    const loginOverlay = document.getElementById('login-overlay');
    loginOverlay.style.display = 'flex';
    USER = null;
    G = null;
    _loopStarted = false;
  });
}

function logout() {
  save();
  try { localStorage.removeItem('nr_user'); } catch(e) {}
  const game = document.getElementById('game');
  const loginOverlay = document.getElementById('login-overlay');
  const csOverlay = document.getElementById('character-select-overlay');
  if (game) game.style.display = 'none';
  if (csOverlay) csOverlay.style.display = 'none';
  if (loginOverlay) loginOverlay.style.display = 'flex';
  document.getElementById('login-input').value = '';
  document.getElementById('login-input').focus();
  USER = null;
  G = null;
  ACCOUNT = null;
  _loopStarted = false;
  toast('Logged out', 'info');
}
        const storedPw = d._pw || '';
        if (storedPw.length === 64) {
          if (storedPw !== pHash) { errEl.textContent='Wrong password'; errEl.style.display='block'; return; }
        } else if (storedPw && storedPw !== pass) { errEl.textContent='Wrong password'; errEl.style.display='block'; return; }
        if (!d._pw) { d._pw = pHash; toast('Password set for '+name, 'info'); }
        if (d._pw && d._pw.length !== 64) { d._pw = pHash; } // migrate old plaintext
        G = Object.assign(freshState(), d);
        migrateState(G);
        while (G.upgs.length < UPGRADES.length) G.upgs.push({ id:UPGRADES[G.upgs.length].id, lvl:0 });
        while (G.zones.length < ZONES.length) G.zones.push({ id:ZONES[G.zones.length].id, unlocked:false });
        while (G.achievements.length < ACHIEVEMENTS.length) G.achievements.push({ id:ACHIEVEMENTS[G.achievements.length].id, unlocked:false });
      } else {
        G = freshState();
        G._pw = pHash;
        G._showTutorial = true;
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
      const adC = document.getElementById('ad-container');
      if (adC) { adC.style.display = 'block'; loadBannerAd('ad-container'); }
      verifySubscription();
      toast('Welcome, '+USER+'!', 'info');
      if (G._showTutorial) {
        G._showTutorial = false;
        setTimeout(() => showTutorial(), 500);
      }
      if (isDev()) toast('DEV MODE ACTIVE', 'loot');
      trackEvent('login', { username: USER });
      save();
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
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.classList.add('active');
  const devPanel = document.getElementById('dev-panel');
  if (devPanel) {
    devPanel.style.display = tabName === 'skills' && isDev() ? 'block' : 'none';
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
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
            branchAffordable = { label: 'Level ' + n.name, extra: cost + ' KP → ' + b.name, ready: true, b: b.id, n: n.id };
          }
        } else if (!branchAction) {
          branchAction = { label: 'Level ' + n.name, extra: cost + ' KP → ' + b.name, ready: false };
        }
      }
    });
  });
  if (branchAffordable) ms.push(branchAffordable);
  else if (branchAction) ms.push(branchAction);
  else ms.push({ label: 'All concepts learned!', extra: 'Great work, coder', ready: false });

  // 2. Combat / project / library
  // Check if there's an unstarted affordable project
  let projectAffordable = null;
  PROJECTS.forEach(p => {
    if (G._projects[p.id]?.done) return;
    if (G._projects[p.id]) return;
    if (G.neuralPoints >= p.kpCost) {
      if (!projectAffordable || p.kpCost < projectAffordable.cost) {
        projectAffordable = { label: 'Build ' + p.name, extra: p.kpCost + ' KP → ' + Object.values(p.bonus)[0], ready: true, cost: p.kpCost };
      }
    }
  });
  if (projectAffordable) ms.push(projectAffordable);
  else {
    // Check combat progress
    if (!G.cmbt.unlocked) {
      const npNeeded = Math.max(0, 25 - Math.floor(G.neuralPoints));
      ms.push({ label: 'Unlock DEBUG', extra: 'Need ' + npNeeded + ' KP', ready: G.neuralPoints >= 25 });
    } else {
      const zi = ZONES.slice().reverse().findIndex(z => !G.zones[ZONES.indexOf(z)].unlocked);
      if (zi !== -1) {
        const z = ZONES[ZONES.length - 1 - zi];
        const d = Math.max(0, z.reqDefeated - (G.stats.enemiesDefeated || 0));
        ms.push({ label: 'Unlock ' + z.name, extra: 'Fix ' + d + ' more bugs', ready: (G.stats.enemiesDefeated || 0) >= z.reqDefeated });
      } else {
        // Suggest a library upgrade
        let libAffordable = null;
        LIBRARIES.forEach(lib => {
          const lvl = G._libraries[lib.id] || 0;
          if (lvl >= lib.max) return;
          const cost = {};
          Object.entries(lib.baseCost).forEach(([r,a]) => { cost[r] = Math.floor(a * Math.pow(lib.mult, lvl)); });
          if (canPay(cost)) {
            if (!libAffordable || lvl < (G._libraries[libAffordable.id] || 0)) {
              libAffordable = { label: 'Upgrade ' + lib.name, extra: 'Lv.' + (lvl+1), ready: true, id: lib.id };
            }
          }
        });
        if (libAffordable) ms.push(libAffordable);
        else ms.push({ label: 'All zones unlocked!', extra: 'Enlighten to grow', ready: false });
      }
    }
  }

  // 3. Specialization / Sprint / Prestige
  if (!G._specialization) {
    ms.push({ label: 'Choose Specialization', extra: 'Python/Web/Systems/Go', ready: true });
  } else {
    const s = getActiveSprint();
    if (s && canPay(s.req)) {
      ms.push({ label: 'Complete Sprint', extra: s.desc, ready: true });
    } else {
      const pg = prestigeGain();
      if (pg < 1) {
        const d = Math.max(0, 10 - (G.prest.dm || 0));
        ms.push({ label: 'MASTERY RESET', extra: fmt(d) + ' Mastery needed', ready: pg >= 1 });
      } else {
        ms.push({ label: 'MASTERY READY!', extra: '+' + pg + ' levels', ready: true });
      }
    }
  }

  return ms.slice(0, 3);
}

function fmtBonus(k, v) {
  const labels = { dataMult:'XP x'+v, creditsMult:'LOC x'+v, cpuMult:'Proc x'+v, bwMult:'Insight x'+v, allMult:'All x'+v };
  return labels[k] || k+':'+v;
}

// ===== KNOWLEDGE VISUALIZER =====
let _visAnimId = null;
let _visNodes = [];
let _visEdges = [];

function updateVisualizer() {
  const visDiv = document.getElementById('knowledge-visualizer');
  if (!visDiv) return;

  let totalLevels = 0;
  BRANCHES.forEach(b => {
    b.nodes.forEach(n => { totalLevels += branchLevel(b.id, n.id); });
  });

  if (totalLevels < VISUALIZER_UNLOCK_THRESHOLD) {
    visDiv.style.display = 'none';
    if (_visAnimId) { cancelAnimationFrame(_visAnimId); _visAnimId = null; }
    return;
  }

  visDiv.style.display = 'block';
  if (_visAnimId) return; // already running

  const canvas = document.getElementById('vis-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Count total learned nodes for circle layout
  let nodeCount = 0;
  BRANCHES.forEach(b => { b.nodes.forEach(n => { if (branchLevel(b.id, n.id) > 0) nodeCount++; }); });
  _visNodes = [];
  _visEdges = [];
  let nodeIdx = 0;
  BRANCHES.forEach(b => {
    let prev = null;
    b.nodes.forEach(n => {
      const lvl = branchLevel(b.id, n.id);
      if (lvl > 0) {
        const angle = (nodeIdx / Math.max(1, nodeCount)) * Math.PI * 2;
        const radius = Math.min(W, H) * 0.35;
        const node = { name:n.name, branch:b.name, color:b.color, lvl, x:W/2+Math.cos(angle)*radius, y:H/2+Math.sin(angle)*radius, vx:0, vy:0, r:8+lvl*1.5 };
        _visNodes.push(node); nodeIdx++;
        if (prev) _visEdges.push({ from:prev, to:node, color:b.color });
        prev = node;
      }
    });
  });
  // Cross-language connections
  for (let i = 0; i < _visNodes.length; i++)
    for (let j = i+1; j < _visNodes.length; j++)
      if (_visNodes[i].branch !== _visNodes[j].branch)
        _visEdges.push({ from:_visNodes[i], to:_visNodes[j], color:'rgba(255,255,255,0.12)' });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    _visAnimId = null;
    return;
  }

  function step() {
    if (visDiv.style.display === 'none') { _visAnimId = null; return; }
    const rep = 5000, att = 0.01, damp = 0.9;
    for (const a of _visNodes) {
      a.vx *= damp; a.vy *= damp;
      for (const b of _visNodes) {
        if (a === b) continue;
        let dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx*dx+dy*dy)||1;
        const f = rep/(dist*dist)*0.01;
        a.vx += dx/dist*f; a.vy += dy/dist*f;
      }
      for (const e of _visEdges) {
        if (e.from === a) { a.vx += (e.to.x-a.x)*att; a.vy += (e.to.y-a.y)*att; }
        if (e.to === a) { a.vx += (e.from.x-a.x)*att; a.vy += (e.from.y-a.y)*att; }
      }
      const m = 40;
      if (a.x < m) a.vx += 1; if (a.x > W-m) a.vx -= 1;
      if (a.y < m) a.vy += 1; if (a.y > H-m) a.vy -= 1;
      a.x += a.vx; a.y += a.vy;
    }
    ctx.clearRect(0,0,W,H);
    for (const e of _visEdges) { ctx.beginPath(); ctx.moveTo(e.from.x,e.from.y); ctx.lineTo(e.to.x,e.to.y); ctx.strokeStyle=e.color; ctx.lineWidth=1; ctx.stroke(); }
    const t = Date.now()/1000;
    for (const n of _visNodes) {
      const p = 1 + Math.sin(t*2+_visNodes.indexOf(n))*0.1;
      const r = n.r*p;
      const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*3);
      g.addColorStop(0,n.color+'66'); g.addColorStop(1,n.color+'00');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,n.y,r*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=n.color; ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='10px Courier New'; ctx.textAlign='center'; ctx.fillText(n.name+' Lv.'+n.lvl,n.x,n.y+r+12);
    }
    _visAnimId = requestAnimationFrame(step);
  }
  _visAnimId = requestAnimationFrame(step);
}

// ===== ONBOARDING TUTORIAL =====
const TUTORIAL_STEPS = [
  { title: 'WELCOME TO CODE JOURNEY', msg: 'Learn programming languages, build projects, fix bugs, and level up your skills. Everything starts with Knowledge Points (KP).' },
  { title: 'LEARN CONCEPTS', msg: 'Click the LEARN tab. Spend KP to learn language concepts like Variables, Functions, and Classes. Each level gives you resources.' },
  { title: 'BUILD PROJECTS', msg: 'In the BUILD tab, turn XP and LOC into projects. Complete daily sprints for bonus rewards.' },
  { title: 'FIX BUGS', msg: 'Once you have 25 KP, the DEBUG tab unlocks. Fight bugs to earn Mastery and rare item drops.' },
  { title: 'MASTERY RESET', msg: 'When you have enough Mastery, reset for permanent power. Each level gives 1.5x to everything!' },
];

function showTutorial() {
  let step = 0;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#0a0a1a;border:2px solid #0f0;border-radius:12px;padding:32px;max-width:480px;width:90%;text-align:center;">
      <div id="tut-title" style="color:#0ff;font-size:16px;letter-spacing:2px;margin-bottom:12px;"></div>
      <div id="tut-msg" style="color:#c0c0c0;font-size:13px;line-height:1.5;margin-bottom:20px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="tut-counter" style="color:#666;font-size:11px;"></span>
        <button id="tut-next" style="padding:8px 24px;background:transparent;border:2px solid #0f0;color:#0f0;font-family:inherit;font-size:13px;cursor:pointer;border-radius:4px;">NEXT</button>
      </div>
      <div style="margin-top:12px;"><button id="tut-skip" style="background:transparent;border:none;color:#888;font-size:11px;cursor:pointer;padding:4px;">Skip tutorial</button></div>
    </div>
  `;
  document.body.appendChild(overlay);

  function render() {
    const t = TUTORIAL_STEPS[step];
    document.getElementById('tut-title').textContent = t.title;
    document.getElementById('tut-msg').textContent = t.msg;
    document.getElementById('tut-counter').textContent = (step+1) + '/' + TUTORIAL_STEPS.length;
    document.getElementById('tut-next').textContent = step < TUTORIAL_STEPS.length - 1 ? 'NEXT' : 'START CODING';
  }

  document.getElementById('tut-next').addEventListener('click', () => {
    step++;
    if (step >= TUTORIAL_STEPS.length) { overlay.remove(); }
    else { render(); }
  });
  document.getElementById('tut-skip').addEventListener('click', () => overlay.remove());

  render();
}
