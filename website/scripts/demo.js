(() => {
  const form = document.getElementById("demoBookingForm");
  const section = document.getElementById("book-demo");
  if (!form || !section) return;

  const date = form.elements.namedItem("date");
  const now = new Date();
  const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  if (date) date.min = localToday;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
  const timezoneLabel = document.getElementById("demoTimezone");
  if (timezoneLabel) timezoneLabel.textContent = timezone;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest('a[href="#book-demo"]');
    if (!trigger) return;
    event.preventDefault();

    const requestedProduct = trigger.dataset.demoProduct;
    const interest = form.elements.namedItem("interest");
    if (requestedProduct && interest) {
      const matchingOption = Array.from(interest.options)
        .find((option) => option.textContent.trim() === requestedProduct);
      if (matchingOption) interest.value = matchingOption.value;
    }

    const productModal = document.getElementById("productModal");
    if (productModal && !productModal.hidden) {
      productModal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#book-demo");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form));
    const subject = `TravelsTREM demo request — ${values.company}`;
    const body = [
      "Hello TravelsTREM team,",
      "",
      "I would like to book a product demo.",
      "",
      `Name: ${values.name}`,
      `Work email: ${values.email}`,
      `Company: ${values.company}`,
      `Phone: ${values.phone}`,
      `Product interest: ${values.interest}`,
      `Preferred model: ${values.model}`,
      `Preferred date: ${values.date}`,
      `Preferred time: ${values.time}`,
      `Time zone: ${timezone}`,
      "",
      `Notes: ${values.notes || "None"}`,
    ].join("\n");

    window.location.href = `mailto:${window.TRAVELSTREM_SITE_CONFIG.demo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
