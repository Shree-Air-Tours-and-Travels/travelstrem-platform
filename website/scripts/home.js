(() => {
        const menuButton = document.getElementById("menuButton");
        const mobileMenu = document.getElementById("mobileMenu");
        if (menuButton && mobileMenu) {
          menuButton.addEventListener("click", () => {
            const open = mobileMenu.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", String(open));
          });
          mobileMenu.querySelectorAll("a").forEach((link) =>
            link.addEventListener("click", () => {
              mobileMenu.classList.remove("is-open");
              menuButton.setAttribute("aria-expanded", "false");
            }),
          );
        }

        const demoTabs = document.querySelectorAll("[data-demo]");
        const demoScreens = document.querySelectorAll("[data-screen]");
        const revealNextMobileTab = (tab) => {
          if (!window.matchMedia("(max-width: 720px)").matches) return;
          const nextTab = tab.nextElementSibling;
          if (!nextTab) {
            tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            return;
          }
          const containerBounds = tab.parentElement.getBoundingClientRect();
          const nextBounds = nextTab.getBoundingClientRect();
          if (nextBounds.right > containerBounds.right || nextBounds.left < containerBounds.left) {
            nextTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }
        };
        demoTabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            demoTabs.forEach((t) => t.classList.remove("active"));
            demoScreens.forEach((s) => s.classList.remove("active"));
            tab.classList.add("active");
            const screen = document.querySelector(`[data-screen="${tab.dataset.demo}"]`);
            if (screen) screen.classList.add("active");
            revealNextMobileTab(tab);
          });
        });

        const productModal = document.getElementById("productModal");
        const productModalContent = document.getElementById("productModalContent");
        const productModalClose = document.getElementById("productModalClose");
        const productModalLink = document.getElementById("productModalLink");
        const productCards = document.querySelectorAll("[data-product]");
        let productTrigger = null;

        const PRODUCT_DETAILS = {
          trevio: {
            status: "Active product",
            name: "Trevio",
            tagline: "Community trips, adventures, treks and expeditions",
            about:
              "Trevio brings travellers together around shared departures. It covers community trips, treks, expeditions, events and travel communities, with a trip captain and a clear departure to keep every group organised.",
            features: [
              "Curated group adventures and travel communities",
              "Fixed departures with live seat availability",
              "Trip captains who run each departure",
              "Enquiries and bookings connected to your TravelsTREM account",
            ],
            linkKey: "trevio",
            cta: "Open Trevio ↗",
          },
          trevista: {
            status: "Active product",
            name: "Trevista",
            tagline: "Tours and holiday packages, personalised to you",
            about:
              "Trevista is the tours and holiday-packages product. Explore curated domestic and international journeys, review the itinerary and inclusions, and ask for a personalised version when the standard package is not exactly what you need.",
            features: [
              "Curated tour discovery with structured itineraries",
              "Detailed stays, inclusions and package options",
              "Personalised enquiry and quote journey",
              "Connected booking management through TravelsTREM",
            ],
            linkKey: "trevista",
            cta: "Open Trevista ↗",
          },
          hub: {
            status: "Connected account",
            name: "TravelsTREM Hub",
            tagline: "One account for the whole journey",
            about:
              "The TravelsTREM hub is the single account behind every product. It keeps discovery, enquiries, quotes, bookings, documents and support connected so you never lose context as your trip moves forward.",
            features: [
              "One TravelsTREM account across all products",
              "Enquiries, quotes and bookings in a single timeline",
              "Travel documents and booking progress together",
              "Support connected to every journey",
            ],
            linkKey: "hub",
            cta: "Open your dashboard ↗",
          },
          partnertrem: {
            status: "For travel agencies",
            name: "Partner TREM",
            tagline: "A workspace that runs the daily agency operation",
            about:
              "Partner TREM is the agency workspace behind TravelsTREM. It keeps tours, enquiries, customers and bookings in one place, and lets eligible journeys become discoverable by travellers through Trevista.",
            features: [
              "Role-based workspace for agency admins and agents",
              "Create, organise and publish structured tour inventory",
              "Manage enquiries, quotes and bookings with context",
              "Publish eligible tours to travellers through Trevista",
            ],
            linkKey: "partnerApplication",
            cta: "Apply for partnership ↗",
          },
        };

        const configuredLink = (key) => {
          const destination =
            window.TRAVELSTREM_SITE_CONFIG?.links?.[key] || {};
          return typeof destination === "string" ? destination : destination.href || "#";
        };

        const openProductModal = (key) => {
          const product = PRODUCT_DETAILS[key];
          if (!product || !productModal) return;
          productTrigger = document.querySelector(`[data-product="${key}"]`);
          const features = product.features.map((feature) => `<li>${feature}</li>`).join("");
          productModalContent.innerHTML =
            `<span class="modal-status">${product.status}</span>` +
            `<h3 id="productModalTitle">${product.name}</h3>` +
            `<p class="modal-tagline">${product.tagline}</p>` +
            `<p class="modal-about">${product.about}</p>` +
            `<ul class="modal-features">${features}</ul>`;
          if (productModalLink) {
            productModalLink.href = configuredLink(product.linkKey);
            productModalLink.textContent = product.cta;
          }
          productModal.hidden = false;
          document.body.classList.add("modal-open");
          productModalClose.focus();
        };

        const closeProductModal = () => {
          if (!productModal) return;
          productModal.hidden = true;
          document.body.classList.remove("modal-open");
          if (productTrigger) productTrigger.focus();
          productTrigger = null;
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

        const reveals = document.querySelectorAll(".reveal");
        if ("IntersectionObserver" in window) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("visible");
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.08 },
          );
          reveals.forEach((el) => observer.observe(el));
        } else {
          reveals.forEach((el) => el.classList.add("visible"));
        }

        const year = document.getElementById("year");
        if (year) year.textContent = new Date().getFullYear();
      })();