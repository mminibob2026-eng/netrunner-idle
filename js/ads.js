// AdSense configuration
// To enable Google AdSense:
// 1. Apply at https://adsense.google.com (approval takes days-weeks)
// 2. Get your Publisher ID (format: pub-XXXXXXXXXXXXXXXX)
// 3. Set AD_CLIENT below
// 4. Create ad units in AdSense dashboard and replace the slot IDs

const ADS_CONFIG = {
  enabled: false,
  clientId: 'pub-0000000000000000',
};

function initAds() {
  if (!ADS_CONFIG.enabled) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CONFIG.clientId;
    document.head.appendChild(script);
  } catch(e) { console.log('AdSense init failed:', e); }
}

function loadBannerAd(containerId) {
  if (!ADS_CONFIG.enabled) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:block;width:320px;height:50px;';
  ins.dataset.adClient = ADS_CONFIG.clientId;
  ins.dataset.adSlot = '0000000000';
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
