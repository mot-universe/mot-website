/* ?????? app.js — mobile nav + autoplay videos + (optional) carousel + infinite logo marquee */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // =========================
  // Mobile nav
  // =========================
  const nav = $("[data-nav]");
  const navToggle = $("[data-nav-toggle]");

  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    $$(".nav__link").forEach((a) => {
      a.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 720px)").matches) {
          nav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // =========================
  // Videos: make ALL autoplay + loop + muted (no button)
  // =========================
  const wraps = $$("[data-player]");

  const safePlay = (video) => {
    try {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  };

  wraps.forEach((wrap) => {
    const video = wrap.querySelector("video");
    if (!video) return;

    // Remove any overlay toggle button if still exists
    const toggleBtn = wrap.querySelector("[data-toggle], .videoFrame__toggle");
    if (toggleBtn) toggleBtn.remove();

    // Force attributes for autoplay behavior
    video.controls = false;
    video.removeAttribute("controls");
    video.setAttribute("playsinline", "");
    video.playsInline = true;

    // Always autoplay & loop
    video.autoplay = true;
    video.loop = true;

    // Autoplay policy: MUST be muted
    video.muted = true;

    // If you want to keep using data-* flags, okay:
    // const shouldAuto = wrap.getAttribute("data-autoplay") !== "false"; // default true
    // But per request: all videos autoplay, so we force true.

    if (!prefersReducedMotion) safePlay(video);
  });

  // Pause when offscreen (performance), resume when visible
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!entry.isIntersecting) {
            video.pause();
          } else {
            video.muted = true;
            safePlay(video);
          }
        });
      },
      { threshold: 0.2 }
    );

    $$("[data-player] video").forEach((v) => io.observe(v));
  }

  // =========================
  // OPTIONAL: legacy carousel (runs only if markup exists)
  // =========================
  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const leftBtn = carousel.querySelector("[data-carousel-left]");
    const rightBtn = carousel.querySelector("[data-carousel-right]");

    if (viewport) {
      const scrollByAmount = () => Math.max(240, Math.floor(viewport.clientWidth * 0.75));
      const scrollLeft = () => viewport.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
      const scrollRight = () => viewport.scrollBy({ left: scrollByAmount(), behavior: "smooth" });

      leftBtn?.addEventListener("click", scrollLeft);
      rightBtn?.addEventListener("click", scrollRight);

      let timer = null;
      const start = () => {
        stop();
        timer = window.setInterval(() => {
          const max = viewport.scrollWidth - viewport.clientWidth;
          const next = viewport.scrollLeft + scrollByAmount();
          if (next >= max - 5) viewport.scrollTo({ left: 0, behavior: "smooth" });
          else viewport.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
        }, 3200);
      };
      const stop = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
      };

      if (!prefersReducedMotion) {
        start();
        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        carousel.addEventListener("focusin", stop);
        carousel.addEventListener("focusout", start);
      }

      // Drag scroll
      let isDown = false;
      let startX = 0;
      let scrollStart = 0;

      const onDown = (clientX) => {
        isDown = true;
        startX = clientX;
        scrollStart = viewport.scrollLeft;
        viewport.style.scrollBehavior = "auto";
      };
      const onMove = (clientX) => {
        if (!isDown) return;
        const dx = clientX - startX;
        viewport.scrollLeft = scrollStart - dx;
      };
      const onUp = () => {
        isDown = false;
        viewport.style.scrollBehavior = "smooth";
      };

      viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
      window.addEventListener("mousemove", (e) => onMove(e.clientX));
      window.addEventListener("mouseup", onUp);

      viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
      viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
      viewport.addEventListener("touchend", onUp);
    }
  }
})();

// ===========================
// Infinite Logo Marquee Setup
// ===========================
(() => {
  const marquees = document.querySelectorAll("[data-logo-marquee]");
  if (!marquees.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  function setupMarquee(marquee) {
    const track = marquee.querySelector("[data-logo-track]");
    if (!track) return;

    // Remove old clones and rebuild
    const originals = Array.from(track.children).filter((el) => !el.dataset.clone);
    track.innerHTML = "";
    originals.forEach((el) => track.appendChild(el));

    // Wait for images loaded
    const imgs = Array.from(track.querySelectorAll("img"));
    const waitImages = imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          })
    );

    Promise.all(waitImages).then(() => {
      const containerWidth = marquee.clientWidth;

      // Clone until wide enough for seamless loop
      let safety = 0;
      while (track.scrollWidth < containerWidth * 2.2 && safety < 50) {
        originals.forEach((node) => {
          const clone = node.cloneNode(true);
          clone.dataset.clone = "true";
          track.appendChild(clone);
        });
        safety++;
      }

      const distance = track.scrollWidth / 2; // seamless loop distance
      const pxPerSecond = 80;
      const durationSec = Math.max(10, distance / pxPerSecond);

      track.style.setProperty("--marquee-distance", `${distance}px`);
      track.style.setProperty("--marquee-duration", `${durationSec}s`);
    });
  }

  marquees.forEach(setupMarquee);

  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => marquees.forEach(setupMarquee), 200);
  });
})();
