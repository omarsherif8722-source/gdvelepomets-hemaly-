/* Mahmoud Elhemaly · Sales dashboard
   Private, unlisted page: passcode gate, inventory totals and the full unit list.
   The gate keeps the list off the public site; the data file itself is still
   served statically, so treat the passcode as a light lock. */
(() => {
  "use strict";

  // SHA-256 of the passcode. To change it: printf '%s' 'NEW-CODE' | shasum -a 256
  const PASS_HASH = "9459561284b91e9b134bee1b70b2831b17f1979c98c9da1bf8d2388b945d4140";
  const SESSION_KEY = "dash-ok";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("en-US");
  const egp = (n) => nf.format(Math.round(n));
  const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(Math.round(n)));
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");
  const SHARE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>';

  /* ---------------- Gate ---------------- */
  const gate = $("[data-gate]");
  const dash = $("[data-dash]");
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const remembered = () => { try { return sessionStorage.getItem(SESSION_KEY) === PASS_HASH; } catch { return false; } };
  function unlock() { gate.hidden = true; dash.hidden = false; start(); }
  $("[data-gate-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = e.target.elements.code.value.trim();
    if ((await sha256(code)) === PASS_HASH) {
      try { sessionStorage.setItem(SESSION_KEY, PASS_HASH); } catch {}
      unlock();
    } else {
      $("[data-gate-error]").hidden = false;
      e.target.elements.code.select();
    }
  });
  $("[data-lock]").addEventListener("click", () => { try { sessionStorage.removeItem(SESSION_KEY); } catch {} location.reload(); });

  /* ---------------- Helpers ---------------- */
  function initTabs(list, onChange) {
    const tabs = () => $$('[role="tab"]', list);
    const ink = document.createElement("span"); ink.className = "tabs__ink"; list.appendChild(ink);
    const move = (t) => { if (t) { ink.style.width = `${t.offsetWidth}px`; ink.style.transform = `translateX(${t.offsetLeft}px)`; } };
    const select = (tab) => {
      tabs().forEach((t) => { t.setAttribute("aria-selected", String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
      move(tab); onChange && onChange(tab);
    };
    list.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
    list.addEventListener("keydown", (e) => {
      const all = tabs(); const i = all.indexOf(document.activeElement); if (i < 0) return;
      const n = e.key === "ArrowRight" ? all[(i + 1) % all.length] : e.key === "ArrowLeft" ? all[(i - 1 + all.length) % all.length] : null;
      if (n) { e.preventDefault(); n.focus(); select(n); }
    });
    const current = () => tabs().find((t) => t.getAttribute("aria-selected") === "true");
    new ResizeObserver(() => move(current())).observe(list);
    requestAnimationFrame(() => move(current()));
  }
  function initSeg(group, onChange) {
    group.addEventListener("click", (e) => {
      const b = e.target.closest('[role="radio"]'); if (!b) return;
      $$('[role="radio"]', group).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      onChange(b);
    });
  }
  function schedule(price, plan) {
    if (!plan || plan.cashOnly) return null;
    const downPct = plan.down.reduce((a, b) => a + b, 0);
    return (price * (100 - downPct - (plan.atDelivery || 0))) / 100 / plan.installments;
  }

  /* ---------------- Dashboard ---------------- */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    const load = (f) => fetch(`data/${f}.json`, { cache: "no-cache" }).then((r) => r.json());
    load("site_config").then(renderActivity).catch(() => renderActivity({}));
    Promise.all([load("inventory"), load("payment_terms")]).then(([inv, terms]) => {
      const units = inv.units.map((u) => Object.fromEntries(inv.fields.map((f, i) => [f, u[i]])));
      const plans = {};
      terms.destinations.forEach((d) => d.phases.forEach((ph) => { plans[ph.id] = ph.plans[0]; }));
      const name = (id) => (id === "playa" ? "Playa Ghazala" : inv.projects[id].name);
      renderSummary(units, inv, name);
      renderTable(units, inv, plans, name);
    }).catch(() => { $("[data-ats-count]").textContent = "The inventory file could not load. Check data/inventory.json."; });
  }

  const EVENTS = [
    ["Visits", "every page view, counted automatically"],
    ["WhatsApp click", "any WhatsApp button, with where it was pressed"],
    ["Call click", "any call button, with where it was pressed"],
    ["Brochure download", "which PDF was downloaded"],
    ["Film play", "the Krypton film opened"],
    ["Project opened", "which project's details were opened"],
    ["Krypton layout viewed", "which floor plan a visitor picked"],
    ["Payment plan opened", "which destination's plans were explored"],
    ["Brief sent", "the contact form, with interest, budget and terms"],
  ];
  function renderActivity(cfg) {
    const a = (cfg && cfg.analytics) || {};
    const body = $("[data-stats-body]");
    const list = `<ul class="dash__events">${EVENTS.map(([n, d]) => `<li><strong>${n}</strong> ${d}</li>`).join("")}</ul>`;
    if (a.umamiShareUrl) {
      const url = esc(a.umamiShareUrl);
      body.innerHTML = `
        <div class="stats-frame"><iframe src="${url}" title="Website stats from Umami" loading="lazy" referrerpolicy="no-referrer"></iframe></div>
        <p class="dash__note"><a class="btn btn--dark btn--small" href="${url}" target="_blank" rel="noopener">Open the full stats</a> Events appear under the Events tab.</p>
        <details class="dash__details"><summary>What is tracked</summary>${list}</details>`;
      return;
    }
    body.innerHTML = `
      <div class="dash__setup">
        <h3>Stats aren't connected yet</h3>
        <ol>
          <li>Create a free account at <a class="link" href="https://umami.is" target="_blank" rel="noopener">umami.is</a> (Hobby plan: 1 website, 100,000 events a month, 6 months of history).</li>
          <li>Add a website named Mahmoud Elhemaly with the domain <code>mahmoud-elhemaly.onrender.com</code>.</li>
          <li>Open the website's <em>Edit</em> page and copy the <em>Tracking code</em>.</li>
          <li>In <em>Share URL</em>, click <em>Add</em>, include Overview and Events, save, and copy the link.</li>
          <li>Send the tracking code and share link to Claude, or paste them into <code>data/site_config.json</code> under <code>analytics</code> and push.</li>
        </ol>
        <p class="dash__note">Once connected, this panel shows the stats here. The website already sends these events:</p>
        ${list}
      </div>`;
  }

  function renderSummary(units, inv, name) {
    const count = (fn) => units.filter(fn).length;
    const prices = units.map((u) => u.price);
    const dates = Object.values(inv.projects).map((p) => p.asOf).sort();
    $("[data-ats-asof]").textContent = fmtDate(dates[dates.length - 1]);
    const kpis = [
      ["Units on the sheets", nf.format(units.length)],
      ["Available", nf.format(count((u) => u.status === "available"))],
      ["On hold", nf.format(count((u) => u.status === "hold"))],
      ["Being reserved", nf.format(count((u) => u.status === "requested" || u.status === "ready"))],
      ["Price range, EGP", `${short(Math.min(...prices))} – ${short(Math.max(...prices))}`],
    ];
    $("[data-kpis]").innerHTML = kpis.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("[data-projects] tbody").innerHTML = Object.entries(inv.projects).map(([id, p]) => {
      const us = units.filter((u) => u.project === id);
      const ps = us.map((u) => u.price);
      return `<tr><th scope="row">${esc(name(id))}</th><td>${fmtDate(p.asOf)}</td><td>${nf.format(us.length)}</td>
        <td>${nf.format(us.filter((u) => u.status === "available").length)}</td>
        <td>${nf.format(us.filter((u) => u.status === "hold").length)}</td>
        <td>${nf.format(us.filter((u) => u.status === "requested" || u.status === "ready").length)}</td>
        <td>${short(Math.min(...ps))}</td><td>${short(Math.max(...ps))}</td></tr>`;
    }).join("");
  }

  function renderTable(units, inv, plans, name) {
    const tabList = $("[data-ats-tabs]");
    const selPhase = $("[data-ats-phase]"), selType = $("[data-ats-type]"), selSort = $("[data-ats-sort]"), selStatus = $("[data-ats-status]");
    const q = $("[data-ats-q]"), budget = $("[data-ats-budget]"), budgetOut = $("[data-ats-budget-out]"), hist = $("[data-ats-hist]");
    const rowsEl = $("[data-ats-rows]"), countEl = $("[data-ats-count]"), more = $("[data-ats-more]");

    const projects = [["", "All", units.length], ...Object.keys(inv.projects).map((id) => [id, name(id), units.filter((u) => u.project === id).length])];
    tabList.innerHTML = projects.map(([id, n, c], i) => `<button role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ""} data-p="${id}">${esc(n)}<small>${nf.format(c)}</small></button>`).join("");
    const st = { project: "", phase: "", type: "", beds: "", status: "", sort: "price-asc", q: "", max: Infinity, shown: 40 };
    initTabs(tabList, (t) => { st.project = t.dataset.p; st.phase = ""; st.type = ""; st.max = Infinity; fill(); setupBudget(); apply(); });
    initSeg($("[data-ats-beds]"), (b) => { st.beds = b.dataset.v; apply(); });

    const scoped = () => units.filter((u) => !st.project || u.project === st.project);
    function fill() {
      const base = scoped();
      selPhase.innerHTML = `<option value="">All</option>${[...new Set(base.map((u) => u.phase))].map((p) => `<option ${p === st.phase ? "selected" : ""}>${esc(p)}</option>`).join("")}`;
      const types = [...new Set(base.filter((u) => !st.phase || u.phase === st.phase).map((u) => u.type))].sort();
      selType.innerHTML = `<option value="">All</option>${types.map((t) => `<option ${t === st.type ? "selected" : ""}>${esc(t)}</option>`).join("")}`;
    }
    let lo = 0, hi = 1;
    function setupBudget() {
      const ps = scoped().map((u) => u.price);
      lo = Math.log(Math.min(...ps)); hi = Math.log(Math.max(...ps));
      budget.value = 100; drawBudget();
    }
    function drawBudget() {
      st.max = Number(budget.value) >= 100 ? Infinity : Math.round(Math.exp(lo + (Number(budget.value) / 100) * (hi - lo)) / 100000) * 100000;
      budgetOut.textContent = st.max === Infinity ? "Any" : `${short(st.max)} EGP`;
      const bins = new Array(48).fill(0);
      filtered(true).forEach((u) => { bins[Math.min(47, Math.max(0, Math.floor(((Math.log(u.price) - lo) / (hi - lo || 1)) * 48)))]++; });
      const peak = Math.max(1, ...bins);
      const cut = st.max === Infinity ? 48 : ((Math.log(st.max) - lo) / (hi - lo)) * 48;
      hist.innerHTML = bins.map((n, i) => `<i class="${i >= cut ? "off" : ""}" style="height:${n ? Math.max(6, (n / peak) * 100) : 2}%"></i>`).join("");
    }
    function filtered(ignoreBudget) {
      const needle = st.q.trim().toUpperCase();
      return scoped().filter((u) =>
        (!st.phase || u.phase === st.phase) && (!st.type || u.type === st.type) &&
        (!st.beds || (st.beds === "5" ? (u.beds || 0) >= 5 : u.beds === Number(st.beds))) &&
        (!st.status || (st.status === "reserving" ? u.status === "requested" || u.status === "ready" : u.status === st.status)) &&
        (ignoreBudget || u.price <= st.max) && (!needle || u.unit.toUpperCase().includes(needle)));
    }
    const sorters = {
      "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price,
      "bua-desc": (a, b) => (b.bua || 0) - (a.bua || 0), "ppm-asc": (a, b) => a.price / (a.bua || 1e9) - b.price / (b.bua || 1e9),
    };
    function row(u) {
      const pl = plans[u.plan];
      const each = schedule(u.price, pl);
      const land = u.garden ? `Garden ${nf.format(u.garden)} m²` : u.land ? `Land ${nf.format(u.land)} m²` : "";
      const tag = u.status === "hold" ? '<span class="tag tag--hold">On hold</span>' : u.status !== "available" ? '<span class="tag tag--hold">Being reserved</span>' : "";
      const sub = [u.view, u.floor ? (u.floor === "Ground" ? "Ground floor" : `${u.floor} floor`) : ""].filter(Boolean).join(", ");
      const msg = `${name(u.project)}, ${u.phase}\nUnit ${u.unit}: ${u.type}${u.beds ? `, ${u.beds} bedrooms` : ""}${u.bua ? `, ${u.bua} m²` : ""}${land ? `, ${land.toLowerCase()}` : ""}\nPrice: ${egp(u.price)} EGP${each ? `\nAbout ${egp(each)} EGP per ${pl.annual ? "year" : "quarter"} over ${pl.years} years` : ""}`;
      return `<div class="ats__row" role="row">
        <span class="ats__unit" role="cell"><strong>${esc(u.unit)}</strong><span>${esc(name(u.project))}, ${esc(u.phase)}</span>${tag}</span>
        <span class="ats__home" role="cell">${esc(u.type)}${sub ? `<span>${esc(sub)}</span>` : ""}</span>
        <span class="ats__cell-beds" role="cell">${u.beds ?? "–"}</span>
        <span class="ats__cell-bua" role="cell">${u.bua ? `${nf.format(u.bua)} m²` : "–"}</span>
        <span class="ats__cell-land" role="cell">${land}</span>
        <span class="ats__price" role="cell">${egp(u.price)}</span>
        <span class="ats__quarter" role="cell">${each ? `${short(each)}<small>per ${pl.annual ? "year" : "quarter"}, ${pl.years} yrs</small>` : "Cash<small>handover soon</small>"}</span>
        <span role="cell"><a class="ats__ask" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" aria-label="Send unit ${esc(u.unit)} to a client on WhatsApp">${SHARE_ICON}Send to client</a></span>
      </div>`;
    }
    let current = [];
    function apply(keep) {
      if (!keep) st.shown = 40;
      current = filtered().sort(sorters[st.sort]);
      countEl.innerHTML = current.length ? `<strong>${nf.format(current.length)}</strong> ${current.length === 1 ? "unit" : "units"}, from ${egp(Math.min(...current.map((u) => u.price)))} EGP.` : "No units match these filters.";
      rowsEl.innerHTML = current.slice(0, st.shown).map(row).join("");
      more.hidden = current.length <= st.shown;
      more.textContent = `Show more units (${nf.format(current.length - st.shown)} left)`;
      drawBudget();
    }
    selPhase.addEventListener("change", () => { st.phase = selPhase.value; st.type = ""; fill(); apply(); });
    selType.addEventListener("change", () => { st.type = selType.value; apply(); });
    selStatus.addEventListener("change", () => { st.status = selStatus.value; apply(); });
    selSort.addEventListener("change", () => { st.sort = selSort.value; apply(); });
    q.addEventListener("input", () => { st.q = q.value; apply(); });
    budget.addEventListener("input", () => { drawBudget(); apply(); });
    more.addEventListener("click", () => { st.shown += 40; apply(true); });

    $("[data-ats-export]").addEventListener("click", () => {
      const head = ["Project", "Phase", "Unit", "Type", "Bedrooms", "Floor", "View", "Built-up m2", "Land m2", "Garden m2", "Price EGP", "Status"];
      const lines = [head, ...current.map((u) => [name(u.project), u.phase, u.unit, u.type, u.beds ?? "", u.floor ?? "", u.view ?? "", u.bua ?? "", u.land ?? "", u.garden ?? "", u.price, u.status])];
      const csv = lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = `availability-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    fill(); setupBudget(); apply();
  }

  // Reopen without the passcode for the rest of this browser session
  if (remembered()) unlock();
})();
