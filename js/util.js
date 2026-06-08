function fmt(n) { if (!n||isNaN(n)) return '0'; if (n>=1e9) return (n/1e9).toFixed(1)+'B'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return Math.floor(n)+''; }

function upgSt(id) { return G.upgs.find(u => u.id === id); }
function upgCfg(id) { return UPGRADES.find(u => u.id === id); }
function zoneCfg(id) { return ZONES.find(z => z.id === id); }
function enemyCfg(idx) { return ENEMIES[idx]; }

// Branch tree helpers
function branchCfg(id) { return BRANCHES.find(b => b.id === id); }
function branchNodeCfg(branchId, nodeId) { const b = branchCfg(branchId); if (!b) return null; return b.nodes.find(n => n.id === nodeId) || null; }
function branchLevel(branchId, nodeId) { return (G.branches[branchId] || {})[nodeId] || 0; }
function branchCost(branchId, nodeId) { const n = branchNodeCfg(branchId, nodeId); if (!n) return 1; return Math.floor(n.baseCost * Math.pow(1.15, branchLevel(branchId, nodeId))); }
function nodeRequirement(branchId, nodeId) {
  const b = branchCfg(branchId); if (!b) return null;
  const idx = b.nodes.findIndex(n => n.id === nodeId);
  if (idx <= 0) return null;
  return { node: b.nodes[idx-1].id, level: b.nodes[idx].reqLvl };
}
function branchNodeUnlocked(branchId, nodeId) {
  const req = nodeRequirement(branchId, nodeId);
  if (!req) return true;
  return branchLevel(branchId, req.node) >= req.level;
}

// Branch bonuses
function branchAtkBonus() { return branchLevel('combat','icePick') * 3; }
function branchHpBonus() { return branchLevel('combat','shieldWall') * 8; }
function branchAtkPct() { return 1 + branchLevel('combat','overdrive') * 0.05; }
function branchBurstDmg() { return branchLevel('combat','systemBreach') * 15; }
function branchCapMult() { return 1 + branchLevel('efficiency','resourceOpt') * 0.1; }
function branchCostRed() { return Math.min(0.6, branchLevel('efficiency','costReduction') * 0.03); }
function branchProdMult() { return 1 + branchLevel('efficiency','perfectLoop') * 0.03; }
function branchNpRate() { return 1 + branchLevel('efficiency','quickHands') * 0.05; }

function upgradeGenMult(res) {
  const map = { data:'miningSpeed', credits:'sniffingSpeed', cpu:'cryptoSpeed', bandwidth:'scoutSpeed' };
  const id = map[res];
  if (!id) return 1;
  const u = upgSt(id);
  return u ? 1 + u.lvl * 0.2 : 1;
}

function getSpec() {
  if (!G._specialization) return null;
  return SPECIALIZATIONS.find(x => x.id === G._specialization) || null;
}

function getLangBonus(branchId) {
  const spec = getSpec();
  if (!spec || !spec.langBonus) return 1;
  return spec.langBonus[branchId] || 1;
}

function getSpecProjectSpeed() {
  const spec = getSpec();
  if (!spec || !spec.bonus) return 1;
  return spec.bonus.projectSpeed || 1;
}

function hasSpecAutoAction() {
  const spec = getSpec();
  return spec && spec.bonus && spec.bonus.autoAction === true;
}

function cmbtPow() {
  let a = G.cmbt.atk + branchAtkBonus() + G.inv.exploit*8 + G.inv.program*2 + (G.inv.turboChargers||0)*5 + (G.inv.qProgram||0)*25 + (G.inv.qExploit||0)*150 + getEnhanceBonus('exploit') + getEnhanceBonus('program');
  let d = G.cmbt.def + G.inv.hardware*3 + (G.inv.turboChargers||0)*3 + (G.inv.qHardware||0)*10 + getEnhanceBonus('hardware');
  const b = upgSt('combatBoost');
  a = Math.floor(a * (1 + b.lvl*0.15) * getBonus('atkMult') * branchAtkPct());
  d = Math.floor(d * getBonus('defMult'));
  return { a, d };
}

function maxData() { return 500 * Math.pow(2, upgSt('dataCap')?.lvl||0) * getBonus('capMult') * branchCapMult(); }
function maxCpu() { return 200 * Math.pow(2, upgSt('cpuCap')?.lvl||0) * getBonus('capMult') * branchCapMult(); }
function maxBw() { return 100 * Math.pow(2, upgSt('bwCap')?.lvl||0) * getBonus('capMult') * branchCapMult(); }
function maxCredits() { return 2000 * Math.pow(2, upgSt('creditCap')?.lvl||0) * getBonus('capMult') * branchCapMult(); }
function maxDm() { return 10 * Math.pow(2, upgSt('dmCap')?.lvl||0) * getBonus('capMult') * branchCapMult(); }

function resMax(id) {
  const map = { data:maxData, cpu:maxCpu, bandwidth:maxBw, credits:maxCredits, darkMatter:maxDm };
  return (map[id]||(()=>1/0))();
}

function addRes(id, amt) {
  if (amt <= 0) return;
  const max = resMax(id);
  G.res[id] = Math.min((G.res[id]||0) + amt, max);
  G.stats.earned[id] = (G.stats.earned[id]||0) + amt;
}

function canPay(cost) { if (!cost) return true; return Object.entries(cost).every(([r,a])=>(G.res[r]||0)>=a); }
function pay(cost) { if (!cost) return true; if (!canPay(cost)) return false; Object.entries(cost).forEach(([r,a])=>G.res[r]-=a); return true; }

function zoneBonus(type) {
  let m = 1;
  (G.zones||[]).forEach(z => {
    if (!z.unlocked) return;
    const cfg = zoneCfg(z.id);
    if (!cfg || !cfg.bonuses) return;
    Object.entries(cfg.bonuses).forEach(([k,v]) => {
      if (k === 'allMult') m *= v;
    });
    if (cfg.bonuses[type]) m *= cfg.bonuses[type];
  });
  return m;
}

function getBonus(type) {
  let m = 1;
  // Achievement bonuses (with achMult from spec support)
  let achMult = 1;
  const specA = getSpec();
  if (specA && specA.bonus && specA.bonus.achMult) achMult = specA.bonus.achMult;
  (G.achievements||[]).forEach(a => {
    if (!a.unlocked) return;
    const cfg = ACHIEVEMENTS.find(x => x.id === a.id);
    if (!cfg || !cfg.reward) return;
    if (cfg.reward[type]) {
      if (achMult > 1) m *= Math.pow(cfg.reward[type], achMult);
      else m *= cfg.reward[type];
    }
  });
  m *= zoneBonus(type);
  // Project bonuses
  if (G._projectBonuses && G._projectBonuses[type]) m *= G._projectBonuses[type];
  // Library bonuses
  if (G._libraries) {
    LIBRARIES.forEach(lib => {
      const lvl = G._libraries[lib.id] || 0;
      if (lvl > 0) {
        const bon = lib.bonus(lvl);
        if (bon[type]) m *= bon[type];
      }
    });
  }
  // Specialization bonuses
  const spec = getSpec();
  if (spec && spec.bonus && spec.bonus[type]) m *= spec.bonus[type];
  if (type === 'prestMult' && G.prest.lvl > 0) m *= Math.pow(1.15, G.prest.lvl);
  if (type === 'transcendMult' && G.prest.transcendLvl > 0) m *= Math.pow(2, G.prest.transcendLvl);
  if (type === 'atkMult' && hasConsumableEffect('energyDrink')) m *= getAtkMult();
  if (type === 'defMult' && hasConsumableEffect('focusPills')) m *= getDefMult();
  if (type === 'prodMult' && hasConsumableEffect('deepWork')) m *= getProdMult();
  if (type === 'npRate') {
    if (spec && spec.bonus && spec.bonus.npRate) m *= spec.bonus.npRate;
  }
  return m;
}

function toast(msg, t='info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'toast toast-'+t; el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { try { if (el.parentNode) el.remove(); } catch(e) {} }, 3000);
}

function err(msg) {
  const eb = document.getElementById('error-bar');
  if (eb) { eb.style.display='block'; eb.textContent += '['+new Date().toLocaleTimeString()+'] '+msg+'\n'; }
}

function prestigeGain() {
  const d = G.prest.dm || 0;
  return d < 10 ? 0 : Math.floor(Math.pow(d / 10, 0.5));
}

function transcendCost() {
  return 3 + G.prest.transcendTimes;
}

function canTranscend() {
  return G.prest.lvl >= transcendCost() * 2;
}

function isSubActive() {
  return G._subActive === true;
}

async function hashPassword(pass) {
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function showFloatingText(text, color) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;z-index:9999;pointer-events:none;font-size:16px;font-weight:bold;color:${color};text-shadow:0 0 6px ${color};font-family:inherit;left:50%;top:50%;transform:translate(-50%,-50%);transition:all 0.8s ease-out;`;
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.top = '30%';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 900);
}

function flashResource(type) {
  const el = document.querySelector(`.res-${type}`);
  if (!el) return;
  el.style.transition = 'background 0.3s';
  el.style.background = 'rgba(0,255,65,0.2)';
  setTimeout(() => { el.style.background = 'transparent'; }, 300);
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = 'sine';
    g.gain.value = 0.05;
    o.start();
    o.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

function spawnParticles(x, y, color) {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const pts = Array.from({length:12}, () => ({
    x, y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6-3,
    life: 1, size: 2+Math.random()*3,
  }));
  function anim() {
    ctx.clearRect(0,0,c.width,c.height);
    let alive = false;
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1;
      p.life -= 0.03;
      if (p.life > 0) {
        alive = true;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
    });
    if (alive) requestAnimationFrame(anim);
    else c.remove();
  }
  anim();
}

function activityFeedback(text, color, resType) {
  showFloatingText(text, color);
  if (resType) flashResource(resType);
  spawnParticles(window.innerWidth/2, window.innerHeight/2, color);
  playBeep();
}
