(function () {
  const stage = document.querySelector("[data-expand-stage]");
  const card = document.querySelector("[data-expand-card]");
  if (!stage || !card) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function measureStartWidth() {
    const viewport = window.innerWidth;
    const gutter = Math.min(100, Math.max(22, viewport * 0.0666));
    return Math.min(1300, Math.max(0, viewport - gutter * 2));
  }

  function updateFeature() {
    if (reduceMotion.matches) {
      card.style.setProperty("--feature-progress", "0");
      card.style.setProperty("--feature-width", `${measureStartWidth()}`);
      card.style.setProperty("--feature-height", window.innerWidth <= 900 ? "auto" : "586");
      card.style.setProperty("--feature-radius", "7");
      card.style.setProperty("--feature-pad-x", window.innerWidth <= 900 ? "38" : "100");
      card.style.setProperty("--feature-cta-opacity", "1");
      card.style.setProperty("--feature-cta-y", "0px");
      card.style.setProperty("--feature-shadow-alpha", "0");
      stage.style.setProperty("--feature-stage-height", window.innerWidth <= 900 ? "742.72px" : "586px");
      return;
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(180, viewportHeight * 0.28);
    const raw = clamp((travel - rect.top) / travel, 0, 1);
    const progress = easeOutQuint(raw);
    const startWidth = measureStartWidth();
    const endWidth = viewportWidth;
    const startHeight = viewportWidth <= 900 ? Math.max(640, Math.min(760, viewportHeight * 0.88)) : 586;
    const startPad = viewportWidth <= 900 ? 38 : 100;
    const endPad = viewportWidth <= 900 ? 24 : Math.max(64, Math.min(148, viewportWidth * 0.09));
    const width = startWidth + (endWidth - startWidth) * progress;
    const height = startHeight;
    const radius = 7 * (1 - progress);
    const padX = startPad + (endPad - startPad) * progress;

    card.style.setProperty("--feature-progress", progress.toFixed(4));
    card.style.setProperty("--feature-width", width.toFixed(2));
    card.style.setProperty("--feature-height", height.toFixed(2));
    card.style.setProperty("--feature-radius", radius.toFixed(2));
    card.style.setProperty("--feature-pad-x", padX.toFixed(2));
    card.style.setProperty("--feature-cta-opacity", (0.22 + progress * 0.78).toFixed(3));
    card.style.setProperty("--feature-cta-y", `${((1 - progress) * 8).toFixed(2)}px`);
    card.style.setProperty("--feature-shadow-alpha", (progress * 0.16).toFixed(3));
    stage.style.setProperty("--feature-stage-height", `${height.toFixed(2)}px`);

    if (window.directScalHeroGradient?.minigl && window.directScalHeroGradient?.mesh) {
      window.directScalHeroGradient.resize();
    }

    window.dispatchEvent(new CustomEvent("directscal:hero-gradient-sync"));
  }

  let frame = null;
  function scheduleUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      updateFeature();
    });
  }

  updateFeature();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  reduceMotion.addEventListener("change", scheduleUpdate);
})();

(function () {
  const topbar = document.querySelector(".topbar");
  const hero = document.querySelector(".hero");
  if (!topbar || !hero) return;

  let frame = null;

  function updateNavSurface() {
    const navHeight = topbar.offsetHeight || 50;
    const heroBottom = hero.getBoundingClientRect().bottom;
    document.documentElement.classList.toggle("nav-on-paper", heroBottom <= navHeight + 1);
  }

  function scheduleUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      updateNavSurface();
    });
  }

  updateNavSurface();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
})();
