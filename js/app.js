/**
 * app.js
 * Main Orchestrator for G Developments Company Profile & Independent Brokerage Portal
 */

import { createBrochureController, formatEGP } from './brochures.js';
import { createInventoryController } from './inventory.js';
import { createBrokerStudio } from './brokerStudio.js';

const state = {
  config: null,
  companyProfile: null,
  projects: [],
  krypton: null,
  paymentTerms: null,
  inventory: null,
  activeRegion: 'All',
  activeStatus: 'ALL',
  activeKryptonBed: '1br',
};

let brochureCtrl;
let inventoryCtrl;
let studioCtrl;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtNum(n) {
  return new Intl.NumberFormat('en-EG').format(Math.round(n));
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-backdrop.open')) {
    document.body.style.overflow = '';
  }
}

function openWhatsApp(message) {
  const num = (state.config?.contact?.whatsappNumber || '201000000000').replace(/\D/g, '');
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function getLeads() {
  try {
    return JSON.parse(localStorage.getItem('gdev_leads_v1') || '[]');
  } catch {
    return [];
  }
}

async function recordLead(lead) {
  const entry = {
    ...lead,
    timestamp: new Date().toISOString(),
    sourceUrl: window.location.href,
  };
  const list = getLeads();
  list.push(entry);
  localStorage.setItem('gdev_leads_v1', JSON.stringify(list));

  const webhook = state.config?.leadCapture?.webhookUrl;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.warn('Webhook delivery warning:', err);
    }
  }
  return entry;
}

function prefillLeadForm({ project, unitType, unitRef, notes }) {
  const projSel = document.getElementById('leadProject');
  if (project && projSel) {
    const opt = [...projSel.options].find((o) => o.value.toLowerCase() === project.toLowerCase());
    if (opt) projSel.value = opt.value;
  }
  if (unitType) {
    const utSel = document.getElementById('leadUnitType');
    if (utSel) {
      const opt = [...utSel.options].find((o) => o.value.toLowerCase().includes(unitType.toLowerCase()));
      if (opt) utSel.value = opt.value;
    }
  }
  if (unitRef) document.getElementById('leadUnitRef').value = unitRef;
  if (notes) document.getElementById('leadNotes').value = notes;

  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('leadName').focus(), 450);
}

function applySiteConfig() {
  const c = state.config;
  if (!c) return;

  const getPath = (obj, path) => path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const val = getPath(c, el.dataset.bind);
    if (val !== undefined) el.textContent = val;
  });

  document.querySelectorAll('[data-bind-phone]').forEach((el) => {
    el.textContent = c.contact.phoneDisplay;
    if (el.tagName === 'A') el.href = `tel:${c.contact.phoneHref}`;
  });

  document.querySelectorAll('[data-bind-phone-href]').forEach((el) => {
    el.href = `tel:${c.contact.phoneHref}`;
  });

  document.querySelectorAll('[data-bind-email]').forEach((el) => {
    el.textContent = c.contact.email;
    if (el.tagName === 'A') el.href = `mailto:${c.contact.email}`;
  });

  // Render Offices
  const officesGrid = document.getElementById('officesGrid');
  officesGrid.innerHTML = (c.offices || [])
    .map(
      (o) => `
      <div class="office-mini">
        <span>${escapeHtml(o.region)}</span>
        <strong>${escapeHtml(o.name)}</strong>
        <p>${escapeHtml(o.detail)}</p>
      </div>`
    )
    .join('');
}

function renderHeroMetrics() {
  const kpis = state.companyProfile?.kpis || [];
  document.getElementById('heroMetricsGrid').innerHTML = kpis
    .map(
      (k) => `
      <div class="hero-metric">
        <strong class="tabular">${escapeHtml(k.value)}</strong>
        <span>${escapeHtml(k.label)}</span>
      </div>`
    )
    .join('');
}

function renderMegaMenuAndFooter() {
  const regions = ['East Cairo', 'West Cairo', 'North Coast', 'Ain Sokhna'];
  const mega = document.getElementById('megaMenuContent');
  mega.innerHTML = regions
    .map((reg) => {
      const items = state.projects.filter((p) => p.region === reg);
      return `
        <div class="mega-col">
          <h4>${escapeHtml(reg)}</h4>
          ${items.map((p) => `<button type="button" data-open-project="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`).join('')}
        </div>`;
    })
    .join('');

  mega.querySelectorAll('[data-open-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('projectsDropdown').classList.remove('open');
      openProjectModal(btn.dataset.openProject);
    });
  });

  const footerList = document.getElementById('footerProjectsList');
  footerList.innerHTML = state.projects
    .slice(0, 7)
    .map((p) => `<li><button type="button" data-footer-project="${escapeHtml(p.id)}">${escapeHtml(p.name)} · ${escapeHtml(p.region)}</button></li>`)
    .join('');
  footerList.querySelectorAll('[data-footer-project]').forEach((btn) => {
    btn.addEventListener('click', () => openProjectModal(btn.dataset.footerProject));
  });

  const leadProj = document.getElementById('leadProject');
  const prev = leadProj.value;
  leadProj.innerHTML = state.projects
    .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)} (${escapeHtml(p.region)})</option>`)
    .join('');
  if (prev && [...leadProj.options].some((o) => o.value === prev)) leadProj.value = prev;
}

function renderKryptonExplorer() {
  if (!state.krypton) return;
  const tabsEl = document.getElementById('kryptonBedTabs');
  const bodyEl = document.getElementById('kryptonTableBody');
  const footEl = document.getElementById('kryptonTermsFootnote');

  tabsEl.innerHTML = state.krypton.categories
    .map((cat) => {
      const unitTotal = cat.layouts.reduce((sum, x) => sum + (x.units || 0), 0);
      return `
      <button type="button" class="krypton-sel-card ${state.activeKryptonBed === cat.id ? 'active' : ''}" data-kbed="${cat.id}">
        <span>${escapeHtml(cat.label)} · ${cat.layouts.length} Layouts</span>
        <strong class="tabular">From ${(cat.minPrice / 1_000_000).toFixed(1)}M EGP</strong>
        <small class="tabular">${escapeHtml(cat.areaRange)} · ${unitTotal} Units in Block 1</small>
      </button>`;
    })
    .join('');

  tabsEl.querySelectorAll('[data-kbed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeKryptonBed = btn.dataset.kbed;
      renderKryptonExplorer();
    });
  });

  const cat = state.krypton.categories.find((c) => c.id === state.activeKryptonBed) || state.krypton.categories[0];
  bodyEl.innerHTML = cat.layouts
    .map((l) => {
      const dpMin = Math.round(l.minPrice * 0.05);
      const dpMax = Math.round(l.maxPrice * 0.05);
      const qMin = Math.round((l.minPrice * 0.9) / 32);
      const qMax = Math.round((l.maxPrice * 0.9) / 32);
      return `
        <tr>
          <td><strong class="unit-code">${escapeHtml(l.code)}</strong><span class="unit-sub">${escapeHtml(cat.label)}</span></td>
          <td class="tabular"><strong>${escapeHtml(l.sqm)} m²</strong></td>
          <td class="tabular">${l.units}</td>
          <td class="tabular"><strong>${fmtNum(l.minPrice)} – ${fmtNum(l.maxPrice)}</strong></td>
          <td class="tabular">${fmtNum(dpMin)} – ${fmtNum(dpMax)}</td>
          <td class="tabular">${fmtNum(dpMin)} – ${fmtNum(dpMax)}</td>
          <td class="tabular"><strong>${fmtNum(qMin)} – ${fmtNum(qMax)}</strong></td>
          <td><button type="button" class="btn btn-gold btn-sm" data-kreq="${escapeHtml(l.code)}" data-ksqm="${escapeHtml(l.sqm)}">Request</button></td>
        </tr>`;
    })
    .join('');

  bodyEl.querySelectorAll('[data-kreq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      prefillLeadForm({
        project: 'NEWKAIRO',
        unitType: 'Krypton Serviced Apartment',
        unitRef: `Krypton ${btn.dataset.kreq}`,
        notes: `Interested in krypton at NEWKAIRO Layout ${btn.dataset.kreq} (${btn.dataset.ksqm} SQM, ${cat.label}) — please send floor plan & EOI reservation details.`,
      });
    });
  });

  footEl.textContent = `${state.krypton.paymentTerms.summary} · Finishing: ${state.krypton.finishing}. Final unit allocation and cash discount schedule confirmed upon developer release.`;
}

function renderProjectsGrid() {
  const regions = ['All', 'East Cairo', 'West Cairo', 'North Coast', 'Ain Sokhna'];
  const tabsEl = document.getElementById('regionTabs');
  tabsEl.innerHTML = regions
    .map(
      (r) => `
      <button type="button" class="filter-tab ${state.activeRegion === r ? 'active' : ''}" data-reg="${escapeHtml(r)}">
        ${escapeHtml(r)}
      </button>`
    )
    .join('');

  tabsEl.querySelectorAll('[data-reg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeRegion = btn.dataset.reg;
      renderProjectsGrid();
    });
  });

  const filtered = state.projects.filter((p) => {
    if (state.activeRegion !== 'All' && p.region !== state.activeRegion) return false;
    if (state.activeStatus !== 'ALL' && p.status !== state.activeStatus) return false;
    return true;
  });

  const grid = document.getElementById('projectsGrid');
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:36px;background:#fff;border:1px solid var(--border-hairline);text-align:center;color:var(--text-secondary);">No projects match this region/status filter.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((p, idx) => {
      const isWide = idx === 0 && state.activeRegion === 'All' && state.activeStatus === 'ALL';
      const brochureCount = (p.brochures || []).length;
      return `
        <article class="project-card ${isWide ? 'featured-wide' : ''}">
          <div class="project-media">
            <img src="${escapeHtml(p.heroImage)}" alt="${escapeHtml(p.name)} by G Developments in ${escapeHtml(p.region)}" loading="lazy" />
            <span class="project-status-badge">${escapeHtml(p.badge || p.status)}</span>
          </div>
          <div class="project-body">
            <div class="project-region-line">${escapeHtml(p.region)} · ${escapeHtml(p.location)}</div>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="project-desc">${escapeHtml(p.shortDescription)}</p>
            <div class="project-specs">
              <div class="spec-cell">
                <span>Starting From</span>
                <strong class="tabular">${escapeHtml(p.startingPriceLabel)}</strong>
              </div>
              <div class="spec-cell">
                <span>Payment Plan</span>
                <strong>${escapeHtml(p.paymentSummary)}</strong>
              </div>
            </div>
            <div class="project-card-actions">
              <button type="button" class="btn btn-ink btn-sm" data-open-project="${escapeHtml(p.id)}">Explore Details</button>
              <button type="button" class="btn btn-outline btn-sm" data-project-brochures="${escapeHtml(p.id)}">Brochures (${brochureCount})</button>
              ${
                p.hasLiveAts
                  ? `<a href="#newkairo-inventory" class="btn btn-gold btn-sm">262 Live Units</a>`
                  : `<button type="button" class="btn btn-gold btn-sm" data-inquire-project="${escapeHtml(p.name)}">Inquire</button>`
              }
            </div>
          </div>
        </article>`;
    })
    .join('');

  grid.querySelectorAll('[data-open-project]').forEach((b) => {
    b.addEventListener('click', () => openProjectModal(b.dataset.openProject));
  });
  grid.querySelectorAll('[data-project-brochures]').forEach((b) => {
    b.addEventListener('click', () => {
      openProjectModal(b.dataset.projectBrochures, 'brochures');
    });
  });
  grid.querySelectorAll('[data-inquire-project]').forEach((b) => {
    b.addEventListener('click', () => {
      prefillLeadForm({ project: b.dataset.inquireProject, notes: `Requesting full pricing, availability, and payment schedule for ${b.dataset.inquireProject}.` });
    });
  });
}

function openProjectModal(projectId, focusSection = '') {
  const p = state.projects.find((x) => x.id === projectId);
  if (!p) return;

  document.getElementById('pmRegion').textContent = `${p.region} · ${p.location}`;
  document.getElementById('pmTitle').textContent = p.name;

  const kpisHtml = (p.kpis || [])
    .map(
      (k) => `
      <div class="modal-kpi">
        <span>${escapeHtml(k.label)}</span>
        <strong class="tabular">${escapeHtml(k.value)}</strong>
        <span style="margin-top:2px;">${escapeHtml(k.sub || '')}</span>
      </div>`
    )
    .join('');

  const phasesHtml = (p.subPhases || [])
    .map(
      (ph) => `
      <div class="phase-card">
        <span class="meta-tag">${escapeHtml(ph.tag)} · ${escapeHtml(ph.startingPrice)}</span>
        <h4>${escapeHtml(ph.name)}</h4>
        <p>${escapeHtml(ph.summary)}</p>
      </div>`
    )
    .join('');

  const unitsHtml = (p.unitTypes || [])
    .map(
      (u) => `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.beds)}</td>
        <td class="tabular">${escapeHtml(u.bua)}</td>
        <td>${escapeHtml(u.finishing)}</td>
        <td class="tabular"><strong>${escapeHtml(u.price)}</strong></td>
        <td>${escapeHtml(u.plan)}</td>
      </tr>`
    )
    .join('');

  const brochuresHtml = (p.brochures || [])
    .map(
      (b) => `
      <div style="border:1px solid var(--border-hairline);padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;background:#fff;">
        <div>
          <span class="brochure-type-tag">${escapeHtml(b.type)}</span>
          <strong style="display:block;margin-top:4px;">${escapeHtml(b.title)}</strong>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(b.description || '')}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-ink btn-sm" data-pm-brochure="${escapeHtml(b.id)}" data-pm-mode="direct">PDF / Dossier</button>
          <button type="button" class="btn btn-whatsapp btn-sm" data-pm-brochure="${escapeHtml(b.id)}" data-pm-mode="whatsapp">WhatsApp</button>
        </div>
      </div>`
    )
    .join('');

  const faqsHtml = (p.faqs || [])
    .map(
      (f) => `
      <details style="border-bottom:1px solid var(--border-hairline);padding:12px 0;">
        <summary style="font-weight:600;cursor:pointer;">${escapeHtml(f.q)}</summary>
        <p style="margin:8px 0 0;font-size:0.88rem;color:var(--text-secondary);">${escapeHtml(f.a)}</p>
      </details>`
    )
    .join('');

  document.getElementById('pmBody').innerHTML = `
    <img src="${escapeHtml(p.heroImage)}" alt="${escapeHtml(p.name)}" class="modal-hero-img" />
    <div class="modal-kpi-grid">${kpisHtml}</div>
    <p style="font-size:0.96rem;color:var(--text-secondary);margin-bottom:22px;">${escapeHtml(p.overview)}</p>

    ${phasesHtml ? `<h4 class="display-serif" style="font-size:1.5rem;margin:0 0 8px;">Phases &amp; Collections</h4><div class="phase-grid">${phasesHtml}</div>` : ''}

    ${
      unitsHtml
        ? `<h4 class="display-serif" style="font-size:1.5rem;margin:0 0 12px;">Unit Types &amp; Pricing Overview</h4>
           <div class="ats-table-wrap" style="margin-bottom:24px;">
             <table class="ats-table" style="min-width:680px;">
               <thead><tr><th>Unit Type</th><th>Beds</th><th>BUA</th><th>Finishing</th><th>Price</th><th>Payment Plan</th></tr></thead>
               <tbody>${unitsHtml}</tbody>
             </table>
           </div>`
        : ''
    }

    <div style="background:var(--bg-ivory);border:1px solid var(--border-hairline);padding:18px;margin-bottom:24px;">
      <span class="meta-tag">Payment Plan &amp; Terms</span>
      <p style="margin:6px 0 0;font-size:0.9rem;">${escapeHtml(p.paymentPlan?.notes || p.paymentSummary)}</p>
    </div>

    <div id="pmBrochuresAnchor" style="margin-bottom:24px;">
      <h4 class="display-serif" style="font-size:1.5rem;margin:0 0 12px;">Downloadable Brochures &amp; Sheets</h4>
      <div style="display:grid;gap:10px;">${brochuresHtml || '<p>No brochures attached yet.</p>'}</div>
    </div>

    ${faqsHtml ? `<h4 class="display-serif" style="font-size:1.5rem;margin:0 0 8px;">Frequently Asked Questions</h4><div style="margin-bottom:24px;">${faqsHtml}</div>` : ''}

    <div style="display:flex;flex-wrap:wrap;gap:10px;padding-top:16px;border-top:1px solid var(--border-hairline);">
      ${
        p.hasLiveAts
          ? `<button type="button" class="btn btn-gold" id="pmJumpAtsBtn">Inspect Live 262 NEWKAIRO Units</button>`
          : ''
      }
      <button type="button" class="btn btn-ink" id="pmInquireBtn">Request Official Price Sheet</button>
      <button type="button" class="btn btn-whatsapp" id="pmWhatsappBtn">Chat on WhatsApp</button>
    </div>
  `;

  document.getElementById('pmBody').querySelectorAll('[data-pm-brochure]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = p.brochures.find((x) => x.id === btn.dataset.pmBrochure);
      if (b) brochureCtrl.handleBrochureAction(p, b, btn.dataset.pmMode);
    });
  });

  document.getElementById('pmJumpAtsBtn')?.addEventListener('click', () => {
    closeModal('projectModal');
    document.getElementById('newkairo-inventory').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('pmInquireBtn')?.addEventListener('click', () => {
    closeModal('projectModal');
    prefillLeadForm({ project: p.name, notes: `Requesting full unit sheet and payment plan for ${p.name}.` });
  });

  document.getElementById('pmWhatsappBtn')?.addEventListener('click', () => {
    openWhatsApp(`Hello ${state.config.brand.advisorName}, I would like full availability, pricing, and brochures for ${p.name} by G Developments.`);
  });

  openModal('projectModal');
  if (focusSection === 'brochures') {
    setTimeout(() => document.getElementById('pmBrochuresAnchor')?.scrollIntoView({ behavior: 'smooth' }), 120);
  }
}

function renderCompanyProfile() {
  const cp = state.companyProfile;
  if (!cp) return;
  document.getElementById('cpSummary').textContent = cp.executiveSummary;
  document.getElementById('cpContext').textContent = cp.coFounderContext;
  document.getElementById('cpLeaderName').textContent = cp.leadership.name;
  document.getElementById('cpLeaderRole').textContent = cp.leadership.role;
  document.getElementById('cpLeaderBio').textContent = cp.leadership.bio;
  document.getElementById('cpVision').textContent = cp.vision;
  document.getElementById('cpMission').textContent = cp.mission;

  document.getElementById('cpTimeline').innerHTML = (cp.milestones || [])
    .map(
      (m) => `
      <li class="timeline-item">
        <div class="timeline-period">${escapeHtml(m.period)}</div>
        <div>
          <h4>${escapeHtml(m.title)}</h4>
          <p>${escapeHtml(m.detail)}</p>
        </div>
      </li>`
    )
    .join('');

  document.getElementById('cpPillars').innerHTML = (cp.pillars || [])
    .map(
      (p) => `
      <article class="pillar-card">
        <div class="pillar-num">${escapeHtml(p.code)}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.summary)}</p>
      </article>`
    )
    .join('');

  document.getElementById('brokerAdvGrid').innerHTML = (cp.brokerAdvantages || [])
    .map(
      (a) => `
      <div class="broker-adv-item">
        <h4>${escapeHtml(a.title)}</h4>
        <p>${escapeHtml(a.detail)}</p>
      </div>`
    )
    .join('');

  document.getElementById('compareTableBody').innerHTML = (cp.newkairoVsNewgiza || [])
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.factor)}</td>
        <td>${escapeHtml(row.newgiza)}</td>
        <td><strong>${escapeHtml(row.newkairo)}</strong></td>
      </tr>`
    )
    .join('');
}

function wireGlobalEvents() {
  // Scroll elevation & active nav highlight
  const headerEl = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.main-nav a.nav-link')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  window.addEventListener(
    'scroll',
    () => {
      headerEl?.classList.toggle('scrolled', window.scrollY > 24);
      const pos = window.scrollY + 130;
      let currentId = sections[0]?.id;
      for (const sec of sections) {
        if (sec.offsetTop <= pos) currentId = sec.id;
      }
      navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`);
      });
    },
    { passive: true }
  );

  // Mobile menu
  const drawer = document.getElementById('mobileDrawer');
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', String(!open));
  });
  drawer.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    });
  });

  // Dropdown click support on touch screens
  const dd = document.getElementById('projectsDropdown');
  dd.querySelector('.nav-dropdown-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    dd.classList.toggle('open');
  });
  document.addEventListener('click', () => dd.classList.remove('open'));

  // Project status filter
  document.getElementById('projectStatusFilter').addEventListener('change', (e) => {
    state.activeStatus = e.target.value;
    renderProjectsGrid();
  });

  // Quick phase filter buttons on NEWKAIRO launch cards
  document.querySelectorAll('[data-filter-ats-phase]').forEach((btn) => {
    btn.addEventListener('click', () => inventoryCtrl.filterToPhase(btn.dataset.filterAtsPhase));
  });

  document.querySelectorAll('[data-open-brochure]').forEach((btn) => {
    btn.addEventListener('click', () => brochureCtrl.openBrochureById(btn.dataset.openBrochure));
  });

  // Modal close handlers
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-backdrop').forEach((bg) => {
    bg.addEventListener('click', (e) => {
      if (e.target === bg) closeModal(bg.id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach((m) => closeModal(m.id));
    }
  });

  // Studio shortcuts
  document.getElementById('addProjectShortcutBtn').addEventListener('click', () => studioCtrl.open('pane-add-project'));
  document.getElementById('addBrochureShortcutBtn').addEventListener('click', () => studioCtrl.open('pane-add-brochure'));
  document.getElementById('openStudioFooterBtn').addEventListener('click', () => studioCtrl.open('pane-add-project'));
  document.getElementById('mobileOpenStudioBtn').addEventListener('click', () => {
    drawer.classList.remove('open');
    studioCtrl.open('pane-add-project');
  });

  // WhatsApp buttons
  document.getElementById('kryptonWhatsappBtn').addEventListener('click', () => {
    openWhatsApp(`Hello ${state.config.brand.advisorName}, I'm interested in krypton at NEWKAIRO (from 7.9M EGP) and would like the official floor plans, payment terms & EOI details.`);
  });
  document.getElementById('stickyWhatsappBtn').addEventListener('click', () => {
    openWhatsApp(`Hello ${state.config.brand.advisorName}, I found your G Developments advisory portal and would like pricing and availability.`);
  });

  // Main Qualified Lead Capture Form
  document.getElementById('leadQualificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const lead = Object.fromEntries(fd.entries());
    await recordLead(lead);

    const fb = document.getElementById('leadFormFeedback');
    fb.innerHTML = `
      <strong>Thank you, ${escapeHtml(lead.name)}.</strong> Your inquiry for <strong>${escapeHtml(lead.project)}</strong> has been registered with ${escapeHtml(state.config.brand.advisorName)}.
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="btn btn-whatsapp btn-sm" id="fbWaContinueBtn">Continue Instantly on WhatsApp</button>
      </div>
    `;
    fb.classList.add('visible');
    document.getElementById('fbWaContinueBtn').addEventListener('click', () => {
      openWhatsApp(
        `Hello ${state.config.brand.advisorName}, I just submitted an inquiry.\nName: ${lead.name}\nProject: ${lead.project}\nCategory: ${lead.unitType}\nBudget: ${lead.budget}\nGoal: ${lead.purpose}${lead.notes ? `\nNotes: ${lead.notes}` : ''}`
      );
    });
    e.target.reset();
    showToast('Qualified inquiry registered successfully');
  });
}

function refreshAll() {
  applySiteConfig();
  renderHeroMetrics();
  renderMegaMenuAndFooter();
  renderKryptonExplorer();
  renderProjectsGrid();
  renderCompanyProfile();
  inventoryCtrl.render();
  brochureCtrl.render();
  studioCtrl.syncProjectSelect();
}

async function init() {
  const [cfgRes, cpRes, projRes, kryRes, payRes, invRes] = await Promise.all([
    fetch('data/site_config.json'),
    fetch('data/company_profile.json'),
    fetch('data/projects.json'),
    fetch('data/krypton_layouts.json'),
    fetch('data/payment_terms.json'),
    fetch('data/newkairo_inventory.json'),
  ]);

  const baseConfig = await cfgRes.json();
  state.companyProfile = await cpRes.json();
  const projPayload = await projRes.json();
  state.krypton = await kryRes.json();
  state.paymentTerms = await payRes.json();
  const baseInventory = await invRes.json();

  // Merge any Broker Studio local overrides
  try {
    state.config = JSON.parse(localStorage.getItem('gdev_custom_config_v1') || 'null') || baseConfig;
  } catch {
    state.config = baseConfig;
  }
  try {
    state.projects = JSON.parse(localStorage.getItem('gdev_custom_projects_v1') || 'null') || projPayload.projects;
  } catch {
    state.projects = projPayload.projects;
  }
  try {
    state.inventory = JSON.parse(localStorage.getItem('gdev_custom_inventory_v1') || 'null') || baseInventory;
  } catch {
    state.inventory = baseInventory;
  }

  const helpers = {
    showToast,
    openModal,
    closeModal,
    openWhatsApp,
    recordLead,
    getLeads,
    prefillLeadForm,
    applySiteConfig,
    refreshAll,
    ingestCsvFile: (file) => inventoryCtrl.ingestCsvFile(file),
  };

  brochureCtrl = createBrochureController(state, helpers);
  inventoryCtrl = createInventoryController(state, helpers);
  studioCtrl = createBrokerStudio(state, helpers);

  wireGlobalEvents();
  refreshAll();

  // Support deep link ?studio=1
  if (new URLSearchParams(window.location.search).get('studio') === '1') {
    studioCtrl.open('pane-add-project');
  }
}

init().catch((err) => {
  console.error('Initialization failed:', err);
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div style="background:#7F1D1D;color:#fff;padding:12px 20px;text-align:center;font-size:14px;">Unable to load JSON data files. Please serve this folder via a local web server (e.g. <code>python3 -m http.server 8080</code>) or GitHub Pages.</div>`
  );
});
