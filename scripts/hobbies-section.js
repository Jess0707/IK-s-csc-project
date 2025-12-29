(() => {
  const section = document.querySelector("[data-hobbies-section]");
  if (!section) return;

  const stage = section.querySelector("[data-hobbies-arc] .hobbies-arc__stage");
  const cards = Array.from(section.querySelectorAll("[data-hobby-card]"));
  if (!stage || cards.length === 0) return;

  const modal = section.querySelector("[data-hobby-modal]");
  const modalImg = section.querySelector("[data-hobby-modal-img]");
  const modalTitle = section.querySelector("[data-hobby-modal-title]");
  const modalText = section.querySelector("[data-hobby-modal-text]");
  const modalCloseEls = Array.from(section.querySelectorAll("[data-hobby-modal-close]"));

  let targetOffset = 0;
  let currentOffset = 0;
  let raf = 0;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const getLayoutConfig = () => {
    const stageRect = stage.getBoundingClientRect();
    const isWide = window.innerWidth >= 900;

    const step = isWide ? 150 : 128;
    const arcRadius = isWide ? 520 : 420;
    const arcAmplitude = isWide ? 135 : 110;
    const stageCenterY = stageRect.height * 0.62;

    return { step, arcRadius, arcAmplitude, stageCenterY };
  };

  const clampWrap = (value, range) => {
    if (range <= 0) return value;
    const wrapped = ((value % range) + range) % range;
    return wrapped;
  };

  const applyLayout = () => {
    const { step, arcRadius, arcAmplitude, stageCenterY } = getLayoutConfig();
    const n = cards.length;
    const total = n * step;
    const half = total / 2;
    const mid = (n - 1) / 2;

    for (let i = 0; i < n; i += 1) {
      let x = (i - mid) * step + currentOffset;
      x = clampWrap(x + half, total) - half;

      const angle = x / arcRadius;
      const y = -Math.cos(angle) * arcAmplitude + arcAmplitude * 0.9;
      const rotate = angle * 18;
      const depth = 1 - Math.min(1, Math.abs(x) / (half * 0.95));
      const scale = 0.92 + depth * 0.22;
      const z = Math.round(100 + depth * 120);

      const card = cards[i];
      card.style.zIndex = String(z);
      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${stageCenterY + y}px, 0) rotate(${rotate}deg) scale(${scale})`;
      card.style.filter = `brightness(${0.78 + depth * 0.28})`;
    }
  };

  const tick = () => {
    currentOffset += (targetOffset - currentOffset) * (prefersReducedMotion ? 1 : 0.09);
    applyLayout();
    raf = window.requestAnimationFrame(tick);
  };

  const setModalOpen = (open) => {
    if (!modal) return;
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  };

  const openModal = (card) => {
    if (!modal || !modalImg || !modalTitle || !modalText) return;
    const title = card.getAttribute("data-title") || "";
    const reason = card.getAttribute("data-reason") || "";
    const img = card.querySelector("img");

    modalTitle.textContent = title;
    modalText.textContent = reason;
    if (img) {
      modalImg.src = img.getAttribute("src") || "";
      modalImg.alt = title;
    }

    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const bindModal = () => {
    if (!modal) return;
    for (const el of modalCloseEls) el.addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  };

  const bindCards = () => {
    for (const card of cards) {
      card.addEventListener("click", () => openModal(card));
    }
  };

  const bindScrollInteraction = () => {
    const onWheel = (e) => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visible = Math.min(vh, Math.max(0, rect.bottom)) - Math.max(0, rect.top);
      const ratio = visible / Math.min(vh, rect.height || vh);
      if (ratio < 0.35) return;

      targetOffset += e.deltaY * 0.85;
    };

    window.addEventListener("wheel", onWheel, { passive: true });
  };

  bindModal();
  bindCards();
  bindScrollInteraction();
  applyLayout();
  raf = window.requestAnimationFrame(tick);

  window.addEventListener("resize", applyLayout);
  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(raf));
})();
