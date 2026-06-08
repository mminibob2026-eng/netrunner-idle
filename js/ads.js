// AdSense configuration
// To enable Google AdSense:
// 1. Apply at https://adsense.google.com (approval takes days-weeks)
// 2. Get your Publisher ID (format: pub-XXXXXXXXXXXXXXXX)
// 3. Set AD_CLIENT below
// 4. Create ad units in AdSense dashboard and replace the slot IDs

const ADS_CONFIG = {
  enabled: true,
  clientId: 'ca-pub-1908159369479300',
};

function loadBannerAd(containerId) {
  if (!ADS_CONFIG.enabled) return;
  if (typeof isSubActive === 'function' && isSubActive()) return; // Don't show ads to subscribers
  const container = document.getElementById(containerId);
  if (!container) return;
  if (container.hasChildNodes()) return; // Already loaded
  container.innerHTML = '';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:block;width:320px;height:50px;margin:0 auto;';
  ins.dataset.adClient = ADS_CONFIG.clientId;
  ins.dataset.adSlot = '0000000000'; // ← Replace with real ad unit ID from AdSense dashboard
  container.appendChild(ins);
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
}

function showRewardedAd(callback) {
  if (!ADS_CONFIG.enabled) {
    if (callback) callback();
    return;
  }
  // AdSense doesn't support rewarded video directly.
  // For production, integrate with a rewarded video network (AdMob, unity ads).
  // For now, simulate the reward.
  if (callback) setTimeout(callback, 1000);
}
