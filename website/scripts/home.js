(() => {
  document.body.classList.add("motion-ready");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ------------------------------------------------------------
     Navigation (mobile menu)
     ------------------------------------------------------------ */
  /* ------------------------------------------------------------
     Demo tabs
     ------------------------------------------------------------ */
  const demoTabs = document.querySelectorAll("[data-demo]");
  const demoScreens = document.querySelectorAll("[data-screen]");

  const selectDemo = (tab, focus = false) => {
    demoTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    demoScreens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === tab.dataset.demo));
    if (focus) tab.focus({ preventScroll: true });
  };
  demoTabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.id = `preview-tab-${tab.dataset.demo}`;
    tab.setAttribute("aria-controls", `preview-panel-${tab.dataset.demo}`);
    tab.addEventListener("click", () => selectDemo(tab));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (event.key === "ArrowRight") target = (index + 1) % demoTabs.length;
      if (event.key === "ArrowLeft") target = (index - 1 + demoTabs.length) % demoTabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = demoTabs.length - 1;
      if (target !== undefined) { event.preventDefault(); selectDemo(demoTabs[target], true); }
    });
  });
  demoScreens.forEach((screen) => {
    screen.id = `preview-panel-${screen.dataset.screen}`;
    screen.setAttribute("role", "tabpanel");
    screen.setAttribute("aria-labelledby", `preview-tab-${screen.dataset.screen}`);
  });
  if (demoTabs.length) selectDemo(document.querySelector("[data-demo].active") || demoTabs[0]);

  /* ------------------------------------------------------------
     Product modal
     ------------------------------------------------------------ */
  const productModal = document.getElementById("productModal");
  const productModalContent = document.getElementById("productModalContent");
  const productModalClose = document.getElementById("productModalClose");
  const productModalLink = document.getElementById("productModalLink");
  const productModalDetails = document.getElementById("productModalDetails");
  const productCards = document.querySelectorAll("[data-product]");
  let productTrigger = null;

  const PRODUCT_DETAILS = window.TRAVELSTREM_SITE_CONFIG.products;

  Object.entries(window.TRAVELSTREM_SITE_CONFIG.productPreviews).forEach(([key, preview]) => {
    const product = PRODUCT_DETAILS[key];
    const [title, tagline, navigation, label, heading, metrics, rows] = preview;
    product.rich = `<span class="modal-product-state">${product.name} · ${product.status}</span>
      <h3 id="productModalTitle">${title}</h3><p class="modal-tagline">${tagline}</p>
      <p class="modal-about">${product.about}</p>
      <ul class="modal-features">${product.features.map(item => `<li>${item}</li>`).join("")}</ul>
      <div class="modal-visual"><div class="platform-visual">
        <div class="platform-visual__top"><div class="platform-visual__brand"><span class="platform-visual__mark">T</span>${product.name}</div><span class="platform-visual__status">${product.status}</span></div>
        <div class="platform-visual__body"><div class="platform-visual__nav">${navigation.map(item => `<span>${item}</span>`).join("")}</div>
          <div class="platform-visual__main"><small>${label}</small><h3>${heading}</h3>
            <div class="platform-visual__metrics">${metrics.map(([value, name]) => `<div class="platform-visual__metric"><strong>${value}</strong><span>${name}</span></div>`).join("")}</div>
            <div class="platform-visual__card">${rows.map(([name, value]) => `<div class="platform-visual__row"><strong>${name}</strong><span>${value}</span></div>`).join("")}</div>
          </div></div></div></div>`;
  });

  const configuredLink = (key) => {
    const destination = window.TRAVELSTREM_SITE_CONFIG?.links?.[key] || {};
    return typeof destination === "string" ? destination : destination.href || "#";
  };

  const openProductModal = (key) => {
    const product = PRODUCT_DETAILS[key];
    if (!product || !productModal) return;
    productTrigger = document.querySelector(`[data-product="${key}"]`);
    if (product.rich) {
      productModalContent.innerHTML = product.rich;
      animateCountersIn(productModalContent);
    } else {
      const features = product.features.map((feature) => `<li>${feature}</li>`).join("");
      productModalContent.innerHTML =
        `<span class="modal-status">${product.status}</span>` +
        `<h3 id="productModalTitle">${product.name}</h3>` +
        `<p class="modal-tagline">${product.tagline}</p>` +
        `<p class="modal-about">${product.about}</p>` +
        `<ul class="modal-features">${features}</ul>`;
    }
    if (productModalLink) {
      productModalLink.href = configuredLink(product.linkKey);
      productModalLink.textContent = product.cta;
      productModalLink.dataset.demoProduct = product.name;
    }
    if (productModalDetails) {
      productModalDetails.hidden = !product.detailsLinkKey;
      if (product.detailsLinkKey) {
        productModalDetails.href = configuredLink(product.detailsLinkKey);
        productModalDetails.textContent = product.detailsCta;
      }
    }
    productModal.classList.remove("closing");
    productModal.hidden = false;
    document.body.classList.add("modal-open");
    productModalContent.scrollTop = 0;
    productModalClose.focus();
  };

  const closeProductModal = () => {
    if (!productModal) return;
    const onClose = () => {
      productModal.hidden = true;
      document.body.classList.remove("modal-open");
      if (productTrigger) productTrigger.focus();
      productTrigger = null;
    };
    if (prefersReduced) {
      onClose();
      return;
    }
    productModal.classList.add("closing");
    window.setTimeout(onClose, 300);
  };

  productCards.forEach((card) => {
    card.addEventListener("click", () => openProductModal(card.dataset.product));
  });
  if (productModalClose) {
    productModalClose.addEventListener("click", closeProductModal);
  }
  if (productModal) {
    productModal.addEventListener("click", (event) => {
      if (event.target === productModal) closeProductModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !productModal.hidden) closeProductModal();
    });
  }

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
    let raf = null;

    const loop = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      raf = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.5
        ? requestAnimationFrame(loop) : null;
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (raf === null) raf = requestAnimationFrame(loop);
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
  const counterTargets = document.querySelectorAll(
    ".platform-visual__metric strong, [data-count]",
  );

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
      const shown =
        parsed.prefix +
        value.toFixed(parsed.decimals) +
        parsed.suffix;
      el.textContent = shown;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    };

    el.textContent = parsed.prefix + (0).toFixed(parsed.decimals) + parsed.suffix;
    requestAnimationFrame(tick);
  };

  const animateCountersIn = (container) => {
    if (prefersReduced) return;
    container
      .querySelectorAll(".platform-visual__metric strong, [data-count]")
      .forEach((el) => {
        if (parseCounter(el.textContent)) animateCounter(el);
      });
  };

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
    counterTargets.forEach((el) => {
      if (parseCounter(el.textContent)) counterObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------
     Tilt cards
     ------------------------------------------------------------ */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll(".feature-card, .product-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--rx");
        card.style.removeProperty("--ry");
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
     Scroll parallax (independent of CSS animations via `translate`)
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

  const journey = document.getElementById("journey");
  if (journey && !prefersReduced && "IntersectionObserver" in window) {
    const steps = Array.from(journey.querySelectorAll(".journey-step"));
    const observer = new IntersectionObserver((entries) => {
      const active = entries.find(entry => entry.isIntersecting);
      if (!active) return;
      journey.classList.add("is-tracking");
      steps.forEach(step => step.classList.toggle("is-current", step === active.target));
    }, { rootMargin: "-30% 0px -35% 0px", threshold: 0 });
    steps.forEach(step => observer.observe(step));
  }

  /* ------------------------------------------------------------
     Footer year
     ------------------------------------------------------------ */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
