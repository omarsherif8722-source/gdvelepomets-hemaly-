/* Omar Sherif · Private advisory for G Developments
   One script, no dependencies. Data lives in /data/*.json. */
(() => {
  "use strict";

  const WA_NUMBER = "201227275122";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("en-US");
  const egp = (n) => nf.format(Math.round(n));
  const short = (n) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
    return String(Math.round(n));
  };
  const wa = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>';

  const picture = (base, alt, sizes = "100vw", eager = false) => {
    if (!base) return "";
    return `<img src="${base}.jpg" srcset="${base}-sm.jpg 800w, ${base}.jpg 1800w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
  };

  /* ------------------------------------------------------------------ */
  /* Tabs: roving focus, arrow keys, sliding ink                         */
  /* ------------------------------------------------------------------ */
  function initTabs(list, onChange) {
    const tabs = () => $$('[role="tab"]', list);
    let ink = $(".tabs__ink", list);
    if (!ink) { ink = document.createElement("span"); ink.className = "tabs__ink"; ink.setAttribute("aria-hidden", "true"); list.appendChild(ink); }
    const moveInk = (tab) => {
      if (!tab) return;
      ink.style.width = `${tab.offsetWidth}px`;
      ink.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    const select = (tab, focus = false, silent = false) => {
      tabs().forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panelId = t.getAttribute("aria-controls");
        const panel = panelId && document.getElementById(panelId);
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      moveInk(tab);
      if (list.scrollWidth > list.clientWidth) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
      if (!silent && onChange) onChange(tab);
    };
    list.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab && list.contains(tab)) select(tab);
    });
    list.addEventListener("keydown", (e) => {
      const all = tabs();
      const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === "ArrowRight") next = all[(i + 1) % all.length];
      if (e.key === "ArrowLeft") next = all[(i - 1 + all.length) % all.length];
      if (e.key === "Home") next = all[0];
      if (e.key === "End") next = all[all.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
    const current = () => tabs().find((t) => t.getAttribute("aria-selected") === "true") || tabs()[0];
    new ResizeObserver(() => moveInk(current())).observe(list);
    document.fonts && document.fonts.ready.then(() => moveInk(current()));
    requestAnimationFrame(() => moveInk(current()));
    return { select: (tab, silent) => select(tab, false, silent), current, refresh: () => moveInk(current()) };
  }

  // Segmented radio groups
  function initSeg(group, onChange) {
    const btns = () => $$('[role="radio"]', group);
    const set = (btn, silent) => {
      btns().forEach((b) => { b.setAttribute("aria-checked", String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
      if (!silent && onChange) onChange(btn);
    };
    group.addEventListener("click", (e) => { const b = e.target.closest('[role="radio"]'); if (b) set(b); });
    group.addEventListener("keydown", (e) => {
      const all = btns(); const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = all[(i + d + all.length) % all.length]; n.focus(); set(n);
    });
    btns().forEach((b) => (b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1));
    return { set: (btn, silent) => set(btn, silent), value: () => btns().find((b) => b.getAttribute("aria-checked") === "true") };
  }

  /* ------------------------------------------------------------------ */
  /* Masthead, hero, navigation                                          */
  /* ------------------------------------------------------------------ */
  const masthead = $("[data-masthead]");
  const hero = $("[data-hero]");
  const menuBtn = $("[data-menu]");
  const mobileNav = $("#mobile-nav");

  function onScroll() {
    const y = window.scrollY;
    const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, y / travel));
    if (!reduceMotion) hero.style.setProperty("--p", p.toFixed(4));
    masthead.classList.toggle("is-solid", y > travel - 40 || !mobileNav.hidden);
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Fit the knockout wordmark to the screen
  const maskWord = $(".hero__mask span");
  function fitMask() {
    if (!maskWord) return;
    maskWord.style.setProperty("--fit", "100px");
    const w = maskWord.getBoundingClientRect().width || 1;
    const byWidth = (100 * window.innerWidth * (window.innerWidth < 760 ? 0.96 : 0.9)) / w;
    const byHeight = window.innerHeight * 0.62;
    maskWord.style.setProperty("--fit", `${Math.min(byWidth, byHeight).toFixed(1)}px`);
  }
  fitMask();
  window.addEventListener("resize", fitMask);
  document.fonts && document.fonts.ready.then(fitMask);

  const heroVideo = $("[data-hero-video]");
  if (reduceMotion && heroVideo) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }
  // Pause the hero loop when it is off screen
  if (heroVideo && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      if (reduceMotion) return;
      if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause();
    }).observe(hero);
  }

  menuBtn.addEventListener("click", () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    onScroll();
  });
  mobileNav.addEventListener("click", (e) => {
    if (e.target.closest("a")) { mobileNav.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; document.body.style.overflow = ""; onScroll(); }
  });

  // Current section in the nav
  const navLinks = $$(".masthead__nav a");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["krypton", "portfolio", "payments", "availability", "brochures", "contact"].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------------ */
  /* Film + lightbox                                                     */
  /* ------------------------------------------------------------------ */
  const film = $("[data-film]");
  const filmVideo = $("[data-film-video]");
  $$("[data-film-open]").forEach((b) => b.addEventListener("click", () => {
    film.showModal();
    filmVideo.currentTime = 0;
    filmVideo.play().catch(() => {});
  }));
  $("[data-film-close]").addEventListener("click", () => film.close());
  film.addEventListener("close", () => filmVideo.pause());
  film.addEventListener("click", (e) => { if (e.target === film) film.close(); });

  const lb = $("[data-lightbox-dialog]");
  const lbImg = $("[data-lightbox-img]");
  const lbCap = $("[data-lightbox-cap]");
  let lbList = [], lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    const it = lbList[lbIndex];
    lbImg.src = it.src; lbImg.alt = it.caption || "";
    lbCap.textContent = it.caption || "";
    $$(".lightbox__nav", lb).forEach((b) => (b.hidden = lbList.length < 2));
  }
  function openLightbox(list, i = 0) { lbList = list; lbShow(i); if (!lb.open) lb.showModal(); }
  $("[data-lightbox-close]").addEventListener("click", () => lb.close());
  $("[data-lightbox-prev]").addEventListener("click", () => lbShow(lbIndex - 1));
  $("[data-lightbox-next]").addEventListener("click", () => lbShow(lbIndex + 1));
  lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") lbShow(lbIndex - 1); if (e.key === "ArrowRight") lbShow(lbIndex + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-lightbox]");
    if (!a) return;
    e.preventDefault();
    openLightbox([{ src: a.getAttribute("href"), caption: a.dataset.caption }]);
  });

  /* ------------------------------------------------------------------ */
  /* Data                                                                */
  /* ------------------------------------------------------------------ */
  const load = (f) => fetch(`data/${f}.json`, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${f}.json ${r.status}`); return r.json(); });

  Promise.all([load("krypton"), load("portfolio"), load("payment_terms"), load("inventory"), load("site_config")])
    .then(([krypton, portfolio, terms, inv, config]) => {
      const units = inv.units.map((u) => Object.fromEntries(inv.fields.map((f, i) => [f, u[i]])));
      const ctx = { krypton, portfolio, terms, inv, units, config };
      ctx.planById = {};
      terms.destinations.forEach((d) => d.phases.forEach((ph) => { ctx.planById[ph.id] = { ...ph, destination: d }; }));
      renderStats(ctx);
      renderKrypton(ctx);
      renderAtlas(ctx);
      renderAtelier(ctx);
      renderAvailability(ctx);
      renderLibrary(ctx);
      renderContact(ctx);
      document.documentElement.classList.add("is-ready");
    })
    .catch((err) => {
      console.error(err);
      $$("[data-ats-count], [data-pay-result], [data-atlas-view]").forEach((el) => {
        el.innerHTML = `<p class="muted">Live data could not load. Message Omar on WhatsApp at +20 122 727 5122 for current prices and availability.</p>`;
      });
    });

  /* ------------------------------------------------------------------ */
  /* Payment maths (shared)                                              */
  /* ------------------------------------------------------------------ */
  function schedule(price, plan) {
    if (plan.cashOnly) return { cashOnly: true, total: price };
    const down = plan.down.map((p) => (price * p) / 100);
    const downPct = plan.down.reduce((a, b) => a + b, 0);
    const atDelivery = plan.atDelivery || 0;
    const restPct = 100 - downPct - atDelivery;
    const each = plan.installments ? (price * restPct) / 100 / plan.installments : 0;
    const cashPrice = plan.cash ? price * (1 - plan.cash / 100) : null;
    return { down, downPct, atDelivery, restPct, each, cashPrice };
  }
  const planLabel = (pl) => {
    if (pl.cashOnly) return "Cash payment";
    const d = pl.down.length > 1 ? `${pl.down[0]}% down, ${pl.down[1]}% after 3 months` : pl.down[0] ? `${pl.down[0]}% down` : "No down payment";
    return `${pl.years} years, ${d}`;
  };
  const planSentence = (pl, maint) => {
    if (pl.cashOnly) return `Cash payment${pl.delivery ? `, delivery in ${pl.delivery} months` : ""}.`;
    const parts = [planLabel(pl)];
    parts.push(`${pl.installments} ${pl.annual ? "annual" : "quarterly"} installments`);
    if (pl.atDelivery) parts.push(`${pl.atDelivery}% on delivery`);
    if (pl.delivery) parts.push(`delivery in ${pl.delivery} months`);
    if (pl.cash) parts.push(`${pl.cash}% cash discount`);
    return parts.join(", ") + ".";
  };

  /* ------------------------------------------------------------------ */
  /* Stats                                                               */
  /* ------------------------------------------------------------------ */
  function renderStats({ units, inv }) {
    const el = $('[data-stat="units"]');
    if (el) el.textContent = nf.format(units.length);
    const note = $('[data-stat="units-note"]');
    const dates = Object.values(inv.projects).map((p) => p.asOf).sort();
    const last = dates[dates.length - 1];
    if (note && last) note.textContent = `units across ${Object.keys(inv.projects).length} destinations, as of ${new Date(last).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
  }

  /* ------------------------------------------------------------------ */
  /* Krypton                                                             */
  /* ------------------------------------------------------------------ */
  function renderKrypton({ krypton }) {
    const krTabs = initTabs($('.krypton [role="tablist"]'));
    const tabFor = (id) => $(`#${id}`);

    // Residences
    const band = $("[data-kr-band]");
    const list = $("[data-kr-list]");
    const planEl = $("[data-kr-plan]");
    let beds = 1, code = null;
    const layoutsFor = (b) => krypton.layouts.filter((l) => l.beds === b);

    function showLayout(c) {
      code = c;
      const l = krypton.layouts.find((x) => x.code === c);
      $$("button", list).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.code === c)));
      const sizes = l.sqmMax !== l.sqm ? `${l.sqm} – ${l.sqmMax} m²` : `${l.sqm} m²`;
      const bandInfo = krypton.priceBands.find((p) => p.beds === l.beds);
      const bedWord = ["", "One bedroom", "Two bedrooms", "Three bedrooms"][l.beds];
      planEl.innerHTML = `
        <article class="plan-card">
          <div class="plan-card__head">
            <h3 class="plan-card__title">${esc(l.code)} <span>/</span> ${sizes}</h3>
            <p class="plan-card__meta">${bedWord}${l.units ? `, ${l.units} homes of this layout in Block 1` : ""}</p>
          </div>
          <div class="plan-card__body">
            <button class="plan-card__img" type="button" data-zoom="${esc(l.plan)}" aria-label="Enlarge floor plan ${esc(l.code)}">
              <img src="${esc(l.plan)}" alt="Floor plan of Krypton layout ${esc(l.code)}, ${sizes}" loading="lazy">
            </button>
            <div>
              <ul class="rooms">${l.rooms.map((r) => `<li><span>${r.n}</span><span>${esc(r.room)}</span><span>${esc(r.dims)} m</span></li>`).join("")}</ul>
              ${l.variants.length ? `<p class="plan-card__variants">Variants: ${l.variants.map((v) => `${esc(v.code)} ${v.sqm} m²`).join(", ")}.</p>` : ""}
              <p class="plan-card__variants">${bedWord} prices run ${short(bandInfo.min)} to ${short(bandInfo.max)} EGP depending on floor and view.</p>
            </div>
          </div>
          <div class="plan-card__actions">
            <a class="btn btn--dark btn--small" href="${wa(`Hello Omar, I'm interested in Krypton layout ${l.code} (${sizes}). Which units are available and at what price?`)}" target="_blank" rel="noopener">${WA_ICON} Ask about ${esc(l.code)}</a>
            <button class="btn btn--line btn--small" type="button" data-kr-paybeds="${l.beds}">Payments for this size</button>
          </div>
        </article>`;
    }
    function showBeds(b, keepCode) {
      beds = b;
      const pb = krypton.priceBands.find((p) => p.beds === b);
      band.innerHTML = `<strong>${pb.label}</strong>, ${pb.sqm} m², ${short(pb.min)} – ${short(pb.max)} EGP`;
      const ls = layoutsFor(b);
      list.innerHTML = ls.map((l) => `
        <li><button type="button" aria-pressed="false" data-code="${esc(l.code)}">
          <span class="homes__code">${esc(l.code)}</span>
          <span class="homes__size">${l.sqmMax !== l.sqm ? `${l.sqm} – ${l.sqmMax}` : l.sqm} m²</span>
          <span class="homes__count">${l.units ? `${l.units} in Block 1` : "On request"}</span>
        </button></li>`).join("");
      showLayout(keepCode && ls.some((l) => l.code === keepCode) ? keepCode : ls[0].code);
    }
    const bedSeg = initSeg($("[data-kr-beds]"), (btn) => showBeds(Number(btn.dataset.beds)));
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-code]");
      if (!b) return;
      showLayout(b.dataset.code);
      if (window.innerWidth < 960) planEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    planEl.addEventListener("click", (e) => {
      const z = e.target.closest("[data-zoom]");
      if (z) openLightbox([{ src: z.dataset.zoom, caption: `Krypton layout ${code}` }]);
      const p = e.target.closest("[data-kr-paybeds]");
      if (p) { krTabs.select(tabFor("kt-pay")); paySeg.set($(`[data-krpay-beds] [data-beds="${p.dataset.krPaybeds}"]`)); }
    });
    showBeds(1);

    function goToLayout(layoutCode) {
      const base = layoutCode.slice(0, 5);
      const l = krypton.layouts.find((x) => x.code === base);
      if (!l) return;
      krTabs.select(tabFor("kt-homes"));
      bedSeg.set($(`[data-kr-beds] [data-beds="${l.beds}"]`), true);
      showBeds(l.beds, base);
      $("[data-kr-homes]").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    // Floor by floor
    const floorWrap = $("[data-kr-floor]");
    const plateEl = $("[data-kr-plate]");
    const unitsEl = $("[data-kr-units]");
    let block = "Block 1", floor = "Second";
    function renderFloors() {
      const floors = krypton.blockFloors[block];
      floorWrap.innerHTML = [...floors].reverse().map((f) => `
        <button type="button" role="radio" aria-checked="${f.floor === floor}" data-floor="${f.floor}">
          <span>${f.floor} floor</span><span>${f.units.length} released</span>
        </button>`).join("");
      initSeg(floorWrap, (b) => { floor = b.dataset.floor; renderFloor(); });
      renderFloor();
    }
    function renderFloor() {
      const f = krypton.blockFloors[block].find((x) => x.floor === floor);
      const src = krypton.plates[block][floor];
      plateEl.innerHTML = `<img src="${src}" alt="${block}, ${floor.toLowerCase()} floor plate" loading="lazy">`;
      plateEl.onclick = () => openLightbox([{ src, caption: `Krypton ${block}, ${floor.toLowerCase()} floor` }]);
      unitsEl.innerHTML = f.units.map((u) => `
        <li><button type="button" data-layout="${esc(u.layout)}">
          <strong>${esc(u.unit)}</strong>
          <span>Layout ${esc(u.layout)}, ${u.sqm} m², ${u.view === "Park" ? "park and pool view" : "Boulevard view"}</span>
        </button></li>`).join("");
    }
    initSeg($("[data-kr-block]"), (b) => { block = b.dataset.block; renderFloors(); });
    unitsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-layout]"); if (b) goToLayout(b.dataset.layout); });
    renderFloors();

    // Payment
    const range = $("[data-krpay-range]");
    const out = $("[data-krpay-out]");
    const ends = $("[data-krpay-ends]");
    const steps = $("[data-krpay-steps]");
    const kp = krypton.payment;
    let payBand = krypton.priceBands[1];
    function renderPay() {
      const price = Number(range.value);
      out.textContent = `${egp(price)} EGP`;
      const each = (price * (100 - kp.down[0] - kp.down[1])) / 100 / kp.installments;
      steps.innerHTML = `
        <li><span class="step__what">Down payment</span><span class="step__when">At reservation, starting with your 5% expression of interest</span><span class="step__amt">${egp((price * kp.down[0]) / 100)}<small>${kp.down[0]}% of the price</small></span></li>
        <li><span class="step__what">Second payment</span><span class="step__when">Three months after reservation</span><span class="step__amt">${egp((price * kp.down[1]) / 100)}<small>${kp.down[1]}% of the price</small></span></li>
        <li><span class="step__what">Quarterly installments</span><span class="step__when">${kp.installments} equal payments over ${kp.years} years</span><span class="step__amt">${egp(each)}<small>each quarter, 90% in total</small></span></li>
        <li><span class="step__what">Maintenance deposit</span><span class="step__when">Due 12 months before delivery</span><span class="step__amt">${egp((price * kp.maintenance) / 100)}<small>${kp.maintenance}% of the price</small></span></li>`;
      range.setAttribute("aria-valuetext", `${egp(price)} Egyptian pounds`);
    }
    function setPayBand(b) {
      payBand = krypton.priceBands.find((p) => p.beds === b);
      range.min = payBand.min; range.max = payBand.max; range.step = 5000;
      range.value = payBand.min;
      ends.innerHTML = `<span>${short(payBand.min)}</span><span>${short(payBand.max)}</span>`;
      renderPay();
    }
    const paySeg = initSeg($("[data-krpay-beds]"), (btn) => setPayBand(Number(btn.dataset.beds)));
    range.addEventListener("input", renderPay);
    setPayBand(2);

    // Gallery
    const gal = [
      ["kr-dusk", "Krypton's retail street at dusk"], ["kr-aerial", "Aerial view of Krypton and The Boulevard"], ["kr-pool", "Residents' pool and park"],
      ["kr-balcony", "Terrace looking over the park"], ["kr-tram", "Electric tram on The Boulevard"], ["kr-canopy", "The canopy plaza"],
      ["kr-arcade", "Shaded arcade under the residences"], ["kr-garden", "Garden walk between blocks"], ["kr-terraces", "Planted terraces over the shops"],
      ["kr-retail", "Cafés and shops at street level"], ["kr-facade", "Curved façades and deep balconies"], ["kr-park", "Paths through the park"],
      ["kr-terrace", "Rooftop lounge"], ["kr-promenade", "The promenade"], ["kr-aerial-2", "Krypton blocks from above"], ["kr-street-life", "Street life on The Boulevard"],
    ].map(([f, c]) => ({ base: `assets/img/krypton/${f}`, caption: c }));
    const galEl = $("[data-kr-gallery]");
    galEl.innerHTML = gal.map((g, i) => `<button type="button" data-i="${i}" aria-label="Open image: ${esc(g.caption)}">${picture(g.base, g.caption, "(min-width: 900px) 33vw, 100vw")}</button>`).join("");
    galEl.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) openLightbox(gal.map((g) => ({ src: `${g.base}.jpg`, caption: g.caption })), Number(b.dataset.i)); });
  }

  /* ------------------------------------------------------------------ */
  /* Portfolio atlas + dossier                                           */
  /* ------------------------------------------------------------------ */
  const unitsFor = (ctx, p) => {
    if (!p.inventory) return [];
    return ctx.units.filter((u) => u.project === p.inventory.project && (!p.inventory.phases || p.inventory.phases.includes(u.phase)));
  };

  function renderAtlas(ctx) {
    const { portfolio } = ctx;
    const tabList = $("[data-region-tabs]");
    const listEl = $("[data-atlas-list]");
    const view = $("[data-atlas-view]");
    const line = $("[data-region-line]");
    tabList.innerHTML = portfolio.regions.map((r, i) => {
      const n = portfolio.projects.filter((p) => p.region === r.id).length;
      return `<button role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ""} data-region="${r.id}">${esc(r.name)}<small>${n}</small></button>`;
    }).join("");
    let current = null;

    function showRegion(id) {
      const r = portfolio.regions.find((x) => x.id === id);
      line.textContent = r.line;
      const ps = portfolio.projects.filter((p) => p.region === id);
      listEl.innerHTML = ps.map((p) => `
        <li><button type="button" aria-pressed="false" data-project="${p.id}">
          <span class="atlas__name">${esc(p.name)}</span>
          <span class="atlas__status">${esc(p.status)}</span>
          ${p.parent ? `<span class="atlas__parent">${esc(p.parent)}</span>` : ""}
        </button></li>`).join("");
      showProject(ps[0].id);
    }
    function showProject(id) {
      const p = portfolio.projects.find((x) => x.id === id);
      current = p;
      $$("button", listEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.project === id)));
      const us = unitsFor(ctx, p);
      const min = us.length ? Math.min(...us.map((u) => u.price)) : null;
      const pay = p.payment ? ctx.planById[p.payment.phases[0]] : null;
      view.innerHTML = `
        <figure class="atlas__figure">
          ${p.image ? picture(p.image, `${p.name}, ${p.place}`, "(min-width: 960px) 55vw, 100vw") : `<div class="typo-panel"><span>${esc(p.name)}</span></div>`}
          ${p.illustrative && p.image ? "<figcaption>Illustrative image</figcaption>" : ""}
        </figure>
        <p class="atlas__place">${esc(p.place)}</p>
        <h3 class="atlas__title">${esc(p.name)}</h3>
        <p class="atlas__intro">${esc(p.intro)}</p>
        <dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        ${us.length ? `<p class="muted">${us.length === 1 ? "One unit is" : `${nf.format(us.length)} units are`} on the availability sheet today, from ${egp(min)} EGP.</p>` : ""}
        <div class="atlas__actions">
          <button class="btn btn--dark" type="button" data-open-dossier="${p.id}">Open the full details</button>
          ${us.length ? `<button class="btn btn--line" type="button" data-see-units="${p.id}">${us.length === 1 ? "See the available unit" : `See ${nf.format(us.length)} available units`}</button>` : ""}
          ${!us.length && pay ? `<button class="btn btn--line" type="button" data-see-plan="${p.id}">Work out the payments</button>` : ""}
          ${!us.length && !pay ? `<a class="btn btn--line" href="${wa(`Hello Omar, I'd like to hear about ${p.name}.`)}" target="_blank" rel="noopener">Ask Omar about ${esc(p.name)}</a>` : ""}
        </div>`;
    }
    initTabs(tabList, (tab) => showRegion(tab.dataset.region));
    listEl.addEventListener("click", (e) => { const b = e.target.closest("[data-project]"); if (b) showProject(b.dataset.project); });
    view.addEventListener("click", (e) => {
      const d = e.target.closest("[data-open-dossier]");
      if (d) openDossier(ctx, d.dataset.openDossier);
      const s = e.target.closest("[data-see-units]");
      if (s) ctx.showUnits && ctx.showUnits(portfolio.projects.find((x) => x.id === s.dataset.seeUnits));
      const pl = e.target.closest("[data-see-plan]");
      if (pl) ctx.showPlan && ctx.showPlan(portfolio.projects.find((x) => x.id === pl.dataset.seePlan));
    });
    showRegion(portfolio.regions[0].id);
  }

  function typesSummary(us) {
    const by = new Map();
    us.forEach((u) => {
      const k = u.type;
      const g = by.get(k) || { type: k, n: 0, min: Infinity, bmin: Infinity, bmax: 0 };
      g.n++; g.min = Math.min(g.min, u.price);
      if (u.bua) { g.bmin = Math.min(g.bmin, u.bua); g.bmax = Math.max(g.bmax, u.bua); }
      by.set(k, g);
    });
    return [...by.values()].sort((a, b) => a.min - b.min);
  }

  function openDossier(ctx, id) {
    const p = ctx.portfolio.projects.find((x) => x.id === id);
    const dlg = $("[data-dossier]");
    const body = $("[data-dossier-body]");
    const us = unitsFor(ctx, p);
    const types = typesSummary(us);
    const phases = p.payment ? p.payment.phases.map((pid) => ctx.planById[pid]).filter(Boolean) : [];
    const dest = phases[0] && phases[0].destination;
    const books = (p.brochures || []).map((b) => LIBRARY.find((x) => x.id === b)).filter(Boolean);
    const homesHtml = types.length
      ? `<ul class="typelist">${types.map((t) => `<li><strong>${esc(t.type)}</strong><span>${t.bmin < Infinity ? (t.bmin === t.bmax ? `${t.bmin} m²` : `${t.bmin} – ${t.bmax} m²`) : ""}, ${t.n} available</span><em>from ${short(t.min)}</em></li>`).join("")}</ul>`
      : p.homes ? `<ul class="typelist">${p.homes.map((h) => `<li><strong>${esc(h.name)}</strong><span>${esc(h.size)}</span><em>from ${short(h.from)}</em></li>`).join("")}</ul>`
      : `<p class="muted">Unit lists for ${esc(p.name)} are shared on request.</p>`;
    body.innerHTML = `
      <div class="dossier__hero">
        <button class="dossier__close" type="button" data-dossier-close>Close</button>
        ${p.image ? picture(p.image, p.name, "760px", true) : `<div class="typo-panel"><span>${esc(p.name)}</span></div>`}
      </div>
      <div class="dossier__head">
        <p class="brandline">${p.parent ? `${esc(p.parent)}<span>/</span>` : "G Developments<span>/</span>"}${esc(p.name)}</p>
        <h2 id="dossier-title">${esc(p.name)}</h2>
        <p class="muted">${esc(p.place)}${p.illustrative && p.image ? ". Image is illustrative." : ""}</p>
      </div>
      <div class="dossier__body">
        <div class="tabs" role="tablist" aria-label="${esc(p.name)} details">
          <button role="tab" id="dt-o" aria-controls="dp-o" aria-selected="true">Overview</button>
          <button role="tab" id="dt-h" aria-controls="dp-h" aria-selected="false" tabindex="-1">Homes</button>
          <button role="tab" id="dt-p" aria-controls="dp-p" aria-selected="false" tabindex="-1">Payment</button>
          ${books.length ? '<button role="tab" id="dt-b" aria-controls="dp-b" aria-selected="false" tabindex="-1">Brochures</button>' : ""}
        </div>
        <div role="tabpanel" id="dp-o" aria-labelledby="dt-o" class="panel">
          <p>${esc(p.intro)}</p>
          <dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
          <ul class="ticks">${(p.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        </div>
        <div role="tabpanel" id="dp-h" aria-labelledby="dt-h" class="panel" hidden>
          ${us.length ? `<p class="muted">${nf.format(us.length)} units on the developer's availability sheet, grouped by type.</p>` : ""}
          ${homesHtml}
        </div>
        <div role="tabpanel" id="dp-p" aria-labelledby="dt-p" class="panel" hidden>
          ${phases.length ? `<ul class="planlist">${phases.map((ph) => `<li><strong>${esc(ph.name)}</strong>${ph.plans.map((pl) => `<span>${esc(planSentence(pl))}</span>`).join("<br>")}${ph.note ? `<br><span>${esc(ph.note)}</span>` : ""}</li>`).join("")}</ul>
          <p class="muted" style="margin-top:14px">Maintenance: ${dest.maintenance.pct}% of the unit price, due ${esc(dest.maintenance.due)}.${dest.maintenance.extra ? ` ${esc(dest.maintenance.extra)}.` : ""} Source: Standard Payment Plans, October 18, 2026.</p>`
          : `<p class="muted">Payment terms for ${esc(p.name)} are quoted per unit. Ask Omar for the current offer.</p>`}
        </div>
        ${books.length ? `<div role="tabpanel" id="dp-b" aria-labelledby="dt-b" class="panel" hidden><ul class="planlist">${books.map((b) => `<li><strong>${esc(b.title)}</strong><span>${esc(b.meta)}</span><br><a class="link" href="${b.file}" download>Download the PDF</a></li>`).join("")}</ul></div>` : ""}
        <div class="dossier__cta">
          <a class="btn btn--dark" href="${wa(`Hello Omar, I'd like details on ${p.parent ? `${p.parent} ${p.name}` : p.name}.`)}" target="_blank" rel="noopener">${WA_ICON} Ask Omar about ${esc(p.name)}</a>
          ${us.length ? `<button class="btn btn--line" type="button" data-dossier-units>See available units</button>` : ""}
          ${p.anchor ? `<a class="btn btn--line" href="${p.anchor}" data-dossier-close>Explore ${esc(p.name)}</a>` : ""}
        </div>
      </div>`;
    initTabs($('[role="tablist"]', body));
    dlg.showModal();
    body.scrollTop = 0;
    body.onclick = (e) => {
      if (e.target.closest("[data-dossier-close]")) dlg.close();
      if (e.target.closest("[data-dossier-units]")) { dlg.close(); ctx.showUnits(p); }
    };
  }
  $("[data-dossier]").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  /* ------------------------------------------------------------------ */
  /* Payment atelier                                                     */
  /* ------------------------------------------------------------------ */
  const LOG_MIN = Math.log(3e6), LOG_MAX = Math.log(150e6);
  const toSlider = (price) => Math.round(((Math.log(price) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
  const fromSlider = (v) => Math.round(Math.exp(LOG_MIN + (v / 1000) * (LOG_MAX - LOG_MIN)) / 10000) * 10000;

  function renderAtelier(ctx) {
    const { terms, units } = ctx;
    const tabList = $("[data-pay-tabs]");
    const phasesEl = $("[data-pay-phases]");
    const plansEl = $("[data-pay-plans]");
    const priceIn = $("[data-pay-price]");
    const range = $("[data-pay-range]");
    const note = $("[data-pay-note]");
    const result = $("[data-pay-result]");
    range.min = 0; range.max = 1000; range.step = 1;

    let dest = terms.destinations[0], phase = dest.phases[0], planIdx = 0, price = 11287500;
    const typical = (ph) => {
      const ps = units.filter((u) => u.plan === ph.id).map((u) => u.price).sort((a, b) => a - b);
      if (ps.length) return ps[Math.floor(ps.length * 0.25)];
      return { "nk-krypton": 11287500, "md-b12": 14400000, "md-b34": 14400000, "al-cypher": 19829000, "pr-all": 15300000, "ng-utilities": 1500000 }[ph.id] || 20000000;
    };

    tabList.innerHTML = terms.destinations.map((d, i) => `<button role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ""} data-dest="${d.id}">${esc(d.name)}</button>`).join("");
    const tabs = initTabs(tabList, (t) => setDest(t.dataset.dest));

    function setDest(id, phaseId, keepPrice) {
      dest = terms.destinations.find((d) => d.id === id);
      phasesEl.innerHTML = `<legend>Phase</legend>${dest.phases.map((ph) => `<button type="button" aria-pressed="false" data-phase="${ph.id}">${esc(ph.name)}</button>`).join("")}`;
      setPhase(phaseId || dest.phases[0].id, keepPrice);
    }
    function setPhase(id, keepPrice) {
      phase = dest.phases.find((p) => p.id === id) || dest.phases[0];
      $$("[data-phase]", phasesEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.phase === phase.id)));
      planIdx = 0;
      plansEl.hidden = phase.plans.length < 2;
      plansEl.innerHTML = `<legend>Plan</legend>${phase.plans.map((pl, i) => `<button type="button" aria-pressed="${i === 0}" data-plan="${i}">${esc(planLabel(pl))}</button>`).join("")}`;
      if (!keepPrice) setPrice(typical(phase));
      else draw();
    }
    function setPrice(v, fromRange) {
      price = Math.max(100000, Math.min(500e6, Math.round(v)));
      if (!fromRange) range.value = toSlider(Math.min(Math.max(price, 3e6), 150e6));
      if (document.activeElement !== priceIn) priceIn.value = egp(price);
      draw();
    }
    phasesEl.addEventListener("click", (e) => { const b = e.target.closest("[data-phase]"); if (b) setPhase(b.dataset.phase); });
    plansEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-plan]"); if (!b) return;
      planIdx = Number(b.dataset.plan);
      $$("[data-plan]", plansEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
    range.addEventListener("input", () => setPrice(fromSlider(Number(range.value)), true));
    priceIn.addEventListener("input", () => { const n = Number(priceIn.value.replace(/[^\d]/g, "")); if (n >= 100000) setPrice(n); });
    priceIn.addEventListener("blur", () => { priceIn.value = egp(price); });
    priceIn.addEventListener("focus", () => priceIn.select());

    function draw() {
      const pl = phase.plans[planIdx];
      const s = schedule(price, pl);
      const m = dest.maintenance;
      note.innerHTML = [
        phase.note ? esc(phase.note) : "",
        `Maintenance deposit: ${m.pct}% of the unit price, due ${esc(m.due)}.${m.extra ? ` ${esc(m.extra)}.` : ""}`,
        phase.official ? "" : "These terms are not on the October 18 sheet; confirm them per unit.",
      ].filter(Boolean).join(" ");

      if (s.cashOnly) {
        result.innerHTML = `
          <dl class="result__lead">
            <div class="is-key"><dt>Paid at contract</dt><dd>${egp(price)}<small>EGP, cash</small></dd></div>
            <div><dt>Delivery</dt><dd>${pl.delivery ? `${pl.delivery} months` : "With main unit"}<small>${dest.id === "newgiza" ? "Kingsrange 1 prototype; 18 – 30 months elsewhere" : "from contract"}</small></dd></div>
            <div><dt>Maintenance</dt><dd>${egp((price * m.pct) / 100)}<small>${m.pct}%, ${esc(m.due)}</small></dd></div>
          </dl>
          <div class="result__actions">
            <a class="btn btn--light" href="${wa(`Hello Omar, I'm looking at ${dest.name} (${phase.name}) for about ${egp(price)} EGP cash. What is available?`)}" target="_blank" rel="noopener">${WA_ICON} Ask about cash units</a>
          </div>`;
        return;
      }

      const freq = pl.annual ? "year" : "quarter";
      const widths = [...pl.down, s.restPct, pl.atDelivery || 0];
      result.innerHTML = `
        <dl class="result__lead">
          <div><dt>At signing</dt><dd>${egp(s.down[0])}<small>${pl.down[0]}% of the price${pl.down[1] ? `, then ${egp(s.down[1])} after 3 months` : ""}</small></dd></div>
          <div class="is-key"><dt>Each ${freq}</dt><dd>${egp(s.each)}<small>${pl.installments} installments over ${pl.years} years</small></dd></div>
          <div><dt>${s.cashPrice ? "Cash price" : "Delivery"}</dt><dd${!s.cashPrice && !pl.delivery ? ' class="is-text"' : ""}>${s.cashPrice ? egp(s.cashPrice) : pl.delivery ? `${pl.delivery} months` : "On request"}<small>${s.cashPrice ? `${pl.cash}% off, saves ${egp(price - s.cashPrice)}` : pl.delivery ? "from contract" : "confirmed per unit"}</small></dd></div>
        </dl>
        <div class="split" role="img" aria-label="Price split: ${pl.down.map((d) => `${d}%`).join(" and ")} down, ${s.restPct}% in installments${pl.atDelivery ? `, ${pl.atDelivery}% on delivery` : ""}">
          <div class="split__bar">
            ${pl.down.map((d) => `<i class="down" style="width:${d}%"></i>`).join("")}
            <i class="inst" style="width:${s.restPct}%;--q:calc(100% / ${pl.installments})"></i>
            ${pl.atDelivery ? `<i class="deliv" style="width:${pl.atDelivery}%"></i>` : ""}
          </div>
          <div class="split__legend">
            <span style="--c: var(--vermilion)">Down payment ${pl.down.reduce((a, b) => a + b, 0)}%</span>
            <span style="--c: rgba(255,255,255,.75)">${pl.installments} installments, ${s.restPct}%</span>
            ${pl.atDelivery ? `<span style="--c:#f0b9ad">On delivery ${pl.atDelivery}%</span>` : ""}
          </div>
        </div>
        <ol class="schedule">
          ${pl.down.map((d, i) => `<li><b>${i === 0 ? "Down payment" : "Second down payment"}</b><span>${i === 0 ? "At signing" : "Three months after signing"}</span><em>${egp(s.down[i])}</em></li>`).join("")}
          <li><b>${pl.installments} ${pl.annual ? "annual" : "quarterly"} installments</b><span>${pl.years} years, ${egp(s.each)} each</span><em>${egp(s.each * pl.installments)}</em></li>
          ${pl.atDelivery ? `<li><b>On delivery</b><span>At handover</span><em>${egp((price * pl.atDelivery) / 100)}</em></li>` : ""}
          <li><b>Maintenance deposit</b><span>${m.pct}%, ${esc(m.due)}${pl.delivery ? `; delivery in ${pl.delivery} months` : ""}</span><em>${egp((price * m.pct) / 100)}</em></li>
        </ol>
        ${s.cashPrice ? `<div class="result__cash"><p>Paying cash instead</p><strong>${egp(s.cashPrice)} EGP</strong><p>${pl.cash}% discount on the installment price.</p></div>` : ""}
        <div class="result__actions">
          <a class="btn btn--light" href="${wa(`Hello Omar, please send me the ${dest.name} ${phase.name} plan for a unit around ${egp(price)} EGP: ${planLabel(pl)}, ${egp(s.each)} per ${freq}.`)}" target="_blank" rel="noopener">${WA_ICON} Send me this plan</a>
          ${units.some((u) => u.plan === phase.id) ? `<button class="btn btn--ghost-light" type="button" data-pay-units>See units at this price</button>` : ""}
        </div>`;
    }
    result.addEventListener("click", (e) => {
      if (e.target.closest("[data-pay-units]")) ctx.showUnitsForPlan && ctx.showUnitsForPlan(phase.id, price);
    });

    // Hooks used by other sections
    ctx.showPlan = (p) => {
      if (!p.payment) return;
      const btn = $(`[data-dest="${p.payment.destination}"]`, tabList);
      tabs.select(btn, true);
      setDest(p.payment.destination, p.payment.phases[0]);
      document.getElementById("payments").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    };
    ctx.planForUnit = (u) => {
      const ph = ctx.planById[u.plan];
      return ph ? ph.plans[0] : null;
    };
    setDest(dest.id);
  }

  /* ------------------------------------------------------------------ */
  /* Availability                                                        */
  /* ------------------------------------------------------------------ */
  function renderAvailability(ctx) {
    const { units, inv } = ctx;
    const tabList = $("[data-ats-tabs]");
    const selPhase = $("[data-ats-phase]");
    const selType = $("[data-ats-type]");
    const selSort = $("[data-ats-sort]");
    const q = $("[data-ats-q]");
    const budget = $("[data-ats-budget]");
    const budgetOut = $("[data-ats-budget-out]");
    const hist = $("[data-ats-hist]");
    const rowsEl = $("[data-ats-rows]");
    const count = $("[data-ats-count]");
    const more = $("[data-ats-more]");
    const asofEl = $("[data-ats-asof]");
    const dates = Object.values(inv.projects).map((p) => p.asOf).sort();
    asofEl.textContent = new Date(dates[dates.length - 1]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const projects = [["", "All", units.length], ...Object.entries(inv.projects).map(([id, p]) => [id, p.name === "Playa" ? "Playa Ghazala" : p.name, units.filter((u) => u.project === id).length])];
    tabList.innerHTML = projects.map(([id, name, n], i) => `<button role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ""} data-p="${id}">${esc(name)}<small>${nf.format(n)}</small></button>`).join("");
    const state = { project: "", phase: "", phases: null, type: "", beds: "", sort: "price-asc", q: "", max: Infinity, shown: 30, plan: "" };
    const tabs = initTabs(tabList, (t) => { state.project = t.dataset.p; state.phase = ""; state.phases = null; state.type = ""; state.plan = ""; state.max = Infinity; fillSelects(); setupBudget(); apply(); });
    const bedSeg = initSeg($("[data-ats-beds]"), (b) => { state.beds = b.dataset.v; apply(); });

    const scoped = () => units.filter((u) => (!state.project || u.project === state.project) && (!state.phases || state.phases.includes(u.phase)));
    function fillSelects() {
      const base = scoped();
      const phases = [...new Set(base.map((u) => u.phase))];
      selPhase.innerHTML = `<option value="">All</option>${phases.map((p) => `<option ${p === state.phase ? "selected" : ""}>${esc(p)}</option>`).join("")}`;
      const types = [...new Set(base.filter((u) => !state.phase || u.phase === state.phase).map((u) => u.type))].sort();
      selType.innerHTML = `<option value="">All</option>${types.map((t) => `<option ${t === state.type ? "selected" : ""}>${esc(t)}</option>`).join("")}`;
    }
    let lo = 0, hi = 1;
    function setupBudget() {
      const ps = scoped().map((u) => u.price);
      lo = Math.log(Math.min(...ps)); hi = Math.log(Math.max(...ps));
      budget.value = state.max === Infinity ? 100 : Math.round(((Math.log(state.max) - lo) / (hi - lo)) * 100);
      drawBudget();
    }
    const budgetValue = () => (Number(budget.value) >= 100 ? Infinity : Math.round(Math.exp(lo + (Number(budget.value) / 100) * (hi - lo)) / 100000) * 100000);
    function drawBudget() {
      state.max = budgetValue();
      budgetOut.textContent = state.max === Infinity ? "Any" : `${short(state.max)} EGP`;
      budget.setAttribute("aria-valuetext", state.max === Infinity ? "Any budget" : `${egp(state.max)} Egyptian pounds`);
      const bins = new Array(48).fill(0);
      const base = filtered(true);
      base.forEach((u) => { const i = Math.min(47, Math.max(0, Math.floor(((Math.log(u.price) - lo) / (hi - lo || 1)) * 48))); bins[i]++; });
      const peak = Math.max(1, ...bins);
      const cut = state.max === Infinity ? 48 : ((Math.log(state.max) - lo) / (hi - lo)) * 48;
      hist.innerHTML = bins.map((n, i) => `<i class="${i >= cut ? "off" : ""}" style="height:${n ? Math.max(6, (n / peak) * 100) : 2}%"></i>`).join("");
    }
    function filtered(ignoreBudget) {
      const needle = state.q.trim().toUpperCase();
      return scoped().filter((u) =>
        (!state.phase || u.phase === state.phase) &&
        (!state.type || u.type === state.type) &&
        (!state.plan || u.plan === state.plan) &&
        (!state.beds || (state.beds === "5" ? (u.beds || 0) >= 5 : u.beds === Number(state.beds))) &&
        (ignoreBudget || u.price <= state.max) &&
        (!needle || u.unit.toUpperCase().includes(needle)));
    }
    const sorters = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "bua-desc": (a, b) => (b.bua || 0) - (a.bua || 0),
      "ppm-asc": (a, b) => a.price / (a.bua || 1e9) - b.price / (b.bua || 1e9),
    };
    const projectName = (id) => (id === "playa" ? "Playa Ghazala" : inv.projects[id].name);
    function row(u) {
      const pl = ctx.planForUnit(u);
      const s = pl ? schedule(u.price, pl) : null;
      const land = u.garden ? `Garden ${nf.format(u.garden)} m²` : u.land ? `Land ${nf.format(u.land)} m²` : "";
      const tag = u.status === "hold" ? '<span class="tag tag--hold">On hold</span>' : u.status === "requested" || u.status === "ready" ? '<span class="tag tag--hold">Being reserved</span>' : "";
      const sub = [u.view, u.floor ? `${u.floor} floor`.replace("Ground floor floor", "Ground floor") : ""].filter(Boolean).join(", ");
      const msg = `Hello Omar, is unit ${u.unit} still available? ${projectName(u.project)}, ${u.phase}, ${u.type}${u.bua ? `, ${u.bua} m²` : ""}, listed at ${egp(u.price)} EGP.`;
      return `<div class="ats__row" role="row">
        <span class="ats__unit" role="cell"><strong>${esc(u.unit)}</strong><span>${esc(projectName(u.project))}, ${esc(u.phase)}</span>${tag}</span>
        <span class="ats__home" role="cell">${esc(u.type)}${sub ? `<span>${esc(sub)}</span>` : ""}</span>
        <span class="ats__cell-beds" role="cell">${u.beds ?? "–"}</span>
        <span class="ats__cell-bua" role="cell">${u.bua ? `${nf.format(u.bua)} m²` : "–"}</span>
        <span class="ats__cell-land" role="cell">${land}</span>
        <span class="ats__price" role="cell">${egp(u.price)}</span>
        <span class="ats__quarter" role="cell">${s && !s.cashOnly ? `${short(s.each)}<small>per ${pl.annual ? "year" : "quarter"}, ${pl.years} yrs</small>` : "Cash<small>handover soon</small>"}</span>
        <span role="cell"><a class="ats__ask" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="Ask Omar about unit ${esc(u.unit)} on WhatsApp">${WA_ICON}Ask</a></span>
      </div>`;
    }
    function apply(keepShown) {
      if (!keepShown) state.shown = 30;
      const list = filtered().sort(sorters[state.sort]);
      count.innerHTML = list.length
        ? `<strong>${nf.format(list.length)}</strong> ${list.length === 1 ? "unit" : "units"} match, from ${egp(list[0] && Math.min(...list.map((u) => u.price)))} EGP.`
        : "";
      rowsEl.innerHTML = list.length
        ? list.slice(0, state.shown).map(row).join("")
        : `<p class="ats__empty">No units match these filters. Raise the budget or clear a filter, or <a class="link" href="${wa("Hello Omar, I couldn't find a unit that fits my brief on your site. Can you help?")}" target="_blank" rel="noopener">tell Omar what you need</a>.</p>`;
      more.hidden = list.length <= state.shown;
      more.textContent = `Show more units (${nf.format(list.length - state.shown)} left)`;
      drawBudget();
    }
    selPhase.addEventListener("change", () => { state.phase = selPhase.value; state.type = ""; if (state.phases && !state.phase) { state.phases = null; setupBudget(); } fillSelects(); apply(); });
    selType.addEventListener("change", () => { state.type = selType.value; apply(); });
    selSort.addEventListener("change", () => { state.sort = selSort.value; apply(); });
    q.addEventListener("input", () => { state.q = q.value; apply(); });
    budget.addEventListener("input", () => { drawBudget(); apply(); });
    more.addEventListener("click", () => { state.shown += 30; apply(true); });

    function goTo(projectId, opts = {}) {
      const tab = $(`[data-p="${projectId}"]`, tabList);
      tabs.select(tab, true);
      Object.assign(state, { project: projectId, phase: opts.phase || "", phases: opts.phases || null, type: "", plan: opts.plan || "", beds: "", q: "", max: Infinity });
      q.value = "";
      bedSeg.set($('[data-ats-beds] [data-v=""]'), true);
      fillSelects();
      setupBudget();
      if (opts.max) { state.max = opts.max; budget.value = Math.min(100, Math.max(0, Math.round(((Math.log(opts.max) - lo) / (hi - lo)) * 100))); }
      apply();
      document.getElementById("availability").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
    ctx.showUnits = (p) => {
      if (!p.inventory) return;
      const phases = p.inventory.phases;
      goTo(p.inventory.project, phases && phases.length === 1 ? { phase: phases[0] } : { phases: phases || null });
    };
    ctx.showUnitsForPlan = (planId, maxPrice) => {
      const u = units.find((x) => x.plan === planId);
      if (u) goTo(u.project, { plan: planId, max: maxPrice * 1.1 });
    };

    fillSelects();
    setupBudget();
    apply();
  }

  /* ------------------------------------------------------------------ */
  /* Library                                                             */
  /* ------------------------------------------------------------------ */
  const LIBRARY = [
    { id: "krypton-block-1", title: "Krypton, Block 1", meta: "77 pages, 25 MB. Story, renders, floor plates and all 25 layouts.", file: "assets/brochures/krypton-block-1.pdf", cover: "assets/img/krypton/kr-portrait" },
    { id: "krypton-block-2", title: "Krypton, Block 2", meta: "77 pages, 31 MB. Block 2 floor plates with released units.", file: "assets/brochures/krypton-block-2.pdf", cover: "assets/img/krypton/kr-lighter" },
    { id: "golf-views", title: "NEWKAIRO Golf, Argon Views", meta: "71 pages, 17 MB. Golf estates, Fairscapes, Tee View and twin villas.", file: "assets/brochures/newkairo-golf-views-argon.pdf", cover: "assets/img/golf/golf-clubhouse" },
    { id: "neon-views", title: "Neon Views", meta: "83 pages, 34 MB. Landscape, typologies and floor plans.", file: "assets/brochures/newkairo-neon-views.pdf", cover: "assets/img/neon/neon-cover" },
    { id: "newkairo", title: "NEWKAIRO, the masterplan story", meta: "60 pages, 12 MB. Location, schools, golf, hotels and the Boulevard.", file: "assets/brochures/newkairo-conceptual-brochure.pdf", cover: "assets/img/newkairo/nk-welcome" },
    { id: "masterplan", title: "NEWKAIRO masterplan with Krypton", meta: "1 page, 1.8 MB. Where each phase sits.", file: "assets/brochures/newkairo-masterplan-krypton.pdf", cover: "assets/img/newkairo/nk-masterplan" },
    { id: "payment-terms", title: "Standard payment plans", meta: "2 pages, 0.1 MB. Issued October 18, 2026, all destinations.", file: "assets/brochures/standard-payment-terms-2026-10-18.pdf", cover: "assets/img/covers/payment-terms" },
  ];

  function renderLibrary() {
    $("[data-library]").innerHTML = LIBRARY.map((b) => `
      <article class="book">
        <figure class="book__cover">${picture(b.cover, `Cover image for ${b.title}`, "(min-width: 960px) 33vw, 100vw")}</figure>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.meta)}</p>
        <div class="book__actions">
          <a class="btn btn--light" href="${b.file}" download>Download PDF</a>
          <a class="btn btn--ghost-light" href="${wa(`Hello Omar, please send me the ${b.title} brochure on WhatsApp.`)}" target="_blank" rel="noopener">Send it on WhatsApp</a>
        </div>
      </article>`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Contact                                                             */
  /* ------------------------------------------------------------------ */
  function renderContact({ config }) {
    const offices = $("[data-offices]");
    if (offices && config.offices) offices.innerHTML = config.offices.map((o) => `<li><strong>${esc(o.area)}</strong>${esc(o.detail)}</li>`).join("");
    if (config.disclaimer) $("[data-disclaimer]").textContent = config.disclaimer;

    const form = $("[data-enquiry]");
    const err = $("[data-enquiry-error]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (!d.name.trim()) { err.hidden = false; form.elements.name.focus(); return; }
      err.hidden = true;
      const text = [
        `Hello Omar, this is ${d.name.trim()}.`,
        `Interested in: ${d.interest}.`,
        `Budget: ${d.budget}.`,
        `Payment: ${d.terms}.`,
        d.note.trim() ? `Notes: ${d.note.trim()}` : "",
      ].filter(Boolean).join("\n");
      if (config.leadCapture && config.leadCapture.webhookUrl) {
        fetch(config.leadCapture.webhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, source: location.href, at: new Date().toISOString() }) }).catch(() => {});
      }
      window.open(wa(text), "_blank", "noopener");
    });
  }
})();
