(function initialiseTravelsTremWebsite() {
  "use strict";

  const config = window.TRAVELSTREM_SITE_CONFIG || { links: {} };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("header");
  const menuButton = document.querySelector("#menuButton");
  const mobileMenu = document.querySelector("#mobileMenu");

  document.querySelectorAll("a[data-link]").forEach((anchor) => {
    const destination = config.links?.[anchor.dataset.link];
    const link = typeof destination === "string" ? { href: destination } : destination;
    if (!link?.href) return;
    anchor.href = link.href;
    if (link.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  });

  const setMenuOpen = (open) => {
    if (!menuButton || !mobileMenu) return;
    mobileMenu.classList.toggle("hidden", !open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menuButton.textContent = open ? "×" : "☰";
  };

  menuButton?.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });
  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  let scrollFrame = 0;
  const updateScrollState = () => {
    scrollFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
    progress.style.setProperty("--scroll-progress", `${percent}%`);
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  }, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });
  updateScrollState();

  const revealItems = [
    ...document.querySelectorAll("main section > div > div, main article, main aside"),
  ];
  revealItems.forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });

  if (!reducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const sectionLinks = [...document.querySelectorAll('a[data-link][href^="#"]')];
  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!current) return;
      sectionLinks.forEach((link) => {
        link.classList.toggle("active-section-link", link.getAttribute("href") === `#${current.target.id}`);
      });
    }, { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.25, 0.5] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const heroVisual = document.querySelector("main section:first-child > div > div:last-child");
  if (heroVisual) {
    heroVisual.classList.add("hero-visual");
    if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
      heroVisual.addEventListener("pointermove", (event) => {
        const bounds = heroVisual.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        heroVisual.style.setProperty("--tilt-x", `${(x - 0.5) * 3}deg`);
        heroVisual.style.setProperty("--tilt-y", `${(0.5 - y) * 3}deg`);
        heroVisual.style.setProperty("--glow-x", `${x * 100}%`);
        heroVisual.style.setProperty("--glow-y", `${y * 100}%`);
      });
      heroVisual.addEventListener("pointerleave", () => {
        heroVisual.style.setProperty("--tilt-x", "0deg");
        heroVisual.style.setProperty("--tilt-y", "0deg");
      });
    }
  }
})();
