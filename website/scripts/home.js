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
