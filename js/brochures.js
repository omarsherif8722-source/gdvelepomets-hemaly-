/**
 * brochures.js
 * Multi-option Brochure Download Center + Printable Branded PDF Dossier Generator
 * Supports:
 *  - Direct PDF download (auto-detects local/external file; falls back to branded printable dossier)
 *  - Lead-gated brochure unlock (captures qualified broker lead before unlocking)
 *  - WhatsApp delivery handoff
 *  - Multi-brochure custom pack bundling
 *  - Full Printable G Developments Company Profile PDF generator
 */

export function formatEGP(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return 'On Request';
  return new Intl.NumberFormat('en-EG').format(Math.round(Number(num))) + ' EGP';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openPrintableDossier(htmlContent, title = 'G Developments Brochure') {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert('Please allow pop-ups in your browser to open the printable PDF brochure.');
    return;
  }
  win.document.open();
  win.document.write(htmlContent);
  win.document.close();
  win.document.title = title;
}

export function buildProjectDossierHtml(project, brochure, siteConfig) {
  const unitRows = (project.unitTypes || [])
    .map(
      (u) => `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.beds)}</td>
        <td>${escapeHtml(u.bua)}</td>
        <td>${escapeHtml(u.finishing)}</td>
        <td style="text-align:right;font-weight:700;">${escapeHtml(u.price)}</td>
        <td>${escapeHtml(u.plan)}</td>
      </tr>`
    )
    .join('');

  const phaseCards = (project.subPhases || [])
    .map(
      (ph) => `
      <div class="box">
        <div class="kicker">${escapeHtml(ph.tag)} · ${escapeHtml(ph.startingPrice)}</div>
        <h4>${escapeHtml(ph.name)}</h4>
        <p>${escapeHtml(ph.summary)}</p>
      </div>`
    )
    .join('');

  const amenityItems = (project.amenities || [])
    .map((a) => `<li><strong>${escapeHtml(a.title)}:</strong> ${escapeHtml(a.detail)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(brochure.title)} — ${escapeHtml(project.name)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #171614; margin: 0; padding: 32px; background: #FAF8F4; line-height: 1.55; }
  .sheet { max-width: 840px; margin: 0 auto; background: #fff; border: 1px solid #DFD8C9; padding: 40px 44px; }
  .toolbar { max-width: 840px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; font-family: -apple-system, sans-serif; }
  .print-btn { background: #B8A06A; color: #fff; border: none; padding: 10px 20px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; font-size: 12px; }
  .top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #131210; padding-bottom: 18px; margin-bottom: 26px; }
  .kicker { font-family: -apple-system, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9C834B; }
  h1 { font-size: 36px; margin: 4px 0 4px; font-weight: 500; }
  h2 { font-size: 22px; margin: 28px 0 12px; border-bottom: 1px solid #E6E0D4; padding-bottom: 6px; font-weight: 500; }
  h4 { margin: 4px 0 6px; font-size: 17px; }
  p, li, td, th { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0 24px; }
  .kpi { background: #FAF8F4; border: 1px solid #E6E0D4; padding: 12px 14px; }
  .kpi strong { display: block; font-family: Georgia, serif; font-size: 22px; color: #131210; }
  .kpi span { font-size: 11px; color: #6B655B; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .box { border: 1px solid #E6E0D4; padding: 14px 16px; background: #FAF8F4; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #131210; color: #DFC994; text-align: left; padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 9px 10px; border-bottom: 1px solid #E6E0D4; }
  .footer { margin-top: 32px; padding-top: 18px; border-top: 1px solid #131210; display: flex; justify-content: space-between; font-size: 12px; color: #534F47; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .sheet { border: none; padding: 0; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span style="font-size:13px;color:#534F47;">Branded Printable Brochure Dossier · Ready for PDF Save</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="kicker">G Developments · ${escapeHtml(project.region)} · ${escapeHtml(brochure.type)}</div>
        <h1>${escapeHtml(project.name)}</h1>
        <div style="font-family:sans-serif;font-size:13px;color:#534F47;">${escapeHtml(brochure.title)} — ${escapeHtml(project.location)}</div>
      </div>
      <div style="text-align:right;font-family:sans-serif;font-size:12px;">
        <strong>${escapeHtml(siteConfig.brand.brokerFirmName)}</strong><br/>
        ${escapeHtml(siteConfig.brand.advisorName)} · ${escapeHtml(siteConfig.contact.phoneDisplay)}<br/>
        ${escapeHtml(siteConfig.contact.email)}
      </div>
    </div>

    <div class="kpis">
      ${(project.kpis || [])
        .map(
          (k) => `<div class="kpi"><span>${escapeHtml(k.label)}</span><strong>${escapeHtml(k.value)}</strong><span>${escapeHtml(k.sub || '')}</span></div>`
        )
        .join('')}
    </div>

    <h2>Project Overview</h2>
    <p>${escapeHtml(project.overview)}</p>

    ${phaseCards ? `<h2>Phases &amp; Signature Collections</h2><div class="grid2">${phaseCards}</div>` : ''}

    ${
      unitRows
        ? `<h2>Unit Types, Areas &amp; Indicative Pricing</h2>
           <table>
             <thead><tr><th>Unit Category</th><th>Beds</th><th>BUA</th><th>Finishing</th><th style="text-align:right;">Price</th><th>Plan</th></tr></thead>
             <tbody>${unitRows}</tbody>
           </table>`
        : ''
    }

    <h2>Payment Terms &amp; Amenities</h2>
    <p><strong>Payment Terms:</strong> ${escapeHtml(project.paymentPlan?.notes || project.paymentSummary)}</p>
    <ul>${amenityItems}</ul>

    <div class="footer">
      <div><strong>${escapeHtml(siteConfig.brand.brokerFirmName)}</strong> · Zero Buyer Commission · Official Developer Contracts</div>
      <div>Direct Desk: ${escapeHtml(siteConfig.contact.phoneDisplay)}</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildCompanyProfileHtml(profile, projects, siteConfig) {
  const projectRows = projects
    .map(
      (p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.region)}</td>
        <td>${escapeHtml(p.status)}</td>
        <td>${escapeHtml(p.startingPriceLabel)}</td>
        <td>${escapeHtml(p.paymentSummary)}</td>
      </tr>`
    )
    .join('');

  const milestones = (profile.milestones || [])
    .map((m) => `<li><strong>${escapeHtml(m.period)} — ${escapeHtml(m.title)}:</strong> ${escapeHtml(m.detail)}</li>`)
    .join('');

  const pillars = (profile.pillars || [])
    .map(
      (p) => `
      <div class="box">
        <div class="kicker">Pillar ${escapeHtml(p.code)}</div>
        <h4>${escapeHtml(p.title)}</h4>
        <p>${escapeHtml(p.summary)}</p>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>G Developments — Corporate Company Profile (Mahmoud El-Gamal)</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #171614; margin: 0; padding: 32px; background: #FAF8F4; line-height: 1.55; }
  .sheet { max-width: 860px; margin: 0 auto; background: #fff; border: 1px solid #DFD8C9; padding: 44px; }
  .toolbar { max-width: 860px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; font-family: -apple-system, sans-serif; }
  .print-btn { background: #131210; color: #DFC994; border: none; padding: 11px 22px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; font-size: 12px; }
  .cover { background: #131210; color: #F7F5F0; padding: 34px 36px; margin-bottom: 28px; border-bottom: 4px solid #B8A06A; }
  .kicker { font-family: -apple-system, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #DFC994; }
  .cover h1 { font-size: 40px; margin: 6px 0 8px; font-weight: 500; }
  .cover p { font-family: -apple-system, sans-serif; font-size: 13.5px; color: #C4BEB2; margin: 0; }
  h2 { font-size: 22px; margin: 26px 0 10px; border-bottom: 1px solid #E6E0D4; padding-bottom: 6px; font-weight: 500; }
  h4 { margin: 4px 0 6px; font-size: 16px; }
  p, li, td, th { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { background: #FAF8F4; border: 1px solid #E6E0D4; padding: 14px; }
  .kpi strong { display: block; font-family: Georgia, serif; font-size: 24px; color: #131210; }
  .kpi span { font-size: 11px; color: #6B655B; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .box { border: 1px solid #E6E0D4; padding: 14px 16px; background: #FAF8F4; }
  .box .kicker { color: #9C834B; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #131210; color: #DFC994; text-align: left; padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 9px 10px; border-bottom: 1px solid #E6E0D4; }
  .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #131210; font-size: 11.5px; color: #534F47; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .sheet { border: none; padding: 0; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span style="font-size:13px;color:#534F47;">G Developments Corporate Company Profile · Prepared for Private Advisory Clients</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="cover">
      <div class="kicker">Developer Company Profile · 2026 Edition</div>
      <h1>G Developments</h1>
      <p>Founded by ${escapeHtml(profile.founderAndChairman)} · Formerly ${escapeHtml(profile.formerName)} · NEWKAIRO · NEWGIZA · Seashell · Playa · IVY · Ein Bay</p>
    </div>

    <div class="kpis">
      ${(profile.kpis || [])
        .map((k) => `<div class="kpi"><strong>${escapeHtml(k.value)}</strong><span>${escapeHtml(k.label)}</span></div>`)
        .join('')}
    </div>

    <h2>Executive Overview</h2>
    <p>${escapeHtml(profile.executiveSummary)}</p>
    <p>${escapeHtml(profile.coFounderContext)}</p>

    <div class="box" style="border-left:3px solid #B8A06A; margin:18px 0;">
      <div class="kicker">Founder &amp; Chairman</div>
      <h4>${escapeHtml(profile.leadership.name)} — ${escapeHtml(profile.leadership.role)}</h4>
      <p style="margin:0;">${escapeHtml(profile.leadership.bio)}</p>
    </div>

    <div class="grid2" style="margin-bottom:18px;">
      <div class="box"><div class="kicker">Vision</div><p style="margin:6px 0 0;">${escapeHtml(profile.vision)}</p></div>
      <div class="box"><div class="kicker">Mission</div><p style="margin:6px 0 0;">${escapeHtml(profile.mission)}</p></div>
    </div>

    <h2>Core Development Pillars</h2>
    <div class="grid2">${pillars}</div>

    <h2>Complete Portfolio Directory</h2>
    <table>
      <thead><tr><th>Destination</th><th>Corridor</th><th>Status</th><th>Starting From</th><th>Payment Terms</th></tr></thead>
      <tbody>${projectRows}</tbody>
    </table>

    <h2>Corporate Milestones</h2>
    <ul>${milestones}</ul>

    <div class="footer">
      <strong>Prepared by ${escapeHtml(siteConfig.brand.brokerFirmName)} (${escapeHtml(siteConfig.brand.advisorName)})</strong> · Direct Line: ${escapeHtml(siteConfig.contact.phoneDisplay)} · ${escapeHtml(siteConfig.contact.email)}<br/>
      ${escapeHtml(siteConfig.disclaimer)}
    </div>
  </div>
</body>
</html>`;
}

export function createBrochureController(state, helpers) {
  let activeProjectFilter = 'ALL';
  let activeTypeFilter = 'ALL';
  const selectedBundle = new Map(); // brochureId -> { project, brochure }
  let pendingGatedItems = [];

  const gridEl = document.getElementById('brochureGrid');
  const tabsEl = document.getElementById('brochureProjectTabs');
  const typeSelect = document.getElementById('brochureTypeFilter');
  const bundleBar = document.getElementById('brochureBundleBar');
  const bundleCountLabel = document.getElementById('bundleCountLabel');

  function getAllBrochures() {
    const list = [];
    for (const project of state.projects) {
      for (const b of project.brochures || []) {
        list.push({ project, brochure: b });
      }
    }
    return list;
  }

  async function tryDownloadOrDossier(project, brochure) {
    const url = (brochure.fileUrl || '').trim();
    if (url) {
      // External link (e.g., Google Drive / hosted PDF)
      if (/^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
        helpers.showToast(`Opened ${brochure.title}`);
        return;
      }
      // Local file check (e.g., CSV or real PDF dropped into assets/brochures/)
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          const a = document.createElement('a');
          a.href = url;
          a.download = url.split('/').pop();
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
          helpers.showToast(`Downloading ${brochure.title}`);
          return;
        }
      } catch (_) {
        // fallback to printable dossier
      }
    }
    // Instant branded printable brochure fallback (always works, zero 404s)
    const html = buildProjectDossierHtml(project, brochure, state.config);
    openPrintableDossier(html, `${brochure.title} — ${project.name}`);
    helpers.showToast(`Opened printable PDF dossier for ${brochure.title}`);
  }

  function handleBrochureAction(project, brochure, forcedMode = null) {
    const mode = forcedMode || brochure.downloadMode || 'direct';
    if (mode === 'whatsapp') {
      const msg = `Hello ${state.config.brand.advisorName}, please send me the official "${brochure.title}" for ${project.name} along with latest unit availability and payment terms.`;
      helpers.openWhatsApp(msg);
      return;
    }
    if (mode === 'gated') {
      pendingGatedItems = [{ project, brochure }];
      document.getElementById('bgTitle').textContent = brochure.title;
      document.getElementById('bgDesc').textContent = `Enter your details to instantly unlock "${brochure.title}" (${project.name}) and receive official developer availability.`;
      helpers.openModal('brochureGateModal');
      return;
    }
    tryDownloadOrDossier(project, brochure);
  }

  function updateBundleBar() {
    const count = selectedBundle.size;
    bundleBar.style.display = count > 0 ? 'flex' : 'none';
    bundleCountLabel.textContent = `${count} brochure${count === 1 ? '' : 's'} selected`;
  }

  function renderTabs() {
    const projectsWithBrochures = state.projects.filter((p) => (p.brochures || []).length > 0);
    tabsEl.innerHTML = [
      `<button type="button" class="filter-tab ${activeProjectFilter === 'ALL' ? 'active' : ''}" data-bproj="ALL">All Projects</button>`,
      ...projectsWithBrochures.map(
        (p) =>
          `<button type="button" class="filter-tab ${activeProjectFilter === p.id ? 'active' : ''}" data-bproj="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`
      ),
    ].join('');

    tabsEl.querySelectorAll('[data-bproj]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeProjectFilter = btn.dataset.bproj;
        renderTabs();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const all = getAllBrochures().filter(({ project, brochure }) => {
      if (activeProjectFilter !== 'ALL' && project.id !== activeProjectFilter) return false;
      if (activeTypeFilter !== 'ALL' && brochure.type !== activeTypeFilter) return false;
      return true;
    });

    if (!all.length) {
      gridEl.innerHTML = `<div style="grid-column:1/-1;padding:32px;background:#fff;border:1px solid var(--border-hairline);text-align:center;color:var(--text-secondary);">No brochures match this filter yet. Use "+ Add Brochure" to attach one.</div>`;
      return;
    }

    gridEl.innerHTML = all
      .map(({ project, brochure }) => {
        const checked = selectedBundle.has(brochure.id) ? 'checked' : '';
        const modeBadge =
          brochure.downloadMode === 'gated'
            ? 'VIP Unlock'
            : brochure.downloadMode === 'whatsapp'
            ? 'WhatsApp Sheet'
            : 'Instant PDF';
        const primaryLabel =
          brochure.downloadMode === 'gated'
            ? 'Unlock & Download'
            : brochure.downloadMode === 'whatsapp'
            ? 'Get on WhatsApp'
            : 'Download / Print PDF';

        return `
          <article class="brochure-card">
            <div class="brochure-card-top">
              <span class="brochure-type-tag">${escapeHtml(brochure.type)} · ${modeBadge}</span>
              <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.75rem;color:var(--text-muted);cursor:pointer;">
                <input type="checkbox" class="bundle-check" data-bid="${escapeHtml(brochure.id)}" data-pid="${escapeHtml(project.id)}" ${checked} />
                Pack
              </label>
            </div>
            <div class="brochure-project-label">${escapeHtml(project.name)} · ${escapeHtml(project.region)}</div>
            <h3>${escapeHtml(brochure.title)}</h3>
            <p>${escapeHtml(brochure.description || '')}</p>
            <div class="brochure-card-actions">
              <button type="button" class="btn btn-ink btn-sm" data-baction="primary" data-bid="${escapeHtml(brochure.id)}" data-pid="${escapeHtml(project.id)}">${primaryLabel}</button>
              <button type="button" class="btn btn-outline btn-sm" data-baction="direct" data-bid="${escapeHtml(brochure.id)}" data-pid="${escapeHtml(project.id)}">Preview Dossier</button>
              <button type="button" class="btn btn-whatsapp btn-sm" data-baction="whatsapp" data-bid="${escapeHtml(brochure.id)}" data-pid="${escapeHtml(project.id)}">WhatsApp</button>
            </div>
          </article>
        `;
      })
      .join('');

    gridEl.querySelectorAll('.bundle-check').forEach((chk) => {
      chk.addEventListener('change', () => {
        const project = state.projects.find((p) => p.id === chk.dataset.pid);
        const brochure = project?.brochures?.find((b) => b.id === chk.dataset.bid);
        if (!project || !brochure) return;
        if (chk.checked) selectedBundle.set(brochure.id, { project, brochure });
        else selectedBundle.delete(brochure.id);
        updateBundleBar();
      });
    });

    gridEl.querySelectorAll('[data-baction]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const project = state.projects.find((p) => p.id === btn.dataset.pid);
        const brochure = project?.brochures?.find((b) => b.id === btn.dataset.bid);
        if (!project || !brochure) return;
        const action = btn.dataset.baction;
        if (action === 'primary') handleBrochureAction(project, brochure);
        else if (action === 'direct') handleBrochureAction(project, brochure, 'direct');
        else if (action === 'whatsapp') handleBrochureAction(project, brochure, 'whatsapp');
      });
    });
  }

  typeSelect.addEventListener('change', () => {
    activeTypeFilter = typeSelect.value;
    renderGrid();
  });

  document.getElementById('clearBundleBtn').addEventListener('click', () => {
    selectedBundle.clear();
    updateBundleBar();
    renderGrid();
  });

  document.getElementById('requestBundleBtn').addEventListener('click', () => {
    if (selectedBundle.size === 0) return;
    pendingGatedItems = Array.from(selectedBundle.values());
    const titles = pendingGatedItems.map((x) => `${x.project.name}: ${x.brochure.title}`).join(' · ');
    document.getElementById('bgTitle').textContent = `Custom ${pendingGatedItems.length}-Brochure Pack`;
    document.getElementById('bgDesc').textContent = `Selected: ${titles}. Enter your contact details to unlock your dossiers and receive updated price sheets.`;
    helpers.openModal('brochureGateModal');
  });

  document.getElementById('brochureGateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('bgName').value.trim();
    const phone = document.getElementById('bgPhone').value.trim();
    const email = document.getElementById('bgEmail').value.trim();
    const titles = pendingGatedItems.map((x) => `${x.project.name} — ${x.brochure.title}`).join('; ');

    await helpers.recordLead({
      name,
      phone,
      email,
      project: pendingGatedItems[0]?.project.name || 'Brochure Pack',
      unitType: `Brochure Unlock (${pendingGatedItems.length})`,
      budget: 'Brochure Lead',
      purpose: 'Brochure Download',
      channel: 'Gated Download',
      notes: titles,
    });

    helpers.closeModal('brochureGateModal');
    e.target.reset();

    if (pendingGatedItems.length === 1) {
      await tryDownloadOrDossier(pendingGatedItems[0].project, pendingGatedItems[0].brochure);
    } else if (pendingGatedItems.length > 1) {
      await tryDownloadOrDossier(pendingGatedItems[0].project, pendingGatedItems[0].brochure);
      helpers.showToast(`Unlocked pack (${pendingGatedItems.length} brochures) — first dossier opened!`);
    }
  });

  function openCompanyProfile() {
    const html = buildCompanyProfileHtml(state.companyProfile, state.projects, state.config);
    openPrintableDossier(html, 'G Developments — Corporate Company Profile');
  }

  ['heroCompanyProfilePdfBtn', 'printCompanyProfileBtn', 'brochureCompanyProfileBtn', 'footerPrintProfileBtn'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', openCompanyProfile);
  });

  function openBrochureById(brochureId) {
    for (const project of state.projects) {
      const b = (project.brochures || []).find((item) => item.id === brochureId);
      if (b) {
        handleBrochureAction(project, b);
        return;
      }
    }
  }

  function render() {
    renderTabs();
    renderGrid();
    updateBundleBar();
  }

  return {
    render,
    handleBrochureAction,
    openBrochureById,
    openCompanyProfile,
  };
}
