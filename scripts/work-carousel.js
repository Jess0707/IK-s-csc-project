(() => {
  const carousel = document.querySelector("[data-work-carousel]");
  if (!carousel) return;

  const viewport = carousel.querySelector(".work-carousel__viewport");
  const track = carousel.querySelector(".work-carousel__track");
  const pagination = carousel.querySelector(".work-carousel__pagination");

  if (!viewport || !track || !pagination) return;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const originalItems = Array.from(track.children);
  const originalCount = originalItems.length;

  const getGapPx = () => {
    const styles = getComputedStyle(track);
    const gap = styles.gap || styles.columnGap || "0px";
    const parsed = Number.parseFloat(gap);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const computeBaseWidth = () => {
    const gapPx = getGapPx();
    let width = 0;

    for (let i = 0; i < originalCount; i += 1) {
      const el = track.children[i];
      if (!el) break;
      width += el.getBoundingClientRect().width;
    }

    width += Math.max(0, originalCount - 1) * gapPx;
    return Math.max(1, width);
  };

  const cloneOriginalSet = () => {
    const clones = originalItems.map((node) => node.cloneNode(true));
    for (const clone of clones) track.appendChild(clone);
  };

  const ensureInfiniteContent = () => {
    const viewportWidth = viewport.getBoundingClientRect().width;
    const targetWidth = viewportWidth * 3;
    let guard = 0;
    while (track.scrollWidth < targetWidth && guard < 10) {
      cloneOriginalSet();
      guard += 1;
    }
  };

  const dots = [];
  const setActiveDot = (index) => {
    for (let i = 0; i < dots.length; i += 1) {
      dots[i].classList.toggle("is-active", i === index);
    }
  };

  const buildPagination = () => {
    pagination.innerHTML = "";
    dots.length = 0;
    for (let i = 0; i < originalCount; i += 1) {
      const dot = document.createElement("div");
      dot.className = "work-carousel__dot";
      pagination.appendChild(dot);
      dots.push(dot);
    }
    setActiveDot(0);
  };

  const bindCardHoverVideo = () => {
    const cards = Array.from(track.querySelectorAll(".work-card"));
    for (const card of cards) {
      if (card.dataset.videoBound === "1") continue;
      const video = card.querySelector("video");
      if (!video) continue;
      card.dataset.videoBound = "1";

      const img = card.querySelector("img");
      if (img) {
        img.addEventListener("error", () => {
          const fallback = img.getAttribute("data-fallback-src");
          if (fallback && img.src !== fallback) img.src = fallback;
        });
      }

      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      const start = async () => {
        const src = card.getAttribute("data-video");
        if (src && (!video.getAttribute("src") || video.getAttribute("src") !== src)) {
          video.setAttribute("src", src);
          video.src = src;
          video.load();
        }
        card.classList.add("is-playing");
        try {
          await video.play();
        } catch {
          return;
        }
      };

      const stop = () => {
        card.classList.remove("is-playing");
        video.pause();
        video.currentTime = 0;
      };

      card.addEventListener("pointerenter", start);
      card.addEventListener("pointerdown", start);
      card.addEventListener("pointerleave", stop);
      card.addEventListener("pointercancel", stop);
      card.addEventListener("blur", stop);
    }
  };

  let baseWidth = 1;
  let lastTime = performance.now();
  let rafId = 0;

  const speedPxPerSecond = 72;

  const tick = (now) => {
    const dt = Math.max(0, now - lastTime);
    lastTime = now;

    if (!prefersReducedMotion) {
      if (track.scrollWidth <= viewport.clientWidth + 2) {
        ensureInfiniteContent();
        bindCardHoverVideo();
        baseWidth = computeBaseWidth();
      }

      const hoveredCard = track.querySelector(".work-card:hover");
      const paused = Boolean(hoveredCard);

      if (!paused) {
        viewport.scrollLeft += (speedPxPerSecond * dt) / 1000;
        if (viewport.scrollLeft >= baseWidth) viewport.scrollLeft -= baseWidth;
      }
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const updateActiveDot = () => {
    baseWidth = computeBaseWidth();
    const perItem = baseWidth / Math.max(1, originalCount);
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    const raw = Math.floor(center / Math.max(1, perItem));
    const index = ((raw % originalCount) + originalCount) % originalCount;
    setActiveDot(index);
  };

  const dotTimer = window.setInterval(updateActiveDot, 160);

  const handleResize = () => {
    ensureInfiniteContent();
    bindCardHoverVideo();
    baseWidth = computeBaseWidth();
  };

  window.addEventListener("resize", handleResize);

  const start = () => {
    ensureInfiniteContent();
    buildPagination();
    bindCardHoverVideo();
    baseWidth = computeBaseWidth();
    lastTime = performance.now();
    rafId = window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(() => window.requestAnimationFrame(start));

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(rafId);
    window.clearInterval(dotTimer);
    window.removeEventListener("resize", handleResize);
  });
})();
