/* Mahmoud Elhemaly · Private advisory for G Developments
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

  /* ------------------------------------------------------------------ */
  /* Stats (Umami). Events queue until the tracker has loaded.           */
  /* ------------------------------------------------------------------ */
  const statQueue = [];
  function track(name, data) {
    const send = () => window.umami && typeof window.umami.track === "function" && (data ? window.umami.track(name, data) : window.umami.track(name));
    if (!send()) statQueue.push([name, data]);
  }
  function initAnalytics(cfg) {
    const a = cfg && cfg.analytics;
    if (!a || !a.umamiWebsiteId || !a.umamiScript) return;
    const sc = document.createElement("script");
    sc.defer = true;
    sc.src = a.umamiScript;
    sc.dataset.websiteId = a.umamiWebsiteId;
    if (a.domains) sc.dataset.domains = a.domains;
    sc.onload = () => {
      const flush = () => {
        if (!(window.umami && window.umami.track)) return setTimeout(flush, 300);
        statQueue.splice(0).forEach(([n, d]) => (d ? window.umami.track(n, d) : window.umami.track(n)));
      };
      flush();
    };
    document.head.appendChild(sc);
  }
  // Where on the page a click happened, for WhatsApp and call events
  const placeOf = (el) => {
    if (el.dataset.wa) return el.dataset.wa;
    if (el.closest(".wa-float")) return "Floating button";
    if (el.closest(".masthead, .mobile-nav")) return "Header";
    if (el.closest(".dossier")) return "Project details";
    const sec = el.closest("section[id]");
    return sec ? sec.id : "Page";
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href.includes("wa.me/")) track("WhatsApp click", { place: placeOf(a) });
    else if (href.startsWith("tel:")) track("Call click", { place: placeOf(a) });
    else if (a.hasAttribute("download")) track("Brochure download", { file: href.split("/").pop() });
  }, true);
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>';

  const u = (path) => (!path ? "" : /^(\/|https?:)/.test(path) ? path : `/${path}`);
  const PAGE = document.body.dataset.page || "home";
  const picture = (base, alt, sizes = "100vw", eager = false) => {
    if (!base) return "";
    base = u(base);
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
  const areaItems = $$("[data-area]");
  const areaPanel = (item) => $(".areas__panel", item);
  const openAreaItem = () => areaItems.find((item) => !areaPanel(item).hidden);

  function onScroll() {
    const y = window.scrollY;
    const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, y / travel));
    if (!reduceMotion) hero.style.setProperty("--p", p.toFixed(4));
    masthead.classList.toggle("is-solid", y > travel - 40 || !mobileNav.hidden || !!openAreaItem());
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
    const byWidth = (100 * window.innerWidth * (window.innerWidth < 760 ? 0.94 : 0.84)) / w;
    const byHeight = window.innerHeight * 0.4;
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

  function setMenu(open) {
    mobileNav.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    onScroll();
  }
  menuBtn.addEventListener("click", () => {
    const open = mobileNav.hidden;
    if (open) closeAreas();
    setMenu(open);
  });
  mobileNav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  // Area tabs in the top bar: one dropdown per region, one open at a time
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1181px)");
  let areaTimer = 0;
  let hoverOpenedAt = 0;
  function setArea(item, open) {
    areaPanel(item).hidden = !open;
    $("[data-area-tab]", item).setAttribute("aria-expanded", String(open));
  }
  function closeAreas(except) {
    areaItems.forEach((item) => { if (item !== except) setArea(item, false); });
    onScroll();
  }
  function openArea(item) {
    clearTimeout(areaTimer);
    if (!mobileNav.hidden) setMenu(false);
    closeAreas(item);
    setArea(item, true);
    onScroll();
    // On a phone, bring a tab that is partly off screen into view
    $("[data-area-tab]", item).scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }
  areaItems.forEach((item) => {
    const tab = $("[data-area-tab]", item);
    tab.addEventListener("click", () => {
      const isOpen = !areaPanel(item).hidden;
      if (isOpen && Date.now() - hoverOpenedAt < 600) return; // the pointer just opened it
      if (isOpen) closeAreas(); else openArea(item);
    });
    item.addEventListener("mouseenter", () => {
      if (!fineHover.matches) return;
      clearTimeout(areaTimer);
      if (areaPanel(item).hidden) { openArea(item); hoverOpenedAt = Date.now(); }
    });
    item.addEventListener("mouseleave", () => {
      if (!fineHover.matches) return;
      clearTimeout(areaTimer);
      areaTimer = setTimeout(() => { setArea(item, false); onScroll(); }, 220);
    });
    item.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !item.contains(e.relatedTarget)) { setArea(item, false); onScroll(); }
    });
    areaPanel(item).addEventListener("click", (e) => { if (e.target.closest("a")) closeAreas(); });
  });
  document.addEventListener("click", (e) => {
    if (openAreaItem() && !e.target.closest("[data-area]")) closeAreas();
  });
  document.addEventListener("keydown", (e) => {
    const item = e.key === "Escape" && openAreaItem();
    if (!item) return;
    closeAreas();
    $("[data-area-tab]", item).focus();
  });

  // Current section in the nav
  const navLinks = $$(".masthead__nav a");
  if (PAGE === "home" && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        // The project list sits under the developer story; both belong to Portfolio
        const id = en.target.id === "projects" ? "portfolio" : en.target.id;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.hash === `#${id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    if (PAGE === "home") ["newkairo", "portfolio", "projects", "payments", "brochures", "contact"].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------------ */
  /* Film + lightbox                                                     */
  /* ------------------------------------------------------------------ */
  const film = $("[data-film]");
  const filmVideo = $("[data-film-video]");
  if (film) {
    $$("[data-film-open]").forEach((b) => b.addEventListener("click", () => {
      track("Film play", { page: location.pathname });
      film.showModal();
      filmVideo.currentTime = 0;
      filmVideo.play().catch(() => {});
    }));
    $("[data-film-close]").addEventListener("click", () => film.close());
    film.addEventListener("close", () => filmVideo.pause());
    film.addEventListener("click", (e) => { if (e.target === film) film.close(); });
  }

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
  const load = (f) => fetch(`/data/${f}.json`, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${f}.json ${r.status}`); return r.json(); });

  // Arriving from another page at /#portfolio and the like: the browser jumps before the
  // live data has filled the sections above, so land on the section again once it has,
  // unless the visitor has already started scrolling.
  let visitorScrolled = false;
  ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, () => { visitorScrolled = true; }, { once: true, passive: true }));
  function landOnHash() {
    if (visitorScrolled || location.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const root = document.documentElement;
    const top = target.getBoundingClientRect().top + window.scrollY - masthead.offsetHeight;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, top));
    root.style.scrollBehavior = "";
  }

  Promise.all([load("krypton"), load("portfolio"), load("payment_terms"), load("inventory"), load("site_config")])
    .then(([krypton, portfolio, terms, inv, config]) => {
      const units = inv.units.map((u) => Object.fromEntries(inv.fields.map((f, i) => [f, u[i]])));
      const ctx = { krypton, portfolio, terms, inv, units, config };
      ctx.planById = {};
      terms.destinations.forEach((d) => d.phases.forEach((ph) => { ctx.planById[ph.id] = { ...ph, destination: d }; }));
      ctx.planForUnit = (x) => { const ph = ctx.planById[x.plan]; return ph ? ph.plans[0] : null; };
      renderStats(ctx);
      renderParcelPrices(ctx);
      if ($("[data-kr-tabs]")) renderKrypton(ctx);
      if ($("[data-nk-gallery]")) renderNewkairo(ctx);
      if ($("[data-region-tabs]")) renderAtlas(ctx);
      if ($("[data-pay-tabs]")) renderAtelier(ctx);
      if (PAGE === "project") renderProject(ctx);
      renderBooks();
      renderContact(ctx);
      initAnalytics(config);
      document.documentElement.classList.add("is-ready");
      landOnHash();
      window.addEventListener("load", landOnHash, { once: true });
    })
    .catch((err) => {
      console.error(err);
      $$("[data-pay-result], [data-atlas-view]").forEach((el) => {
        el.innerHTML = `<p class="muted">Live data could not load. Message a salesperson on WhatsApp at +20 122 727 5122 for current prices and availability.</p>`;
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
  /* Krypton (Focused Call-Now & Upsell Mode)                            */
  /* ------------------------------------------------------------------ */
  function renderKrypton({ krypton }) {
    initTabs($("[data-kr-tabs]"));

    const band = $("[data-kr-band]");
    const list = $("[data-kr-list]");
    const planEl = $("[data-kr-plan]");

    const UPSELL_COPY = {
      1: {
        hookDown: "393,750 EGP",
        scarcity: "High demand · Limited Block 1 & Block 2 park-view quotas",
        upsell: "Advisory upgrade note: For a modest step-up in quarterly payment, compare our 2-bedroom corner layouts with double the rental yield and wider park frontage.",
      },
      2: {
        hookDown: "564,375 EGP",
        scarcity: "Most requested tier · Released holds update daily",
        upsell: "Advisory upgrade note: At a 2-bedroom budget, ask us on your call to compare a 3-bedroom terrace home or an Urban Living ground-garden apartment at nearly the same entry.",
      },
      3: {
        hookDown: "740,500 EGP",
        scarcity: "Corner & terrace allocations · Priority call list",
        upsell: "Advisory upgrade note: Qualifying for a 3-bedroom apartment means you can also step into a Fully Finished Private-Garden Townhouse in Neon Views with 5% down. Ask Mahmoud to compare both live.",
      },
    };

    function showBeds(b) {
      const pb = krypton.priceBands.find((p) => p.beds === b) || krypton.priceBands[0];
      const ls = krypton.layouts.filter((l) => l.beds === b);
      const sample = ls[0];
      const uInfo = UPSELL_COPY[b] || UPSELL_COPY[1];
      const bedWord = ["", "One bedroom", "Two bedrooms", "Three bedrooms"][b];

      band.innerHTML = `<strong>${pb.label}</strong> · ${pb.sqm} m² · Start with <strong>${uInfo.hookDown} (5% EOI)</strong>`;

      list.innerHTML = `
        <li style="padding:16px 0;border-bottom:1px solid var(--on-dark-3);color:var(--on-dark-2);font-size:15px;">
          <strong style="display:block;color:#fff;font-family:var(--display);font-size:21px;margin-bottom:4px;">5% Down Payment Entry</strong>
          Start from ${uInfo.hookDown} at reservation, 5% after 3 months, and equal installments over 8 years.
        </li>
        <li style="padding:16px 0;border-bottom:1px solid var(--on-dark-3);color:var(--on-dark-2);font-size:15px;">
          <strong style="display:block;color:#fff;font-family:var(--display);font-size:21px;margin-bottom:4px;">Unlisted Holds &amp; Cash Rate</strong>
          Exact released unit codes, floor levels, and today's private cash discount are shared directly by phone or WhatsApp.
        </li>
        <li style="padding:16px 0;color:var(--on-dark-2);font-size:15px;">
          <strong style="display:block;color:var(--vermilion);font-family:var(--display);font-size:21px;margin-bottom:4px;">Smart Upgrade Comparison</strong>
          ${esc(uInfo.upsell)}
        </li>`;

      planEl.innerHTML = `
        <article class="plan-card">
          <div class="plan-card__head">
            <h3 class="plan-card__title">${bedWord} Collection <span>/</span> ${pb.sqm} m²</h3>
            <p class="plan-card__meta">${esc(uInfo.scarcity)}</p>
          </div>
          <div class="plan-card__body">
            <button class="plan-card__img" type="button" data-zoom="${esc(u(sample.plan))}" aria-label="Preview representative ${bedWord} floor plan">
              <img src="${esc(u(sample.plan))}" alt="Representative floor plan of Krypton ${bedWord}" loading="lazy">
            </button>
            <div>
              <p style="font-family:var(--display);font-size:24px;line-height:1.2;margin-bottom:12px;">Reserve with ${uInfo.hookDown} (5% down) and up to 8 years to pay.</p>
              <p class="plan-card__variants" style="margin-top:0;">We hold the complete ${ls.length}-layout floor-plan book, sun orientations, and live Block 1 &amp; Block 2 availability sheet at our advisory desk.</p>
              <p class="plan-card__variants"><strong>Call or message now</strong> to receive the exact available unit numbers, net cash price, and a side-by-side upgrade comparison.</p>
            </div>
          </div>
          <div class="plan-card__actions">
            <a class="btn btn--red btn--small" href="tel:+201227275122">Call +20 122 727 5122 Now</a>
            <a class="btn btn--dark btn--small" href="${wa(`Hello Mahmoud, I'm looking at a Krypton ${bedWord.toLowerCase()} (${pb.sqm} m²). Please send me the available unit numbers, cash price, and upgrade options.`)}" target="_blank" rel="noopener">${WA_ICON} Unlock Units on WhatsApp</a>
          </div>
        </article>`;
    }

    initSeg($("[data-kr-beds]"), (btn) => showBeds(Number(btn.dataset.beds)));
    planEl.addEventListener("click", (e) => {
      const z = e.target.closest("[data-zoom]");
      if (z) openLightbox([{ src: z.dataset.zoom, caption: "Representative Krypton residence layout — call for full layout book" }]);
    });
    showBeds(1);

    // Gallery
    const gal = [
      ["kr-dusk", "Krypton's retail street at dusk"], ["kr-aerial", "Aerial view of Krypton and The Boulevard"], ["kr-pool", "Residents' pool and park"],
      ["kr-balcony", "Terrace looking over the park"], ["kr-tram", "Electric tram on The Boulevard"], ["kr-canopy", "The canopy plaza"],
      ["kr-arcade", "Shaded arcade under the residences"], ["kr-garden", "Garden walk between blocks"], ["kr-terraces", "Planted terraces over the shops"],
      ["kr-retail", "Cafés and shops at street level"], ["kr-facade", "Curved façades and deep balconies"], ["kr-park", "Paths through the park"],
      ["kr-terrace", "Rooftop lounge"], ["kr-promenade", "The promenade"], ["kr-aerial-2", "Krypton blocks from above"], ["kr-street-life", "Street life on The Boulevard"],
    ].map(([f, c]) => ({ base: `assets/img/krypton/${f}`, caption: c }));
    const galEl = $("[data-kr-gallery]");
    if (galEl) {
      galEl.innerHTML = gal.map((g, i) => `<button type="button" data-i="${i}" aria-label="Open image: ${esc(g.caption)}">${picture(g.base, g.caption, "(min-width: 900px) 33vw, 100vw")}</button>`).join("");
      galEl.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) openLightbox(gal.map((g) => ({ src: `${u(g.base)}.jpg`, caption: g.caption })), Number(b.dataset.i)); });
    }
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
      const min = fromPrice(ctx, p);
      const pay = p.payment ? ctx.planById[p.payment.phases[0]] : null;
      view.innerHTML = `
        <figure class="atlas__figure">
          ${p.image ? picture(p.image, `${p.name}, ${p.place}`, "(min-width: 960px) 55vw, 100vw") : `<div class="typo-panel"><span>${esc(p.name)}</span></div>`}
          ${p.illustrative && p.image ? "<figcaption>Illustrative image</figcaption>" : ""}
        </figure>
        <p class="atlas__place">${esc(p.place)}</p>
        <h3 class="atlas__title">${esc(p.name)}</h3>
        <p class="atlas__intro">${esc(p.intro)}</p>
        <dl class="facts">${p.facts.filter(([k]) => !/cash/i.test(k)).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        ${min ? `<p class="muted">Entry from <strong>${short(min * 0.05)} EGP (5% down)</strong> · Exact unit prices &amp; cash discounts shared on call.</p>` : ""}
        <div class="atlas__actions">
          <a class="btn btn--red" href="tel:+201227275122">Call +20 122 727 5122</a>
          <a class="btn btn--dark" href="${wa(`Hello Mahmoud, which ${p.parent ? `${p.parent} ${p.name}` : p.name} units and released holds are available right now?`)}" target="_blank" rel="noopener">${WA_ICON} Ask what's available</a>
          <a class="btn btn--line" href="/${p.slug}/">Explore ${esc(p.name)}</a>
        </div>`;
    }
    initTabs(tabList, (tab) => showRegion(tab.dataset.region));
    listEl.addEventListener("click", (e) => { const b = e.target.closest("[data-project]"); if (b) showProject(b.dataset.project); });
    view.addEventListener("click", (e) => {
      const pl = e.target.closest("[data-see-plan]");
      if (pl) ctx.showPlan && ctx.showPlan(portfolio.projects.find((x) => x.id === pl.dataset.seePlan));
    });
    showRegion(portfolio.regions[0].id);
  }

  function typesSummary(us) {
    const by = new Map();
    us.forEach((u) => {
      const k = /apartment/i.test(u.type) && u.beds ? `${u.type}, ${u.beds} bedroom${u.beds > 1 ? "s" : ""}` : u.type;
      const g = by.get(k) || { type: k, n: 0, min: Infinity, bmin: Infinity, bmax: 0 };
      g.n++; g.min = Math.min(g.min, u.price);
      if (u.bua) { g.bmin = Math.min(g.bmin, u.bua); g.bmax = Math.max(g.bmax, u.bua); }
      by.set(k, g);
    });
    return [...by.values()].sort((a, b) => a.min - b.min);
  }


  /* ------------------------------------------------------------------ */
  /* Parcels, NEWKAIRO and project pages                                 */
  /* ------------------------------------------------------------------ */
  function fromPrice(ctx, p) {
    const prices = [...unitsFor(ctx, p).map((x) => x.price), ...(p.homes || []).map((x) => x.from)];
    return prices.length ? Math.min(...prices) : null;
  }
  function renderParcelPrices(ctx) {
    $$("[data-from]").forEach((el) => {
      const p = ctx.portfolio.projects.find((x) => x.id === el.dataset.from);
      const min = p && fromPrice(ctx, p);
      el.textContent = min ? `5% down · From ${short(min * 0.05)} EGP at signing` : p ? p.status : "";
    });
  }

  function renderNewkairo() {
    initTabs($('#newkairo [role="tablist"]'));
    const gal = [
      ["newkairo/nk-welcome", "The main gate"], ["newkairo/nk-boulevard", "The Boulevard"], ["newkairo/nk-golf-lake", "NEWKAIRO Golf and the lake"],
      ["newkairo/nk-golf-hotel", "The golf hotel"], ["newkairo/nk-golf-clubhouse", "The golf clubhouse"], ["newkairo/nk-downtown", "The downtown district"],
      ["newkairo/nk-school", "International school"], ["newkairo/nk-sports-club", "Sports club"], ["newkairo/nk-hospitality", "Hospitality"],
      ["krypton/kr-dusk", "Krypton at dusk"], ["golf/golf-estate-2s", "Golf estates"], ["neon/neon-lake", "Neon Views lakes"],
    ].map(([f, c]) => ({ base: `assets/img/${f}`, caption: c }));
    mountGallery($("[data-nk-gallery]"), gal);
  }

  function mountGallery(el, gal) {
    if (!el) return;
    el.innerHTML = gal.map((g, i) => `<button type="button" data-i="${i}" aria-label="Open image: ${esc(g.caption)}">${picture(g.base, g.caption, "(min-width: 900px) 33vw, 100vw")}</button>`).join("");
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) openLightbox(gal.map((g) => ({ src: `${u(g.base)}.jpg`, caption: g.caption })), Number(b.dataset.i)); });
  }

  function renderProject(ctx) {
    const p = ctx.portfolio.projects.find((x) => x.id === document.body.dataset.project);
    if (!p) return;
    initTabs($('#project [role="tablist"]'));

    // Homes: high-urgency 5% entry hooks + call-to-unlock (no full price dump)
    const homesEl = $("[data-p-homes]");
    const us = unitsFor(ctx, p);
    const types = typesSummary(us);
    const ask = (what) => `
      <span style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        <a class="ats__ask ats__ask--light" href="tel:+201227275122">Call Now</a>
        <a class="ats__ask ats__ask--light" href="${wa(`Hello Mahmoud, I'm interested in ${what} at ${p.parent ? `${p.parent} ${p.name}` : p.name}. Please send me the available units, exact prices, and upgrade options.`)}" target="_blank" rel="noopener">${WA_ICON}Unlock Price</a>
      </span>`;
    const rows = [
      ...(p.homes || []).map((x) => ({ name: x.name, size: x.size, from: x.from })),
      ...types.map((t) => ({ name: t.type, size: t.bmin < Infinity ? (t.bmin === t.bmax ? `${nf.format(t.bmin)} m²` : `${nf.format(t.bmin)} – ${nf.format(t.bmax)} m²`) : "", from: t.min })),
    ];
    homesEl.innerHTML = rows.length
      ? `<p class="p-homes__note">Exact unit numbers, plot positions, released holds, and today's private cash discount are shared directly by phone or WhatsApp so we can match—or upgrade—your brief.</p>
         <ul class="p-homes__list">${rows.map((r) => `
           <li class="p-homes__row">
             <span class="p-homes__name">${esc(r.name)}</span>
             <span class="p-homes__size">${esc(r.size)}</span>
             <span class="p-homes__from"><small>5% Down Entry From</small>${short(r.from * 0.05)} EGP<small>Full sheet &amp; cash rate on call</small></span>
             ${ask(r.name)}
           </li>`).join("")}</ul>`
      : `<p class="p-homes__note">Priority unit allocations and released holds for ${esc(p.name)} are shared directly on a quick advisory call.</p>
         <div style="display:flex;gap:12px;flex-wrap:wrap;">
           <a class="btn btn--light" href="tel:+201227275122">Call +20 122 727 5122</a>
           <a class="btn btn--ghost-light" href="${wa(`Hello Mahmoud, please send me the available units and cash discount at ${p.name}.`)}" target="_blank" rel="noopener">${WA_ICON} Ask on WhatsApp</a>
         </div>`;

    // Payment, scoped to this project's phases
    const payRoot = $("#project [data-pay-root]");
    if (payRoot) mountPayment(payRoot, ctx, { dest: payRoot.dataset.dest, phases: payRoot.dataset.phases.split(",") });

    // Gallery
    const galEl = $("[data-p-gallery]");
    if (galEl) mountGallery(galEl, [p.heroImage, ...(p.gallery || [])].filter(Boolean).map((b, i) => ({ base: b, caption: `${p.name}${i ? "" : `, ${p.place}`}` })));
  }

  /* ------------------------------------------------------------------ */
  /* Payment atelier                                                     */
  /* ------------------------------------------------------------------ */
  const LOG_MIN = Math.log(3e6), LOG_MAX = Math.log(150e6);
  const toSlider = (price) => Math.round(((Math.log(price) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
  const fromSlider = (v) => Math.round(Math.exp(LOG_MIN + (v / 1000) * (LOG_MAX - LOG_MIN)) / 10000) * 10000;

  function renderAtelier(ctx) {
    const tabList = $("[data-pay-tabs]");
    const first = ctx.terms.destinations[0];
    tabList.innerHTML = ctx.terms.destinations.map((d, i) => `<button role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ""} data-dest="${d.id}">${esc(d.name)}</button>`).join("");
    const calc = mountPayment($("[data-pay-root]", $("#payments")), ctx, { dest: first.id });
    const tabs = initTabs(tabList, (t) => { calc.setDest(t.dataset.dest); track("Payment plan opened", { destination: t.textContent.trim() }); });
    ctx.showPlan = (p) => {
      if (!p.payment) return;
      tabs.select($(`[data-dest="${p.payment.destination}"]`, tabList), true);
      calc.setDest(p.payment.destination, p.payment.phases[0]);
      document.getElementById("payments").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    };
  }

  function mountPayment(root, ctx, opts) {
    const { terms, units } = ctx;
    const phasesEl = $("[data-pay-phases]", root);
    const plansEl = $("[data-pay-plans]", root);
    const priceIn = $("[data-pay-price]", root);
    const range = $("[data-pay-range]", root);
    const note = $("[data-pay-note]", root);
    const result = $("[data-pay-result]", root);
    const allowed = opts.phases || null;
    range.min = 0; range.max = 1000; range.step = 1;

    let dest = terms.destinations[0], phase = dest.phases[0], planIdx = 0, price = 11287500;
    const typical = (ph) => {
      const ps = units.filter((u) => u.plan === ph.id).map((u) => u.price).sort((a, b) => a - b);
      if (ps.length) return ps[Math.floor(ps.length * 0.25)];
      return { "nk-krypton": 11287500, "md-b12": 14400000, "md-b34": 14400000, "al-cypher": 19829000, "pr-all": 15300000, "ng-utilities": 1500000 }[ph.id] || 20000000;
    };

    function setDest(id, phaseId, keepPrice) {
      dest = terms.destinations.find((d) => d.id === id);
      const phases = dest.phases.filter((ph) => !allowed || allowed.includes(ph.id));
      phasesEl.innerHTML = `<legend>Phase</legend>${phases.map((ph) => `<button type="button" aria-pressed="false" data-phase="${ph.id}">${esc(ph.name)}</button>`).join("")}`;
      setPhase(phaseId || phases[0].id, keepPrice);
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
      const downFirst = pl.cashOnly ? "Cash" : `${pl.down[0] || 5}%`;
      const secondNote = !pl.cashOnly && pl.down[1] ? `Then ${pl.down[1]}% after 3 months` : "Flexible contract entry";
      const horizon = pl.cashOnly ? "Immediate cash contract" : `Up to ${pl.years} years`;

      note.innerHTML = `Exact unit pricing, quarterly installment schedules, and private cash discount rates for <strong>${esc(dest.name)} (${esc(phase.name)})</strong> are calculated per unit. Speak directly with Mahmoud Elhemaly to unlock today's released holds and compare upgrade options.`;

      result.innerHTML = `
        <dl class="result__lead">
          <div class="is-key"><dt>Contract entry</dt><dd>${downFirst}<small>${esc(secondNote)}</small></dd></div>
          <div><dt>Installment horizon</dt><dd>${horizon}<small>${pl.cashOnly ? "Priority handover" : "Equal installments"}</small></dd></div>
          <div><dt>Cash &amp; hold-list rate</dt><dd class="is-text">On Call<small>Private cash discount &amp; upgrades</small></dd></div>
        </dl>
        <div class="result__cash" style="margin-top:24px;">
          <p><strong>Advisor Upgrade &amp; Cash Comparison:</strong> Before locking a unit from a standard price list, call our desk to check released "Hold" units, corner plots, and how stepping up to the next tier compares on a quarterly basis.</p>
        </div>
        <div class="result__actions" style="margin-top:24px;">
          <a class="btn btn--red" href="tel:+201227275122">Call +20 122 727 5122 Now</a>
          <a class="btn btn--light" href="${wa(`Hello Mahmoud, please send me the exact payment sheet, cash discount, and best available units for ${dest.name} (${phase.name}).`)}" target="_blank" rel="noopener">${WA_ICON} Get Custom Sheet on WhatsApp</a>
        </div>`;
    }

    setDest(opts.dest, opts.phase);
    return { setDest };
  }

  /* ------------------------------------------------------------------ */
  /* Library                                                             */
  /* ------------------------------------------------------------------ */
  const LIBRARY = [
    { id: "krypton-block-1", title: "Krypton, Block 1", meta: "77 pages, 25 MB. Story, renders, floor plates and all 25 layouts.", file: "assets/brochures/krypton-block-1.pdf", cover: "assets/img/krypton/kr-portrait" },
    { id: "krypton-block-2", title: "Krypton, Block 2", meta: "77 pages, 31 MB. Block 2 floor plates with released units.", file: "assets/brochures/krypton-block-2.pdf", cover: "assets/img/krypton/kr-lighter" },
    { id: "golf-views", title: "NEWKAIRO Golf, Argon Views", meta: "71 pages, 17 MB. Golf estates, Fairscapes, Tee View and twin villas.", file: "assets/brochures/newkairo-golf-views-argon.pdf", cover: "assets/img/golf/golf-clubhouse" },
    { id: "neon-views", title: "Neon Views", meta: "83 pages, 34 MB. Landscape, typologies and floor plans.", file: "assets/brochures/newkairo-neon-views.pdf", cover: "assets/img/neon/neon-cover" },
  ];

  function renderBooks() {
    const lib = $("[data-library]");
    if (lib) lib.innerHTML = LIBRARY.map(bookCard).join("");
    $$("[data-p-books]").forEach((el) => {
      const ids = el.dataset.pBooks.split(",");
      el.innerHTML = LIBRARY.filter((b) => ids.includes(b.id)).map(bookCard).join("");
    });
  }
  function bookCard(b) {
    return `
      <article class="book">
        <figure class="book__cover">${picture(b.cover, `Cover image for ${b.title}`, "(min-width: 960px) 33vw, 100vw")}</figure>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.meta)}</p>
        <div class="book__actions">
          <a class="btn btn--light" href="${wa(`Hello Mahmoud, please send me the ${b.title} brochure along with today's available units and cash discount.`)}" target="_blank" rel="noopener">${WA_ICON} Get Brochure &amp; Price List on WhatsApp</a>
          <a class="btn btn--ghost-light" href="tel:+201227275122">Call to Review Layouts</a>
        </div>
      </article>`;
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
        `Hello, this is ${d.name.trim()}.`,
        `Interested in: ${d.interest}.`,
        `Budget: ${d.budget}.`,
        `Payment: ${d.terms}.`,
        d.note.trim() ? `Notes: ${d.note.trim()}` : "",
      ].filter(Boolean).join("\n");
      if (config.leadCapture && config.leadCapture.webhookUrl) {
        fetch(config.leadCapture.webhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, source: location.href, at: new Date().toISOString() }) }).catch(() => {});
      }
      track("Brief sent", { interest: d.interest, budget: d.budget, terms: d.terms });
      window.open(wa(text), "_blank", "noopener");
    });
  }
})();
