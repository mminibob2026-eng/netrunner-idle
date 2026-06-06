let _loopStarted = false;
let _eventCheckAcc = 0;

function tick(dt) {
  const speed = getEffectiveSpeed();
  const sdt = dt * speed;

  // Generate Neural Points (0.5 base per second, scaled by branch + sub bonus)
  const npRate = 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1) * speed;
  G.neuralPoints += npRate * dt;

  // Process Data Stream branch - resource generation
  const dataBranch = BRANCHES.find(b => b.id === 'data');
  if (dataBranch) {
    const prodMult = branchProdMult();
    dataBranch.nodes.forEach(n => {
      const lvl = branchLevel('data', n.id);
      if (lvl < 1) return;
      const gen = n.gen(lvl);
      Object.entries(gen).forEach(([res, amt]) => {
        addRes(res, amt * sdt * prodMult);
      });
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

  // Mini-game event check (once per 30s, only after 24h cooldown)
  _eventCheckAcc += dt;
  if (_eventCheckAcc >= 30) {
    _eventCheckAcc = 0;
    checkMiniGameEvent();
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
