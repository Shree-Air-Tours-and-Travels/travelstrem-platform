(() => {
  const button = document.getElementById("menuButton");
  const navigation = document.getElementById("siteNavigation");
  const header = document.querySelector(".topbar");
  const mobile = window.matchMedia("(max-width: 1100px)");
  const setOpen = (open, restoreFocus = false) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    header.classList.toggle("menu-open", open);
    navigation.inert = mobile.matches && !open;
    if (restoreFocus) button.focus();
  };
  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  navigation.addEventListener("click", event => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener("focusout", () => {
    requestAnimationFrame(() => { if (!header.contains(document.activeElement)) setOpen(false); });
  });
  mobile.addEventListener("change", () => setOpen(false));
  setOpen(false);
  const updateHeight = () => document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
  new ResizeObserver(updateHeight).observe(header);
  updateHeight();
})();
