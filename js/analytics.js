// Analytics configuration
// To enable Google Analytics 4:
// 1. Go to https://console.cloud.google.com/ → create a project → set up GA4
// 2. Get your Measurement ID (format: G-XXXXXXXXXX)
// 3. Set ANALYTICS_ID below

const ANALYTICS_CONFIG = {
  enabled: true,
  measurementId: 'G-50WNL699N0',
};

function initAnalytics() {
  if (!ANALYTICS_CONFIG.enabled) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS_CONFIG.measurementId;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.measurementId);
  } catch(e) { console.log('Analytics init failed:', e); }
}

function trackEvent(name, params) {
  if (ANALYTICS_CONFIG.enabled && window.gtag) {
    try { window.gtag('event', name, params); } catch(e) {}
  }
  if (isDev()) console.log('[Analytics]', name, params);
}
