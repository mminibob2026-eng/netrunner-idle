function subscribe() {
  G._subActive = true;
  trackEvent('subscribe', { username: USER });
  save();
  toast('Code Journey Pro activated! Enjoy premium features.', 'loot');
  rebuildUI();
}

function unsubscribe() {
  G._subActive = false;
  save();
  toast('Code Journey Pro deactivated.', 'info');
  rebuildUI();
}

function showSubscribeUI() {
  const overlay = document.createElement('div');
  overlay.id = 'sub-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#0a0a1a;border:2px solid #0f0;border-radius:12px;padding:32px;max-width:480px;width:90%;text-align:center;">
      <h2 style="color:#0f0;font-size:22px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">CODE JOURNEY PRO</h2>
      <p style="color:#888;font-size:13px;margin-bottom:20px;">Level up your coding journey</p>
      <div style="font-size:36px;color:#ff0;margin-bottom:4px;">$1</div>
      <div style="color:#888;font-size:12px;margin-bottom:20px;">per month</div>
      <div style="text-align:left;margin-bottom:20px;">
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ No ads</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ Full offline progress (unlimited)</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ Auto-debug mode</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ Auto-build queue</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ 1.5x KP generation rate</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ 1.25x permanent speed</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ Premium themes</div>
        <div style="color:#0f0;font-size:12px;padding:4px 0;">✓ Cloud save support</div>
      </div>
      <button id="sub-pay-btn" style="padding:12px 40px;background:transparent;border:2px solid #0f0;color:#0f0;font-family:inherit;font-size:16px;cursor:pointer;border-radius:6px;text-transform:uppercase;letter-spacing:2px;transition:all 0.2s;margin-bottom:8px;">SUBSCRIBE</button>
      <div><button id="sub-close-btn" style="background:transparent;border:none;color:#888;font-family:inherit;font-size:12px;cursor:pointer;padding:8px;">Maybe later</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('sub-pay-btn').addEventListener('click', () => {
    subscribe();
    overlay.remove();
  });
  document.getElementById('sub-close-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

function showAdBanner() {
  const existing = document.getElementById('ad-banner');
  if (existing) return;
  if (isSubActive()) return;
  if (!G) return;
  const banner = document.createElement('div');
  banner.id = 'ad-banner';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:500;background:rgba(10,10,26,0.95);border-top:1px solid rgba(0,255,65,0.2);padding:6px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;';
  banner.innerHTML = `
    <span style="color:#888;font-size:10px;">AD</span>
    <span style="color:#0f0;flex:1;text-align:center;">[ Ad Space ] - Get Code Journey Pro for an ad-free experience</span>
    <button id="ad-close-btn" style="background:transparent;border:1px solid #888;color:#888;font-family:inherit;font-size:10px;cursor:pointer;padding:2px 8px;border-radius:2px;">✕</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('ad-close-btn').addEventListener('click', () => banner.remove());
}

function showRewardedAd(callback) {
  if (isSubActive()) { if (callback) callback(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'reward-ad-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#0a0a1a;border:2px solid #ff0;border-radius:12px;padding:32px;max-width:400px;width:90%;text-align:center;">
      <h2 style="color:#ff0;font-size:18px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">REWARDED AD</h2>
      <p style="color:#888;font-size:13px;margin-bottom:20px;">Watch a short ad to claim your reward</p>
      <div style="color:#0ff;font-size:14px;margin-bottom:20px;">${getRewardDescription()}</div>
      <button id="reward-ad-watch-btn" style="padding:10px 32px;background:transparent;border:2px solid #ff0;color:#ff0;font-family:inherit;font-size:14px;cursor:pointer;border-radius:4px;text-transform:uppercase;letter-spacing:2px;transition:all 0.2s;margin-bottom:8px;">WATCH AD</button>
      <div><button id="reward-ad-close-btn" style="background:transparent;border:none;color:#888;font-family:inherit;font-size:12px;cursor:pointer;padding:8px;">Cancel</button></div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('reward-ad-watch-btn').addEventListener('click', () => {
    overlay.remove();
    toast('Reward claimed!', 'loot');
    if (callback) callback();
  });
  document.getElementById('reward-ad-close-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

function getRewardDescription() {
  return 'Boost: 2x skill speed for 30 minutes';
}

function applyAdBoost() {
  G._adBoostUntil = Date.now() + 30 * 60 * 1000;
  toast('Ad boost active: 2x speed for 30min!', 'loot');
}

function hasAdBoost() {
  return G._adBoostUntil && Date.now() < G._adBoostUntil;
}

function getEffectiveSpeed() {
  let s = G._speed || 1;
  if (isSubActive()) s *= 1.25;
  if (hasAdBoost()) s *= 2;
  if (G.inv.neuralLinks) s *= 1 + G.inv.neuralLinks * 0.02;
  return s;
}
