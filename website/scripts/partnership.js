(() => {
  document.body.classList.add("motion-ready");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ------------------------------------------------------------
     Navigation (mobile menu)
     ------------------------------------------------------------ */
  /* ------------------------------------------------------------
     Scroll progress + topbar states
     ------------------------------------------------------------ */
  const scrollProgress = document.getElementById("scrollProgress");
  const topbar = document.querySelector(".topbar");
  const toTop = document.getElementById("toTop");


  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress && max > 0) {
      scrollProgress.style.transform = `scaleX(${y / max})`;
    }

    if (topbar) {
      topbar.classList.toggle("is-scrolled", y > 16);
    }


  };

  if (toTop) {
    const toggleToTop = () => toTop.classList.toggle("is-visible", window.scrollY > 640);
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
    window.addEventListener("scroll", toggleToTop, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    toggleToTop();
    onScroll();
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------
     Cursor glow (lerped)
     ------------------------------------------------------------ */
  const glow = document.getElementById("cursorGlow");

  if (glow && finePointer && !prefersReduced) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const loop = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      glow.style.left = `${currentX}px`;
      glow.style.top = `${currentY}px`;
      requestAnimationFrame(loop);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
      },
      { passive: true },
    );

    loop();
  }

  /* ------------------------------------------------------------
     Reveal system with variants + stagger
     ------------------------------------------------------------ */
  const reveals = document.querySelectorAll(".reveal");

  const revealDelayFor = (el) => {
    if (el.dataset.delay) return parseFloat(el.dataset.delay);
    const group = el.closest("[data-stagger]");
    if (group) {
      const items = Array.from(group.querySelectorAll(".reveal"));
      const index = items.indexOf(el);
      return Math.min(index, 10) * 70;
    }
    return 0;
  };

  if ("IntersectionObserver" in window && !prefersReduced) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.setProperty("--reveal-delay", `${revealDelayFor(entry.target)}ms`);
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* ------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------ */
  const parseCounter = (text) => {
    const match = String(text)
      .trim()
      .match(/^([^\d.,]*)([\d.,]+)(.*)$/);
    if (!match) return null;
    const raw = match[2].replace(/,/g, "");
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value === 0) return null;
    return {
      prefix: match[1],
      suffix: match[3],
      value,
      decimals: (match[2].split(".")[1] || "").length,
    };
  };

  const animateCounter = (el) => {
    const original = el.textContent;
    const parsed = parseCounter(original);
    if (!parsed) return;
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = parsed.value * eased;
      const shown = parsed.prefix + value.toFixed(parsed.decimals) + parsed.suffix;
      el.textContent = shown;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    };

    el.textContent = parsed.prefix + (0).toFixed(parsed.decimals) + parsed.suffix;
    requestAnimationFrame(tick);
  };

  const animateCountersIn = (container) => {
    if (prefersReduced) return;
    container.querySelectorAll("[data-count]").forEach((el) => {
      if (parseCounter(el.textContent)) animateCounter(el);
    });
  };

  const initCounterObserver = (root = document) => {
    if ("IntersectionObserver" in window && !prefersReduced) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 },
      );
      root.querySelectorAll("[data-count]").forEach((el) => {
        if (parseCounter(el.textContent)) counterObserver.observe(el);
      });
    }
  };
  initCounterObserver();

  /* ------------------------------------------------------------
     Tilt cards
     ------------------------------------------------------------ */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
        card.style.transform = `perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------ */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        el.style.transform = `translate(${dx * 9}px, ${dy * 9 - 2}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------
     Scroll parallax
     ------------------------------------------------------------ */
  const parallaxEls = prefersReduced
    ? []
    : Array.from(document.querySelectorAll("[data-parallax]")).map((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        const start = el.getBoundingClientRect().top + window.scrollY;
        return { el, speed, start };
      });

  if (parallaxEls.length) {
    let parallaxRaf = null;
    const applyParallax = () => {
      const y = window.scrollY;
      parallaxEls.forEach(({ el, speed, start }) => {
        const offset = (y - start) * speed;
        el.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
      });
      parallaxRaf = null;
    };
    const scheduleParallax = () => {
      if (parallaxRaf === null) parallaxRaf = requestAnimationFrame(applyParallax);
    };
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });
    applyParallax();
  }

  /* ------------------------------------------------------------
     Audience switch
     ------------------------------------------------------------ */
  const audienceData = window.TRAVELSTREM_SITE_CONFIG.audiences;

  const copyRoot = document.getElementById("audienceCopy");
  const visualRoot = document.getElementById("audienceVisual");

  const pulse = (el) => {
    if (!el || prefersReduced) return;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  };

  const renderAudience = (key) => {
    const item = audienceData[key];
    if (!item || !copyRoot || !visualRoot) return;
    copyRoot.innerHTML = `<h3>${item.title}</h3><p>${item.copy}</p><div class="benefit-list">${item.benefits.map((benefit, index) => `<div class="benefit"><div class="benefit-icon">${index + 1}</div><div><strong>${benefit[0]}</strong><span>${benefit[1]}</span></div></div>`).join("")}</div>`;
    visualRoot.innerHTML = item.visual;
    pulse(copyRoot);
    pulse(visualRoot);
    visualRoot.querySelectorAll(".journey-step").forEach((step, index) => {
      step.style.setProperty("--reveal-delay", `${index * 80}ms`);
      step.classList.add("reveal", "visible");
    });
  };
  renderAudience("traveller");
  document.querySelectorAll("[data-audience]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-audience]")
        .forEach((node) => node.classList.toggle("active", node === button));
      renderAudience(button.dataset.audience);
    }),
  );

  /* ------------------------------------------------------------
     Capability switcher (with mobile auto-scroll)
     ------------------------------------------------------------ */
  const revealNextMobileTab = (button) => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const nextButton = button.nextElementSibling;
    if (!nextButton) {
      button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      return;
    }
    const containerBounds = button.parentElement.getBoundingClientRect();
    const nextBounds = nextButton.getBoundingClientRect();
    if (nextBounds.right > containerBounds.right || nextBounds.left < containerBounds.left) {
      nextButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  document.querySelectorAll("[data-cap]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-cap]")
        .forEach((node) => node.classList.toggle("active", node === button));
      document
        .querySelectorAll("[data-screen]")
        .forEach((screen) => {
          screen.classList.toggle("active", screen.dataset.screen === button.dataset.cap);
          if (screen.dataset.screen === button.dataset.cap) animateCountersIn(screen);
        });
      revealNextMobileTab(button);
    }),
  );

  /* ------------------------------------------------------------
     Footer year
     ------------------------------------------------------------ */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();