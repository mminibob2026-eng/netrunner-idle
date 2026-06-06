let _loopStarted = false;

function tick(dt) {
  const speed = getEffectiveSpeed();
  const sdt = dt * speed;

  // Skills (paused during combat)
  if (!G.cmbt.inCombat) {
    G.skills.forEach((s, i) => {
      if (!s.unlocked || !s.active) return;
      const maxActive = maxActiveSkills();
      if (G.skills.filter(x => x.active).indexOf(s) >= maxActive) return;
      const c = SKILLS[i];
      const t = skillTime(c.id);
      s.prog += sdt / t;
      while (s.prog >= 1) {
        s.prog -= 1;
        if (c.res === 'all') {
          addRes('data', 2 * (1 + (s.lvl-1)*0.1));
          addRes('credits', 2 * (1 + (s.lvl-1)*0.1));
          addRes('cpu', 1 * (1 + (s.lvl-1)*0.1));
          addRes('bandwidth', 0.5 * (1 + (s.lvl-1)*0.1));
        } else {
          addRes(c.res, skillYield(c.id));
        }
        const xp = c.xp * (1 + (s.lvl-1)*0.04);
        s.xp += xp;
        const req = xpReq(s.lvl);
        while (s.xp >= req && s.lvl < 99) { s.xp -= req; s.lvl++; }
      }
    });
  }

  // Auto-combat (sub feature)
  if (G.cmbt.unlocked && G.cmbt.inCombat && isSubActive()) {
    G.cmbt.accum += sdt;
    if (G.cmbt.accum >= 2) {
      G.cmbt.accum -= 2;
      combatAttack();
    }
  } else if (G.cmbt.unlocked && G.cmbt.inCombat) {
    // Free tier: slower auto, or none
    G.cmbt.accum += sdt;
    if (G.cmbt.accum >= 3) {
      G.cmbt.accum -= 3;
      combatAttack();
    }
  }

  // Auto-craft (sub feature)
  if (isSubActive() && G._autoCraft) {
    const craftCfg = CRAFTS.find(c => c.id === G._autoCraft);
    if (craftCfg && canPay(craftCfg.cost)) {
      clickCraft(craftCfg.id);
    }
  }
}

function startLoop() {
  if (_loopStarted) return;
  _loopStarted = true;
  let prev = performance.now(), acc = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    if (!G) return;
    try {
      const dt = Math.min((now-prev)/1000, 2);
      prev = now;
      if (dt > 0) { tick(dt); updateUI(); }
      acc += dt;
      if (acc >= 5) { acc = 0; save(); }
    } catch(e) { err('Loop: '+e.message+'\n'+e.stack); }
  }
  requestAnimationFrame(loop);
  window.addEventListener('beforeunload', save);
}

// Prestige button
document.getElementById('prestige-btn')?.addEventListener('click', doPrestige);
document.getElementById('transcend-btn')?.addEventListener('click', doTranscend);
document.getElementById('sub-cta-btn')?.addEventListener('click', showSubscribeUI);

// Global error handler
window.onerror = function(msg, url, line) { err(msg+' (line '+line+')'); return false; };

initAnalytics();
initLogin();
