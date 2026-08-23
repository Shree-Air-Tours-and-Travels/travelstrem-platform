const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
toggle?.addEventListener("click", () => nav.classList.toggle("is-open"));
document
  .querySelectorAll(".site-nav a")
  .forEach((link) => link.addEventListener("click", () => nav.classList.remove("is-open")));
document.querySelector("#year").textContent = new Date().getFullYear();

const progress = document.createElement("div");
progress.className = "scroll-progress";
document.body.prepend(progress);

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty(
    "--progress",
    `${scrollable ? (window.scrollY / scrollable) * 100 : 0}%`,
  );
};
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const revealItems = document.querySelectorAll(
  "section, .product-card, .engine-grid article, .journal-card, .people-grid article, .stack > div",
);
revealItems.forEach((item, index) => {
  item.classList.add("reveal-item");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const heroArt = document.querySelector(".hero-art");
heroArt?.addEventListener("pointermove", (event) => {
  const bounds = heroArt.getBoundingClientRect();
  heroArt.style.setProperty(
    "--pointer-x",
    `${((event.clientX - bounds.left) / bounds.width - 0.5) * 2}`,
  );
  heroArt.style.setProperty(
    "--pointer-y",
    `${((event.clientY - bounds.top) / bounds.height - 0.5) * 2}`,
  );
});
heroArt?.addEventListener("pointerleave", () => {
  heroArt.style.setProperty("--pointer-x", "0");
  heroArt.style.setProperty("--pointer-y", "0");
});

const statusDialog = document.querySelector("#product-status");
const statusCopy = document.querySelector("#product-status-copy");
const closeStatus = () => statusDialog?.close();
document.querySelectorAll("[data-coming-soon]").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    const product = card.dataset.comingSoon;
    if (statusCopy)
      statusCopy.textContent = `${product} is currently being developed for the Shree Air Tours and Travels ecosystem. We’ll share more when it is ready.`;
    statusDialog?.showModal();
  });
});
document.querySelector(".product-status-close")?.addEventListener("click", closeStatus);
statusDialog?.addEventListener("click", (event) => {
  if (event.target === statusDialog) closeStatus();
});

const newsletterForm = document.querySelector("#newsletter-form");
const newsletterStatus = document.querySelector("#newsletter-status");
newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email =
    new FormData(newsletterForm).get("email") || document.querySelector("#newsletter-email")?.value;
  if (!email) return;
  if (newsletterStatus)
    newsletterStatus.textContent =
      "Thanks — your email app will open to complete the subscription.";
  window.location.href = `mailto:akshat.goyal@travelstrem.com?subject=TravelsTREM%20newsletter%20subscription&body=Please%20subscribe%20${encodeURIComponent(email)}%20to%20TravelsTREM%20updates.`;
});
