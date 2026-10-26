(() => {
  "use strict";
  const chapters = Array.isArray(window.NOVEL_CHAPTERS) ? window.NOVEL_CHAPTERS : [];
  const $ = (id) => document.getElementById(id);
  const state = { chapterIndex: 0, fontSize: 19, wide: false, toastTimer: null, lastScrollY: 0 };
  const STORAGE_KEY = "animeUruguay.reader.v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { saved = {}; }

  const homeSections = [...document.querySelectorAll(".page-view:not(.reader)")];
  const reader = $("reader");
  const drawer = $("chapterDrawer");
  const backdrop = $("drawerBackdrop");
  const content = $("chapterContent");
  const dock = $("readerControlDock");

  function save(extra = {}) {
    const payload = { ...saved, chapterIndex: state.chapterIndex, fontSize: state.fontSize, wide: state.wide, ...extra };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); saved = payload; } catch (_) {}
  }
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }
  function setTheme(theme) {
    document.body.classList.toggle("light", theme === "light");
    $("themeIcon").textContent = theme === "light" ? "☾" : "☼";
    $("themeToggle").setAttribute("aria-label", theme === "light" ? "Activar modo oscuro" : "Activar modo claro");
    save({ theme });
  }
  function activeChapter() { return chapters[state.chapterIndex]; }
  function percentRead() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((window.scrollY / max) * 100)));
  }
  function updateProgress() {
    if (reader.classList.contains("hidden")) return;
    const p = percentRead();
    $("progressBar").style.width = p + "%";
    $("progressPercent").textContent = p + "%";
    $("overallBar").style.width = p + "%";
    $("overallProgress").textContent = p + "%";
    save({ scrollY: window.scrollY, progress: p });
  }
  function renderChapter(index, restorePosition = false) {
    if (!chapters.length) {
      content.innerHTML = "<p>El contenido de la novela todavía no está disponible.</p>";
      return;
    }
    state.chapterIndex = Math.max(0, Math.min(index, chapters.length - 1));
    const chapter = activeChapter();
    $("readerTitle").textContent = chapter.title;
    $("chapterNumber").textContent = String(chapter.id).padStart(2, "0");
    $("progressChapter").textContent = "CAPÍTULO " + String(chapter.id).padStart(2, "0");
    content.replaceChildren();
    chapter.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      if (/^[—]/.test(text)) p.classList.add("dialogue");
      if (/^[«]/.test(text)) p.classList.add("thought");
      if (/^(Brrrr|¡Impacto)/.test(text)) p.classList.add("sound");
      content.appendChild(p);
    });
    $("previousChapter").disabled = state.chapterIndex === 0;
    $("previousChapter").querySelector("strong").textContent = state.chapterIndex === 0 ? "Primer capítulo" : chapters[state.chapterIndex - 1].title;
    $("nextChapter").disabled = state.chapterIndex >= chapters.length - 1;
    $("nextChapter").querySelector("strong").textContent = state.chapterIndex >= chapters.length - 1 ? "Próximamente" : chapters[state.chapterIndex + 1].title;
    renderIndex();
    document.documentElement.style.setProperty("--reading-size", state.fontSize + "px");
    $("readingColumn").classList.toggle("wide", state.wide);
    save({ chapterIndex: state.chapterIndex, scrollY: restorePosition ? (saved.scrollY || 0) : 0 });
    if (restorePosition) window.scrollTo(0, saved.scrollY || 0);
    else window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    requestAnimationFrame(updateProgress);
  }
  function showReader(index = state.chapterIndex, restorePosition = false) {
    homeSections.forEach(s => s.classList.add("hidden"));
    reader.classList.remove("hidden");
    dock.classList.add("visible");
    dock.classList.remove("compact");
    dock.setAttribute("aria-hidden", "false");
    renderChapter(index, restorePosition);
    state.lastScrollY = window.scrollY;
    $("readerTitle").focus?.({ preventScroll: true });
  }
  function showHome() {
    reader.classList.add("hidden");
    dock.classList.remove("visible", "compact");
    dock.setAttribute("aria-hidden", "true");
    homeSections.forEach(s => s.classList.remove("hidden"));
    closeDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderIndex() {
    const homeList = $("homeChapterList");
    if (homeList) {
      homeList.replaceChildren();
      chapters.forEach((chapter, i) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "home-chapter-card";
        card.innerHTML = `<span class="home-chapter-number">${String(chapter.id).padStart(2, "0")}</span><span class="home-chapter-copy"><small>CAPÍTULO ${String(chapter.id).padStart(2, "0")}</small><strong></strong></span><span class="home-chapter-arrow" aria-hidden="true">↗</span>`;
        card.querySelector("strong").textContent = chapter.title;
        card.addEventListener("click", () => showReader(i));
        homeList.appendChild(card);
      });
    }
    const list = $("chapterList"); list.replaceChildren();
    chapters.forEach((chapter, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chapter-list-item" + (i === state.chapterIndex ? " active" : "");
      button.innerHTML = `<span class="chapter-list-number">${String(chapter.id).padStart(2, "0")}</span><span class="chapter-list-copy"><strong></strong><small>Capítulo ${String(chapter.id).padStart(2, "0")}</small></span><span class="chapter-list-state">${i === state.chapterIndex ? "●" : "↗"}</span>`;
      button.querySelector("strong").textContent = chapter.title;
      button.addEventListener("click", () => { showReader(i); closeDrawer(); });
      list.appendChild(button);
    });
  }
  function openDrawer() {
    renderIndex(); drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
    backdrop.hidden = false; document.body.style.overflow = "hidden"; $("closeIndex").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true; document.body.style.overflow = "";
  }

  $("openIndex").addEventListener("click", openDrawer);
  $("readerIndex").addEventListener("click", openDrawer);
  $("closeIndex").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  $("backHome").addEventListener("click", showHome);
  $("previousChapter").addEventListener("click", () => { if (state.chapterIndex > 0) renderChapter(state.chapterIndex - 1); });
  $("nextChapter").addEventListener("click", () => { if (state.chapterIndex < chapters.length - 1) renderChapter(state.chapterIndex + 1); else toast("Has llegado al capítulo disponible más reciente."); });
  $("fontDown").addEventListener("click", () => { state.fontSize = Math.max(16, state.fontSize - 1); document.documentElement.style.setProperty("--reading-size", state.fontSize + "px"); save({ fontSize: state.fontSize }); toast("Tamaño de letra: " + state.fontSize + " px"); });
  $("fontUp").addEventListener("click", () => { state.fontSize = Math.min(26, state.fontSize + 1); document.documentElement.style.setProperty("--reading-size", state.fontSize + "px"); save({ fontSize: state.fontSize }); toast("Tamaño de letra: " + state.fontSize + " px"); });
  $("widthToggle").addEventListener("click", () => { state.wide = !state.wide; $("readingColumn").classList.toggle("wide", state.wide); save({ wide: state.wide }); toast(state.wide ? "Área de lectura amplia" : "Área de lectura cómoda"); });
  $("themeToggle").addEventListener("click", () => setTheme(document.body.classList.contains("light") ? "dark" : "light"));
  window.addEventListener("scroll", () => {
    updateProgress();
    if (reader.classList.contains("hidden")) return;
    const currentY = window.scrollY;
    if (currentY > state.lastScrollY + 5 && currentY > 100) dock.classList.add("compact");
    else if (currentY < state.lastScrollY - 5) dock.classList.remove("compact");
    state.lastScrollY = currentY;
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
    if (event.key === "ArrowLeft" && !reader.classList.contains("hidden") && event.altKey && state.chapterIndex > 0) renderChapter(state.chapterIndex - 1);
    if (event.key === "ArrowRight" && !reader.classList.contains("hidden") && event.altKey && state.chapterIndex < chapters.length - 1) renderChapter(state.chapterIndex + 1);
  });

  state.fontSize = Math.max(16, Math.min(26, Number(saved.fontSize) || 19));
  state.wide = Boolean(saved.wide);
  setTheme(saved.theme === "light" ? "light" : "dark");
  renderIndex();
  if (saved.chapterIndex !== undefined) {
    // Keep the landing page as the initial view; the saved position is restored when the reader opens.
    save({ chapterIndex: Math.max(0, Math.min(Number(saved.chapterIndex) || 0, chapters.length - 1)) });
  }
})();