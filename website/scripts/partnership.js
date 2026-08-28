(() => {
        const menuButton = document.getElementById("menuButton");
        const mobileMenu = document.getElementById("mobileMenu");
        if (menuButton && mobileMenu) {
          menuButton.addEventListener("click", () => {
            const open = mobileMenu.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", String(open));
            menuButton.textContent = open ? "×" : "☰";
          });
          mobileMenu.querySelectorAll("a").forEach((link) =>
            link.addEventListener("click", () => {
              mobileMenu.classList.remove("is-open");
              menuButton.setAttribute("aria-expanded", "false");
              menuButton.textContent = "☰";
            }),
          );
        }

        const year = document.getElementById("year");
        if (year) year.textContent = new Date().getFullYear();

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 },
        );
        document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

        const glow = document.getElementById("cursorGlow");
        if (glow && window.matchMedia("(pointer:fine)").matches) {
          window.addEventListener(
            "pointermove",
            (event) => {
              glow.style.left = event.clientX + "px";
              glow.style.top = event.clientY + "px";
            },
            { passive: true },
          );
        }

        const audienceData = {
          traveller: {
            title: "A journey that stays connected after you click “Get a Quote”.",
            copy: "Discover a tour, tell the responsible agent what you need, compare customised options, accept a quote, pay and continue receiving the documents and updates attached to the same booking.",
            benefits: [
              [
                "Discover",
                "Browse travel products and eligible tours without needing to understand the agency structure behind each listing.",
              ],
              [
                "Customise",
                "Your requirement becomes an actionable enquiry for the responsible agency and agent.",
              ],
              [
                "Continue",
                "Quote, payment, documents and booking status remain connected to the same journey.",
              ],
            ],
            visual: `
              <div class="journey-top"><div><small>Traveller journey</small><strong>Kashmir · 5 nights / 6 days</strong></div><span class="journey-status">Quote ready</span></div>
              <div class="journey-steps"><div class="journey-step"><b>1</b><strong>Discover</strong><span>Trevista</span></div><div class="journey-step"><b>2</b><strong>Enquire</strong><span>Requirements</span></div><div class="journey-step"><b>3</b><strong>Review</strong><span>Quote options</span></div><div class="journey-step"><b>4</b><strong>Pay</strong><span>Secure booking</span></div><div class="journey-step"><b>5</b><strong>Travel</strong><span>Documents</span></div></div>
              <div class="journey-card"><div class="journey-card-head"><div><small>Customised quote</small><strong>Choose the experience that fits you</strong></div><small>Valid for review</small></div><div class="quote-options"><div class="quote-option"><span>Standard</span><strong>₹72,500</strong></div><div class="quote-option active"><span>Premium</span><strong>₹89,900</strong></div><div class="quote-option"><span>Advance</span><strong>₹1,08,400</strong></div></div><div class="quote-total"><small>Final amount shown before payment</small><b>₹89,900</b></div></div>`,
          },
          partner: {
            title: "Run the agency workflow and publish into the same ecosystem.",
            copy: "Partner TREM gives approved agencies a structured operating surface for tours, customers, enquiries, quotes, bookings, payments and post-booking fulfilment—with eligible inventory connected to the TravelsTREM marketplace.",
            benefits: [
              ["Operate", "Manage agents, tours and customer journeys from one agency workspace."],
              [
                "Convert",
                "Turn enquiries into customised quotes and accepted bookings without losing context.",
              ],
              [
                "Distribute",
                "Publish eligible travel inventory into the TravelsTREM customer experience.",
              ],
            ],
            visual: `
              <div class="journey-top"><div><small>Partner TREM</small><strong>Agency operating journey</strong></div><span class="journey-status">Marketplace connected</span></div>
              <div class="journey-steps"><div class="journey-step"><b>1</b><strong>Tour</strong><span>Create</span></div><div class="journey-step"><b>2</b><strong>Publish</strong><span>Go live</span></div><div class="journey-step"><b>3</b><strong>Enquiry</strong><span>Assign</span></div><div class="journey-step"><b>4</b><strong>Quote</strong><span>Customise</span></div><div class="journey-step"><b>5</b><strong>Booking</strong><span>Deliver</span></div></div>
              <div class="journey-card"><div class="journey-card-head"><div><small>Agency queue</small><strong>What needs attention</strong></div><small>Live</small></div><div class="mini-table" style="color:#07111f"><div class="mini-row" style="background:#f5f7fa"><strong>Kashmir honeymoon</strong><span>Quote accepted</span><span class="status">Payment</span></div><div class="mini-row" style="background:#f5f7fa"><strong>Andaman family</strong><span>New enquiry</span><span class="status">Assign</span></div><div class="mini-row" style="background:#f5f7fa"><strong>Dubai holiday</strong><span>Booking</span><span class="status">Documents</span></div></div></div>`,
          },
        };

        const copyRoot = document.getElementById("audienceCopy");
        const visualRoot = document.getElementById("audienceVisual");
        const renderAudience = (key) => {
          const item = audienceData[key];
          if (!item || !copyRoot || !visualRoot) return;
          copyRoot.innerHTML = `<h3>${item.title}</h3><p>${item.copy}</p><div class="benefit-list">${item.benefits.map((benefit, index) => `<div class="benefit"><div class="benefit-icon">${index + 1}</div><div><strong>${benefit[0]}</strong><span>${benefit[1]}</span></div></div>`).join("")}</div>`;
          visualRoot.innerHTML = item.visual;
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
              .forEach((screen) =>
                screen.classList.toggle("active", screen.dataset.screen === button.dataset.cap),
              );
            revealNextMobileTab(button);
          }),
        );
      })();
