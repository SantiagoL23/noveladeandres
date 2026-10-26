(() => {
  "use strict";
  const novels = Array.isArray(window.NOVELS) ? window.NOVELS : [];
  let activeNovelIndex = 0;
  let chapters = novels[0]?.chapters || [];
  const $ = (id) => document.getElementById(id);
  const state = { chapterIndex: 0, fontSize: 19, wide: false, toastTimer: null };
  const STORAGE_KEY = "entrePaginas.reader.v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { saved = {}; }

  const homeSections = [...document.querySelectorAll(".page-view:not(.reader)")];
  const reader = $("reader");
  const drawer = $("chapterDrawer");
  const backdrop = $("drawerBackdrop");
  const content = $("chapterContent");

  function save(extra = {}) {
    const payload = { ...saved, activeNovelIndex, chapterIndex: state.chapterIndex, fontSize: state.fontSize, wide: state.wide, ...extra };
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
    $("activeNovelCount").textContent = chapters.length + (chapters.length === 1 ? " capítulo" : " capítulos");
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
    renderChapter(index, restorePosition);
    $("readerTitle").focus?.({ preventScroll: true });
  }
  function showHome() {
    reader.classList.add("hidden");
    homeSections.forEach(s => s.classList.remove("hidden"));
    closeDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function selectNovel(index) {
    activeNovelIndex = Math.max(0, Math.min(index, novels.length - 1));
    chapters = novels[activeNovelIndex]?.chapters || [];
    state.chapterIndex = 0;
    const novel = novels[activeNovelIndex];
    $("activeNovelTitle").textContent = novel?.title || "Novela";
    $("activeNovelCount").textContent = chapters.length + (chapters.length === 1 ? " capítulo" : " capítulos");
    $("coverTitle").textContent = novel?.title || "Las novelas de Andres";
    $("chapterCount").textContent = novels.length + (novels.length === 1 ? " novela disponible" : " novelas disponibles");
    renderHomeNovels();
    renderHomeChapters();
    renderIndex();
    save({ activeNovelIndex, chapterIndex: 0, scrollY: 0 });
  }
  function renderHomeNovels() {
    const list = $("homeNovelList");
    if (!list) return;
    list.replaceChildren();
    novels.forEach((novel, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "home-novel-card glass" + (i === activeNovelIndex ? " active" : "");
      const icon = document.createElement("span");
      icon.className = "home-novel-symbol";
      icon.textContent = i === 1 ? "☾" : "✦";
      const copy = document.createElement("span");
      copy.className = "home-novel-copy";
      const kicker = document.createElement("small");
      kicker.textContent = "NOVELA · " + String(novel.chapters.length).padStart(2, "0") + (novel.chapters.length === 1 ? " CAPÍTULO" : " CAPÍTULOS");
      const title = document.createElement("strong");
      title.textContent = novel.title;
      const description = document.createElement("span");
      description.textContent = novel.description || "Una historia por descubrir.";
      copy.append(kicker, title, description);
      const mark = document.createElement("span");
      mark.className = "home-novel-check";
      mark.textContent = i === activeNovelIndex ? "✓" : "↗";
      button.append(icon, copy, mark);
      button.addEventListener("click", () => { selectNovel(i); showReader(0); });
      list.appendChild(button);
    });
  }
  function renderHomeChapters() {
    const list = $("homeChapterList");
    if (!list) return;
    list.replaceChildren();
    chapters.forEach((chapter, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "home-chapter-card glass";
      const number = document.createElement("span");
      number.className = "home-chapter-number";
      number.textContent = String(chapter.id).padStart(2, "0");
      const copy = document.createElement("span");
      copy.className = "home-chapter-copy";
      const kicker = document.createElement("small");
      kicker.textContent = "CAPÍTULO " + String(chapter.id).padStart(2, "0");
      const title = document.createElement("strong");
      title.textContent = chapter.title;
      const excerpt = document.createElement("span");
      excerpt.className = "home-chapter-excerpt";
      const firstText = (chapter.paragraphs || []).find(p => p && p.trim());
      excerpt.textContent = firstText || "Abrir capítulo y comenzar a leer.";
      const arrow = document.createElement("span");
      arrow.className = "home-chapter-arrow";
      arrow.textContent = "↗";
      copy.append(kicker, title, excerpt);
      button.append(number, copy, arrow);
      button.addEventListener("click", () => showReader(i));
      list.appendChild(button);
    });
  }

  function renderIndex() {
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

  $("startReading").addEventListener("click", () => {
    const idx = Number.isInteger(saved.chapterIndex) ? saved.chapterIndex : 0;
    showReader(Math.max(0, Math.min(idx, chapters.length - 1)), idx === saved.chapterIndex && Number.isFinite(saved.scrollY));
  });
  $("browseChapters").addEventListener("click", openDrawer);
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
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
    if (event.key === "ArrowLeft" && !reader.classList.contains("hidden") && event.altKey && state.chapterIndex > 0) renderChapter(state.chapterIndex - 1);
    if (event.key === "ArrowRight" && !reader.classList.contains("hidden") && event.altKey && state.chapterIndex < chapters.length - 1) renderChapter(state.chapterIndex + 1);
  });

  activeNovelIndex = Math.max(0, Math.min(Number(saved.activeNovelIndex) || 0, novels.length - 1));
  chapters = novels[activeNovelIndex]?.chapters || [];
  state.fontSize = Math.max(16, Math.min(26, Number(saved.fontSize) || 19));
  state.wide = Boolean(saved.wide);
  setTheme(saved.theme === "light" ? "light" : "dark");
  renderIndex();
  selectNovel(activeNovelIndex);
  if (saved.chapterIndex !== undefined) {
    // Keep the landing page as the initial view; the saved position is restored when the reader opens.
    save({ chapterIndex: Math.max(0, Math.min(Number(saved.chapterIndex) || 0, chapters.length - 1)) });
  }
})();