// render.js — Render report cards from data/reports.json

const MARKET_LABELS = {
  us: { label: "\u{1f1fa}\u{1f1f8} US Equities",   id: "us-equities" },
  a:  { label: "\u{1f1e8}\u{1f1f3} China A-Shares", id: "a-shares" },
  hk: { label: "\u{1f1ed}\u{1f1f0} Hong Kong",      id: "hk-shares" },
  pe: { label: "Private Markets",                    id: "pe-vc" },
};

const TONE_CLASS = {
  bullish: "tone-bullish",
  neutral: "tone-neutral",
  bearish: "tone-bearish",
};

const state = {
  all: [],
  filtered: [],
  search: "",
  market: "all",
  sort: "date-desc",
  minScore: 0,
};

async function loadReports() {
  try {
    const res = await fetch("./data/reports.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.all = data.reports || [];
    state.filtered = [...state.all];
    updateStats();
    applyFilters();
  } catch (err) {
    console.error("Failed to load reports.json:", err);
    const el = document.getElementById("reports-container");
    if (el) el.textContent = "Failed to load report data: " + err.message;
  }
}

function updateStats() {
  const total = state.all.length;
  const marketCount = new Set(state.all.map(r => r.market)).size;
  const bullish = state.all.filter(r => r.verdict_tone === "bullish").length;
  const latestDate = state.all
    .map(r => r.report_date)
    .sort()
    .pop() || "–";

  const statsRow = document.getElementById("stats-row");
  if (!statsRow) return;
  statsRow.replaceChildren();

  const cells = [
    { num: total, cls: "pink", label: "Reports" },
    { num: marketCount, cls: "purple", label: "Markets" },
    { num: bullish, cls: "green", label: "Bullish" },
    { num: latestDate.slice(5).replace("-", "/"), cls: "", label: "Last Updated" },
  ];

  for (const c of cells) {
    const cell = document.createElement("div");
    cell.className = "stat-cell";
    const numEl = document.createElement("div");
    numEl.className = "stat-num" + (c.cls ? " " + c.cls : "");
    numEl.textContent = c.num;
    const labelEl = document.createElement("div");
    labelEl.className = "stat-label";
    labelEl.textContent = c.label;
    cell.append(numEl, labelEl);
    statsRow.appendChild(cell);
  }
}

function renderCard(r) {
  const toneClass = TONE_CLASS[r.verdict_tone] || "tone-neutral";

  const card = document.createElement("div");
  card.className = "rpt-card " + toneClass;
  card.dataset.ticker = r.ticker || "";

  const body = document.createElement("div");
  body.className = "card-body";

  const ticker = document.createElement("div");
  ticker.className = "card-ticker";
  ticker.textContent = (r.ticker || "") + " · " + (r.sector || "");

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = r.name_cn || r.name || "";
  if (r.version && r.version !== "v1") {
    const vb = document.createElement("span");
    vb.className = "version-badge " + (r.verdict_tone || "neutral");
    vb.textContent = r.version;
    name.appendChild(vb);
  }

  const desc = document.createElement("div");
  desc.className = "card-desc";
  desc.textContent = r.one_liner || "";

  const meta = document.createElement("div");
  meta.className = "card-meta";
  for (const b of (r.badges || [])) {
    const span = document.createElement("span");
    span.className = "badge badge-" + (b.variant || "ghost");
    span.textContent = b.label;
    meta.appendChild(span);
  }
  const dateBadge = document.createElement("span");
  dateBadge.className = "badge badge-ghost";
  dateBadge.textContent = (r.report_date || "") + (r.version ? " " + r.version : "");
  meta.appendChild(dateBadge);

  const metrics = document.createElement("div");
  metrics.className = "card-metrics";
  for (const m of (r.metrics || [])) {
    const cm = document.createElement("div");
    cm.className = "cm";
    const cmLabel = document.createElement("div");
    cmLabel.className = "cm-label";
    cmLabel.textContent = m.label;
    const cmVal = document.createElement("div");
    cmVal.className = "cm-val " + (m.tone || "neutral");
    cmVal.textContent = m.value;
    cm.append(cmLabel, cmVal);
    metrics.appendChild(cm);
  }

  body.append(ticker, name, desc, meta, metrics);

  const foot = document.createElement("div");
  foot.className = "card-foot";
  const link = document.createElement("a");
  link.href = "reports/" + encodeURIComponent(r.slug) + "/" + encodeURIComponent(r.report_file || "分析报告_dashboard.html");
  link.textContent = "View Full Report";
  foot.appendChild(link);

  card.append(body, foot);
  return card;
}

function renderSections(reports) {
  const container = document.getElementById("reports-container");
  if (!container) return;
  container.replaceChildren();

  if (reports.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const dash = document.createElement("div");
    dash.className = "icon";
    dash.textContent = "—";
    const msg = document.createElement("div");
    msg.textContent = "No matching reports";
    const hint = document.createElement("div");
    hint.style.marginTop = "8px";
    hint.style.fontSize = "11px";
    hint.textContent = "Try adjusting your search or filters";
    empty.append(dash, msg, hint);
    container.appendChild(empty);
    return;
  }

  const byMarket = {};
  for (const r of reports) {
    (byMarket[r.market] = byMarket[r.market] || []).push(r);
  }

  for (const m of Object.keys(MARKET_LABELS)) {
    if (!byMarket[m] || !byMarket[m].length) continue;
    const info = MARKET_LABELS[m];
    const list = byMarket[m];

    const header = document.createElement("div");
    header.className = "section-header";
    header.id = info.id;
    const labelDiv = document.createElement("div");
    labelDiv.className = "section-label";
    labelDiv.textContent = info.label + " ";
    const countSpan = document.createElement("span");
    countSpan.className = "section-count";
    countSpan.textContent = list.length;
    labelDiv.appendChild(countSpan);
    header.appendChild(labelDiv);

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "cards";
    for (const r of list) {
      cardsDiv.appendChild(renderCard(r));
    }

    container.append(header, cardsDiv);
  }

  const info = document.getElementById("results-info");
  if (info) {
    info.textContent = reports.length === state.all.length
      ? reports.length + " reports"
      : "Showing " + reports.length + " of " + state.all.length + " reports";
  }
}

function applyFilters() {
  let list = [...state.all];

  if (state.market !== "all") {
    list = list.filter(r => r.market === state.market);
  }

  if (state.minScore > 0) {
    list = list.filter(r => (r.composite_score || 0) >= state.minScore);
  }

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter(r => {
      const hay = [r.ticker, r.name, r.name_cn, r.sector, r.one_liner, r.verdict]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  list.sort((a, b) => {
    switch (state.sort) {
      case "date-desc":
        return (b.report_date || "").localeCompare(a.report_date || "");
      case "date-asc":
        return (a.report_date || "").localeCompare(b.report_date || "");
      case "score-desc":
        return (b.composite_score || 0) - (a.composite_score || 0);
      case "score-asc":
        return (a.composite_score || 0) - (b.composite_score || 0);
      default:
        return 0;
    }
  });

  state.filtered = list;
  renderSections(list);
}

function initControls() {
  const searchEl = document.getElementById("search-input");
  if (searchEl) {
    searchEl.addEventListener("input", e => {
      state.search = e.target.value;
      applyFilters();
    });
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.market = btn.dataset.market;
      applyFilters();
    });
  });

  const sortEl = document.getElementById("sort-select");
  if (sortEl) {
    sortEl.addEventListener("change", e => {
      state.sort = e.target.value;
      applyFilters();
    });
  }

  const scoreEl = document.getElementById("min-score");
  if (scoreEl) {
    scoreEl.addEventListener("change", e => {
      state.minScore = parseFloat(e.target.value) || 0;
      applyFilters();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initControls();
  loadReports();
});
