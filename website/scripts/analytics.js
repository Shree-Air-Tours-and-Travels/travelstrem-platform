(() => {
  const analytics = window.TRAVELSTREM_SITE_CONFIG?.analytics;
  if (!analytics?.enabled || !analytics.hosts.includes(location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", analytics.measurementId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics.measurementId)}`;
  document.head.append(script);
})();
