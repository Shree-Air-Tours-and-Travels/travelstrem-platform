(() => {
  const ads = window.TRAVELSTREM_SITE_CONFIG?.ads;
  if (!ads?.enabled || !ads.hosts.includes(location.hostname)) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ads.publisherId)}`;
  script.addEventListener("load", () => {
    document.querySelectorAll(".ad-placement ins[data-ad-slot]").forEach((unit) => {
      if (!unit.dataset.adSlot || unit.dataset.adsbygoogleStatus) return;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }, { once: true });
  document.head.append(script);
})();
