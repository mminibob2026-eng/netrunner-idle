let _loopStarted = false;

// Auto-perform the cheapest available action — used by Web Expert spec
function performCheapestAction() {
  if (!G || !G._specialization) return;

  // 1. Try to learn the cheapest affordable concept
  let best = null, bestCost = Infinity;
  BRANCHES.forEach(b => {
    b.nodes.forEach(n => {
      const lvl = branchLevel(b.id, n.id);
      if (lvl >= 30) return;
      if (!branchNodeUnlocked(b.id, n.id)) return;
      const cost = branchCost(b.id, n.id);
      if (G.neuralPoints >= cost && cost < bestCost) {
        bestCost = cost;
        best = () => clickBranchNode(b.id, n.id);
      }
    });
  });
  if (best) { best(); return; }

  // 2. Try to craft the cheapest affordable item
  let craftBest = null, craftBestCost = Infinity;
  CRAFTS.forEach(c => {
    if (c.refine) return; // skip refine actions
    const cr = branchCostRed();
    let total = 0;
    Object.entries(c.cost).forEach(([r,a]) => {
      const costV = Math.floor(a * (1 - cr));
      total += costV;
    });
    if (canPay(c.cost) && total < craftBestCost) {
      craftBestCost = total;
      craftBest = () => clickCraft(c.id);
    }
  });
  if (craftBest) { craftBest(); return; }

  // 3. Try to buy the cheapest upgrade
  let upgBest = null, upgBestCost = Infinity;
  UPGRADES.forEach(cfg => {
    const u = upgSt(cfg.id);
    if (!u || u.lvl >= cfg.max) return;
    const cr = branchCostRed();
    const cost = {};
    let total = 0;
    Object.entries(cfg.cost).forEach(([r,a]) => {
      const cv = Math.floor(a * (1 - cr) * Math.pow(cfg.mult, u.lvl));
      cost[r] = cv;
      total += cv;
    });
    if (canPay(cost) && total < upgBestCost) {
      upgBestCost = total;
      upgBest = () => clickUpgrade(cfg.id);
    }
  });
  if (upgBest) { upgBest(); return; }
}

function tick(dt) {
  const speed = getEffectiveSpeed();
  const sdt = dt * speed;

  // Generate Knowledge Points (0.5 base per second, scaled by branch + sub bonus)
  const npRate = 0.5 * branchNpRate() * (isSubActive() ? 1.5 : 1) * speed;
  G.neuralPoints += npRate * dt;

  // Combat unlock notification
  if (!G.cmbt.unlocked && G.neuralPoints >= 25) {
    G.cmbt.unlocked = true;
    toast('DEBUG UNLOCKED! Fix bugs to earn rewards.', 'loot');
    activityFeedback('DEBUG UNLOCKED!', '#0f0', 'np');
  }

  // Track resource earnings for quests
  const dataBefore = G.res.data || 0;
  const creditsBefore = G.res.credits || 0;

  // Process all language concepts - resource generation
  const prodMult = branchProdMult() * getProdMult();
  BRANCHES.forEach(branch => {
    const langMult = getLangBonus(branch.id);
    branch.nodes.forEach(n => {
      const lvl = branchLevel(branch.id, n.id);
      if (lvl < 1) return;
      if (!n.gen) return;
      const gen = n.gen(lvl);
      Object.entries(gen).forEach(([res, amt]) => {
        const upgMult = upgradeGenMult(res);
        addRes(res, amt * sdt * prodMult * upgMult * langMult);
      });
    });
  });

  // Track quest progress for resources earned this tick
  const dataGained = (G.res.data || 0) - dataBefore;
  const creditsGained = (G.res.credits || 0) - creditsBefore;
  if (dataGained > 0) trackQuestProgress('data', dataGained);
  if (creditsGained > 0) trackQuestProgress('credits', creditsGained);

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

  // Enemy ability proc
  if (G.cmbt.inCombat) {
    procEnemyAbility();
  }

  // Auto-action for Web Expert spec (auto-performs cheapest available action every 5s)
  if (hasSpecAutoAction() && !G._autoActionAccum) G._autoActionAccum = 0;
  if (hasSpecAutoAction()) {
    G._autoActionAccum += dt;
    if (G._autoActionAccum >= 5) {
      G._autoActionAccum = 0;
      performCheapestAction();
    }
  }

  // Auto-craft (free: 10s interval, sub: every tick)
  if (G._autoCraft) {
    if (!G._autoCraftAccum) G._autoCraftAccum = 0;
    G._autoCraftAccum += dt;
    const interval = isSubActive() ? 0.5 : 10;
    if (G._autoCraftAccum >= interval) {
      G._autoCraftAccum = 0;
      const craftCfg = CRAFTS.find(c => c.id === G._autoCraft);
      if (craftCfg && canPay(craftCfg.cost)) {
        clickCraft(craftCfg.id);
      }
    }
  }

  // Mini-game event trigger (after combat win, with random 5-96h cooldown)
  if (G._pendingMiniGameEvent && !document.getElementById('minigame-event-modal')?.classList.contains('visible')) {
    triggerMiniGameAfterCombat();
  }

  // Process active projects
  tickProjects(dt);
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

// Handle Stripe checkout redirect
if (window.location.search.includes('checkout_success=1')) {
  const url = new URL(window.location);
  url.searchParams.delete('checkout_success');
  window.history.replaceState({}, '', url);
  setTimeout(() => {
    if (USER && G) {
      verifySubscription().then(() => rebuildUI());
    }
  }, 1000);
}

// Background tab offline progress recovery
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && G) {
    calcOfflineProgress();
  }
});

// Global error handler
window.onerror = function(msg, url, line) { err(msg+' (line '+line+')'); return false; };

initAnalytics();
initLogin();
