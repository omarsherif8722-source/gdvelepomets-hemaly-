/**
 * brokerStudio.js
 * Self-service Broker CMS drawer:
 *  - Add new projects
 *  - Add brochures (direct / lead-gated / WhatsApp) to any project
 *  - Import updated Primary ATS / Cash Price CSVs
 *  - View & export captured qualified leads CRM
 *  - Customize broker contact info & export updated JSON files for GitHub
 */

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export function createBrokerStudio(state, helpers) {
  const studioTabs = document.querySelectorAll('[data-studio-tab]');
  const panes = document.querySelectorAll('.studio-pane');

  function activateTab(paneId) {
    studioTabs.forEach((b) => b.classList.toggle('active', b.dataset.studioTab === paneId));
    panes.forEach((p) => p.classList.toggle('active', p.id === paneId));
    if (paneId === 'pane-leads') renderLeadsTable();
    if (paneId === 'pane-add-brochure') syncProjectSelect();
    if (paneId === 'pane-config') populateConfigForm();
  }

  studioTabs.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.studioTab));
  });

  function syncProjectSelect() {
    const sel = document.getElementById('sbProject');
    if (!sel) return;
    sel.innerHTML = state.projects
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.region)})</option>`)
      .join('');
  }

  function populateConfigForm() {
    const c = state.config;
    document.getElementById('scFirm').value = c.brand.brokerFirmName || '';
    document.getElementById('scAdvisor').value = c.brand.advisorName || '';
    document.getElementById('scPhone').value = c.contact.phoneDisplay || '';
    document.getElementById('scWhatsapp').value = c.contact.whatsappNumber || '';
    document.getElementById('scEmail').value = c.contact.email || '';
    document.getElementById('scWebhook').value = c.leadCapture?.webhookUrl || '';
  }

  function renderLeadsTable() {
    const leads = helpers.getLeads();
    document.getElementById('leadsCountHeading').textContent = `${leads.length} Captured Lead${leads.length === 1 ? '' : 's'}`;
    const body = document.getElementById('studioLeadsBody');
    if (!leads.length) {
      body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">No leads captured yet in this browser. Test the consultation or gated brochure form to see leads appear here.</td></tr>`;
      return;
    }
    body.innerHTML = leads
      .slice()
      .reverse()
      .map(
        (l) => `
        <tr>
          <td class="tabular">${escapeHtml(new Date(l.timestamp).toLocaleString())}</td>
          <td><strong>${escapeHtml(l.name)}</strong></td>
          <td>${escapeHtml(l.phone)}<span class="unit-sub">${escapeHtml(l.email)}</span></td>
          <td><strong>${escapeHtml(l.project)}</strong><span class="unit-sub">${escapeHtml(l.unitType || '')}${l.unitRef ? ` · ${escapeHtml(l.unitRef)}` : ''}</span></td>
          <td>${escapeHtml(l.budget || '—')}<span class="unit-sub">${escapeHtml(l.purpose || '')}</span></td>
        </tr>`
      )
      .join('');
  }

  // Add New Project
  document.getElementById('studioAddProjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('spName').value.trim();
    const region = document.getElementById('spRegion').value;
    const location = document.getElementById('spLocation').value.trim();
    const status = document.getElementById('spStatus').value;
    const price = document.getElementById('spPrice').value.trim();
    const payment = document.getElementById('spPayment').value.trim();
    const heroImage = document.getElementById('spImage').value;
    const brochureUrl = document.getElementById('spBrochureUrl').value.trim();
    const desc = document.getElementById('spDesc').value.trim();

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `project-${Date.now()}`;
    const id = state.projects.some((p) => p.id === slug) ? `${slug}-${Date.now()}` : slug;

    const newProject = {
      id,
      slug: id,
      name,
      region,
      location,
      badge: `${status} · ${region}`,
      status,
      featured: false,
      hasLiveAts: false,
      heroImage,
      secondaryImages: [],
      shortDescription: desc,
      overview: desc,
      startingPriceLabel: price,
      startingPriceEGP: null,
      paymentSummary: payment,
      finishing: 'Per Developer Specification',
      delivery: 'Per Phase Schedule',
      kpis: [
        { label: 'Starting From', value: price, sub: status },
        { label: 'Payment Plan', value: payment, sub: 'Flexible Schedule' },
        { label: 'Region', value: region, sub: location },
      ],
      subPhases: [],
      unitTypes: [],
      paymentPlan: { downPaymentPct: 5, after3MonthsPct: 5, years: 8, notes: payment },
      amenities: [],
      locationHighlights: [location],
      brochures: [
        {
          id: `${id}-master`,
          title: `${name} — Official Project Brochure`,
          type: 'Master Brochure',
          pages: 'Overview & Specifications',
          downloadMode: 'direct',
          fileUrl: brochureUrl,
          description: `Master overview, starting price (${price}), and payment terms (${payment}) for ${name}.`,
        },
      ],
      faqs: [],
    };

    state.projects.push(newProject);
    localStorage.setItem('gdev_custom_projects_v1', JSON.stringify(state.projects));
    helpers.refreshAll();
    e.target.reset();
    helpers.showToast(`Added "${name}" to live portfolio!`);
  });

  // Add Brochure to Project
  document.getElementById('studioAddBrochureForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = document.getElementById('sbProject').value;
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const brochure = {
      id: `${projectId}-b-${Date.now()}`,
      title: document.getElementById('sbTitle').value.trim(),
      type: document.getElementById('sbType').value,
      pages: 'Custom Broker Upload',
      downloadMode: document.getElementById('sbMode').value,
      fileUrl: document.getElementById('sbUrl').value.trim(),
      description: document.getElementById('sbDesc').value.trim() || `Downloadable ${document.getElementById('sbType').value} for ${project.name}.`,
    };

    project.brochures = project.brochures || [];
    project.brochures.unshift(brochure);
    localStorage.setItem('gdev_custom_projects_v1', JSON.stringify(state.projects));
    helpers.refreshAll();
    e.target.reset();
    helpers.showToast(`Added brochure to ${project.name}`);
  });

  // Upload CSV inside Studio
  document.getElementById('studioCsvInput').addEventListener('change', (e) => {
    if (e.target.files?.[0]) helpers.ingestCsvFile(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('downloadInventoryJsonBtn').addEventListener('click', () => {
    downloadJson(state.inventory, 'newkairo_inventory.json');
    helpers.showToast('Downloaded newkairo_inventory.json');
  });

  document.getElementById('resetInventoryBtn').addEventListener('click', async () => {
    localStorage.removeItem('gdev_custom_inventory_v1');
    const res = await fetch('data/newkairo_inventory.json');
    state.inventory = await res.json();
    helpers.refreshAll();
    helpers.showToast('Restored default Nov 2026 Primary ATS sheet');
  });

  // Export Leads CSV
  document.getElementById('exportLeadsCsvBtn').addEventListener('click', () => {
    const leads = helpers.getLeads();
    const cols = ['timestamp', 'name', 'phone', 'email', 'project', 'unitType', 'unitRef', 'budget', 'purpose', 'channel', 'notes'];
    const lines = [cols.join(',')];
    leads.forEach((l) => {
      lines.push(cols.map((c) => `"${String(l[c] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gdev-qualified-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    helpers.showToast(`Exported ${leads.length} leads to CSV`);
  });

  document.getElementById('clearLeadsBtn').addEventListener('click', () => {
    if (!confirm('Clear all locally saved leads from this browser?')) return;
    localStorage.removeItem('gdev_leads_v1');
    renderLeadsTable();
    helpers.showToast('Cleared local leads');
  });

  // Save Broker Contact Config
  document.getElementById('studioConfigForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('scPhone').value.trim();
    const wa = document.getElementById('scWhatsapp').value.replace(/\D/g, '');
    state.config.brand.brokerFirmName = document.getElementById('scFirm').value.trim() || state.config.brand.brokerFirmName;
    state.config.brand.advisorName = document.getElementById('scAdvisor').value.trim() || state.config.brand.advisorName;
    state.config.contact.phoneDisplay = phone || state.config.contact.phoneDisplay;
    state.config.contact.phoneHref = phone.replace(/[^\d+]/g, '') || state.config.contact.phoneHref;
    state.config.contact.whatsappNumber = wa || state.config.contact.whatsappNumber;
    state.config.contact.email = document.getElementById('scEmail').value.trim() || state.config.contact.email;
    state.config.leadCapture = state.config.leadCapture || {};
    state.config.leadCapture.webhookUrl = document.getElementById('scWebhook').value.trim();

    localStorage.setItem('gdev_custom_config_v1', JSON.stringify(state.config));
    helpers.applySiteConfig();
    helpers.showToast('Updated broker contact details across site');
  });

  document.getElementById('exportProjectsJsonBtn').addEventListener('click', () => {
    downloadJson(
      {
        schemaVersion: '1.0',
        lastUpdated: new Date().toISOString().slice(0, 10),
        regions: ['All', 'East Cairo', 'West Cairo', 'North Coast', 'Ain Sokhna'],
        projects: state.projects,
      },
      'projects.json'
    );
    helpers.showToast('Downloaded projects.json — drop into /data/ to publish');
  });

  document.getElementById('exportConfigJsonBtn').addEventListener('click', () => {
    downloadJson(state.config, 'site_config.json');
    helpers.showToast('Downloaded site_config.json');
  });

  function open(paneId = 'pane-add-project') {
    activateTab(paneId);
    helpers.openModal('studioModal');
  }

  return { open, syncProjectSelect, renderLeadsTable };
}
