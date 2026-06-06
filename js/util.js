function fmt(n) { if (!n||isNaN(n)) return '0'; if (n>=1e9) return (n/1e9).toFixed(1)+'B'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return Math.floor(n)+''; }

function xpReq(lvl) { return Math.floor(lvl * 80 * Math.pow(1.12, lvl - 1)); }

function skillCfg(id) { return SKILLS.find(s => s.id === id); }
function skillSt(id) { return G.skills.find(s => s.id === id); }
function upgSt(id) { return G.upgs.find(u => u.id === id); }
function upgCfg(id) { return UPGRADES.find(u => u.id === id); }
function zoneCfg(id) { return ZONES.find(z => z.id === id); }
function enemyCfg(idx) { return ENEMIES[idx]; }

function specBonus(type) {
  let m = 1;
  if (!G || !G.specializations) return m;
  G.specializations.forEach(sp => {
    if (!sp.purchased) return;
    const cfg = SPECIALIZATIONS.find(s => s.id === sp.id);
    if (!cfg || !cfg.effect) return;
    if (cfg.effect[type]) m *= cfg.effect[type];
  });
  return m;
}

function skillMult(id) {
  const map = { dataMining:'miningSpeed', packetSniffing:'sniffingSpeed', cryptoMining:'cryptoSpeed', networkScouting:'scoutSpeed' };
  let m = 1 + (upgSt(map[id])?.lvl || 0) * 0.2;
  m *= Math.pow(1.5, G.prest.lvl);
  m *= 1 + (G.inv.neuralLinks || 0) * 0.02;
  m *= getBonus('speedMult');
  m *= specBonus(id+'Mult');
  if (isSubActive()) m *= 1.25;
  return m;
}

function skillYield(id) {
  const c = skillCfg(id), s = skillSt(id);
  let base = c.yield * (1 + (s.lvl-1)*0.08) * skillMult(id);
  base *= specBonus('allProdMult');
  return base;
}

function skillTime(id) {
  const c = skillCfg(id), s = skillSt(id);
  let t = c.time * Math.pow(0.97, s.lvl-1);
  t *= specBonus('globalSpeed');
  return Math.max(0.25, t);
}

function cmbtPow() {
  let a = G.cmbt.atk + G.inv.exploit*8 + G.inv.program*2 + (G.inv.turboChargers||0)*5 + (G.inv.qProgram||0)*25 + (G.inv.qExploit||0)*150;
  let d = G.cmbt.def + G.inv.hardware*3 + (G.inv.turboChargers||0)*3 + (G.inv.qHardware||0)*10;
  const b = upgSt('combatBoost');
  a = Math.floor(a * (1 + b.lvl*0.15) * getBonus('atkMult'));
  d = Math.floor(d * getBonus('defMult'));
  return { a, d };
}

function maxData() { return 500 * Math.pow(2, upgSt('dataCap')?.lvl||0) * getBonus('capMult'); }
function maxCpu() { return 200 * Math.pow(2, upgSt('cpuCap')?.lvl||0) * getBonus('capMult'); }
function maxBw() { return 100 * Math.pow(2, upgSt('bwCap')?.lvl||0) * getBonus('capMult'); }
function maxCredits() { return 2000 * Math.pow(2, upgSt('creditCap')?.lvl||0) * getBonus('capMult'); }
function maxDm() { return 10 * Math.pow(2, upgSt('dmCap')?.lvl||0) * getBonus('capMult'); }

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
  (G.achievements||[]).forEach(a => {
    if (!a.unlocked) return;
    const cfg = ACHIEVEMENTS.find(x => x.id === a.id);
    if (!cfg || !cfg.reward) return;
    if (cfg.reward[type]) m *= cfg.reward[type];
  });
  m *= zoneBonus(type);
  m *= specBonus(type);
  if (type === 'prestMult' && G.prest.lvl > 0) m *= Math.pow(1.15, G.prest.lvl);
  if (type === 'transcendMult' && G.prest.transcendLvl > 0) m *= Math.pow(2, G.prest.transcendLvl);
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

function maxActiveSkills() {
  return isSubActive() ? 4 : 2;
}
