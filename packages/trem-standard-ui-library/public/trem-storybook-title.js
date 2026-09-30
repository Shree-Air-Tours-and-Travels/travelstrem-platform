(() => {
  const TITLE = "Trem UI Modules";
  const keep = () => {
    if (document.title !== TITLE) document.title = TITLE;
  };
  keep();
  setInterval(keep, 250);
  const titleEl = document.querySelector("title");
  if (titleEl) {
    new MutationObserver(keep).observe(titleEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
})();
