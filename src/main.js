// import "./theme.css";
// import "./index.css";

/* ── Footer year ──────────────────────────────────────────── */
document.getElementById("year").textContent = new Date().getFullYear();

/* ── Mobile nav toggle ────────────────────────────────────── */
const toggle = document.getElementById("navToggle");
const menu   = document.getElementById("navMenu");

toggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", isOpen);
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

/* ── Settings loader ──────────────────────────────────────── */
/*
  Convention
  ──────────
  data-setting="key.path"       →  element.textContent
  data-setting-src="key.path"   →  element.src
  data-setting-href="key.path"  →  element.href
  data-setting-title="key.path" →  element.title
  data-setting-bg="key.path"    →  element.style.backgroundImage

  Key paths use dot notation into settings.json.
*/
function get(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

/* ── Projects carousel + tag filter ──────────────────────── */

/* Shared carousel state — lets prev/next buttons reference latest goTo */
const cs = { goTo: null, current: 0 };

function buildSlide(project, index) {
  const article = document.createElement("article");
  article.className = "work-card";
  article.id = `project-${index + 1}`;
  article.innerHTML = `
    <img src="${project.image}" alt="${project.title}" class="work-card__image">
    <div class="work-card__body">
      <span class="work-card__tag">${project.tag}</span>
      <h3 class="work-card__title">${project.title}</h3>
      <p class="work-card__desc">${project.description}</p>
      <a href="${project.link}" class="work-card__link">View project</a>
    </div>
  `;
  return article;
}

function loadCarousel(projects) {
  const root     = document.getElementById("workCarousel");
  const track    = root.querySelector(".carousel__track");
  const dotsWrap = root.querySelector(".carousel__dots");
  const btnPrev  = root.querySelector(".carousel__btn--prev");
  const btnNext  = root.querySelector(".carousel__btn--next");

  track.innerHTML    = "";
  dotsWrap.innerHTML = "";
  track.style.transform = "translateX(0)";
  cs.current = 0;
  cs.goTo    = null;

  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "work-card work-card--empty";
    empty.innerHTML = `<p class="work-card__empty">No projects match this filter.</p>`;
    track.appendChild(empty);
    btnPrev.hidden = true;
    btnNext.hidden = true;
    return;
  }

  projects.forEach((p, i) => track.appendChild(buildSlide(p, i)));

  const total   = projects.length;
  const showNav = total > 1;
  btnPrev.hidden = !showNav;
  btnNext.hidden = !showNav;

  if (showNav) {
    projects.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => cs.goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  cs.goTo = function (index) {
    cs.current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${cs.current * 100}%)`;
    dotsWrap.querySelectorAll(".carousel__dot").forEach((d, i) => {
      d.classList.toggle("is-active", i === cs.current);
    });
  };

  cs.goTo(0);
}

function initProjectSection(projects) {
  /* ── Filter buttons ── */
  const filtersEl = document.getElementById("workFilters");
  const tags = ["All", ...new Set(projects.map((p) => p.tag))];

  tags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (tag === "All" ? " is-active" : "");
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      filtersEl.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filtered = tag === "All" ? projects : projects.filter((p) => p.tag === tag);
      loadCarousel(filtered);
    });
    filtersEl.appendChild(btn);
  });

  /* ── Carousel controls (wired once) ── */
  const root  = document.getElementById("workCarousel");
  const track = root.querySelector(".carousel__track");

  root.querySelector(".carousel__btn--prev").addEventListener("click", () => {
    cs.goTo && cs.goTo(cs.current - 1);
  });
  root.querySelector(".carousel__btn--next").addEventListener("click", () => {
    cs.goTo && cs.goTo(cs.current + 1);
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); cs.goTo && cs.goTo(cs.current - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); cs.goTo && cs.goTo(cs.current + 1); }
  });

  let startX = 0;
  track.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  track.addEventListener("pointerup",   (e) => {
    const delta = startX - e.clientX;
    if (Math.abs(delta) > 50) cs.goTo && cs.goTo(cs.current + (delta > 0 ? 1 : -1));
  });

  /* ── Initial load (all projects) ── */
  loadCarousel(projects);
}

/* ── Fetch settings and bootstrap everything ─────────────── */
fetch("/settings.json")
  .then((r) => r.json())
  .then((settings) => {
    /* Generic data-attribute bindings */
    document.querySelectorAll("[data-setting]").forEach((el) => {
      const val = get(settings, el.dataset.setting);
      if (val !== undefined) el.textContent = val;
    });

    document.querySelectorAll("[data-setting-src]").forEach((el) => {
      const val = get(settings, el.dataset.settingSrc);
      if (val !== undefined) el.src = val;
    });

    document.querySelectorAll("[data-setting-href]").forEach((el) => {
      const val = get(settings, el.dataset.settingHref);
      if (val !== undefined) el.href = val;
    });

    document.querySelectorAll("[data-setting-title]").forEach((el) => {
      const val = get(settings, el.dataset.settingTitle);
      if (val !== undefined) el.title = val;
    });

    document.querySelectorAll("[data-setting-bg]").forEach((el) => {
      const val = get(settings, el.dataset.settingBg);
      if (val !== undefined) el.style.backgroundImage = `url(${val})`;
    });

    /* Projects section */
    if (Array.isArray(settings.projects)) {
      initProjectSection(settings.projects);
    }
  })
  .catch((err) => console.warn("settings.json failed to load:", err));
