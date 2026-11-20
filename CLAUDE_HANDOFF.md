# Claude Continuation Handoff — G Developments Brokerage & Company Profile Portal

Use this document to resume development seamlessly in **Claude** (or any coding assistant). It captures the complete architecture, data schemas, design system, currently integrated live inventory, and exact instructions for ingesting future **Standard Payment PDFs**, **Cash Price sheets**, **new projects**, and **official developer brochures**.

---

## 1. Project Overview & Goals

- **Purpose:** High-converting **G Developments Company Profile & Independent Broker Lead-Generation Portal** modeled after the refined editorial luxury UI aesthetic of `pc-thegdevelopments.com` (100% original zero-copied code), tailored for **Omar Sherif / Hemaly Real Estate Advisory** to attract and qualify high-intent buyers.
- **Primary Focus:** **NEWKAIRO** (especially the new **krypton** serviced apartments launch, **Neon Views**, **Golf Collection — Argon & Cerium Views**, and **Urban Living**) plus full coverage of all 10 G Developments communities (**NEWGIZA**, **Seashell Ras El Hekma**, **Playa Ras El Hekma**, **Playa Ghazala**, **IVY New Zayed**, **Seashell Sidi Abdelrahman**, **Ein Bay & Ein Resort**, **City View**, **Hacienda Red**).
- **Tech Stack:** Zero-build, dependency-free static web application (**HTML5 + CSS3 + ES6 Modules + JSON/CSV**). Works instantaneously on **GitHub Pages**, **Netlify**, **Vercel**, **Cloudflare Pages**, or locally via `python3 -m http.server 8080`.
- **Target GitHub Repo:** `https://github.com/omarsherif8722-source/gdvelepomets-hemaly-.git`

---

## 2. Repository File Structure

```text
.
├── index.html                           # Single-page portal markup, modals, Broker Studio & semantic SEO
├── css/
│   └── styles.css                       # Original luxury editorial CSS (ivory/obsidian/champagne gold)
├── js/
│   ├── app.js                           # Bootstraps JSON datasets, renders hero/projects/krypton/profile/leads
│   ├── inventory.js                     # Live 262-unit NEWKAIRO Primary ATS explorer, payment/cash calc & CSV parser
│   ├── brochures.js                     # Multi-option brochure download center + printable PDF dossier generator
│   └── brokerStudio.js                  # Self-service Broker CMS (add project, add brochure, upload CSV, CRM leads)
├── data/
│   ├── site_config.json                 # Broker contact info, firm branding, offices, CRM webhook URL
│   ├── company_profile.json             # Corporate profile of G Developments by Mahmoud El-Gamal
│   ├── projects.json                    # Master 10-project registry with phases, unit types, FAQs & brochures
│   ├── krypton_layouts.json             # All 22 official Block 1 krypton layouts (75–194 SQM, 7.875M–20.35M EGP)
│   ├── payment_terms.json               # Dynamic payment schedules, delivery dates & cash discount config
│   ├── primary_ats_newkairo.csv         # Raw Primary ATS NEWKAIRO sheet (2026-11-18, 262 units)
│   └── newkairo_inventory.json          # Parsed JSON built from primary_ats_newkairo.csv
├── scripts/
│   └── sync_ats_csv.py                  # Python CLI converter: Primary ATS / Cash CSV -> newkairo_inventory.json
├── assets/
│   ├── images/                          # 9 cohesive original architectural editorial photographs (.jpg)
│   └── brochures/
│       └── README.md                    # Drop official PDF brochures here to auto-override generated dossiers
├── docs/
│   └── G_DEVELOPMENTS_COMPANY_PROFILE.md  # Full publication-ready corporate company profile document
├── CLAUDE_HANDOFF.md                    # This continuation guide
└── README.md                            # Quick start & GitHub Pages setup
```

---

## 3. Visual Design System Tokens (`css/styles.css`)

Keep all future edits faithful to these tokens so the site retains its calm architectural polish:
- **Surfaces:** `#FFFFFF` (page), `#FAF8F4` (`--bg-ivory`), `#F3EFE7` (`--bg-stone`), `#131210` (`--bg-ink`), `#1C1A17` (`--bg-ink-soft`)
- **Accent:** `#B8A06A` (`--gold`), `#9C834B` (`--gold-hover`), `#DFC994` (`--gold-light`)
- **Hairlines:** `#E6E0D4` (`--border-hairline`), `#D2C9B8` (`--border-strong`)
- **Typography:**
  - Display Headings: `'Cormorant Garamond', Georgia, serif`
  - UI, Tables & Numbers: `'Plus Jakarta Sans', sans-serif` with `font-variant-numeric: tabular-nums` (`.tabular`)
- **Border Radius:** Architectural crisp (`2px`–`4px`), no bubbly SaaS cards or drop-shadow bloat.

---

## 4. What Is Already Live & Verified

1. **Company Profile (Mahmoud El-Gamal & G Developments):** Live interactive web section + one-click **Printable Company Profile PDF** generator (`js/brochures.js`) + standalone `docs/G_DEVELOPMENTS_COMPANY_PROFILE.md`.
2. **NEWKAIRO & krypton Flagship Hub:** Interactive 22-layout **krypton** table (`1BR`, `2BR`, `3BR`, 276 Block 1 units) + quick phase jump cards (`krypton`, `Neon Views`, `Golf Collection`).
3. **Live NEWKAIRO Primary ATS Explorer (262 Units as of 2026-11-18):**
   - `NEWKAIRO GOLF VIEWS`: 65 units (55 Available) · `37.82M – 72.47M EGP`
   - `NEWKAIRO NEON VIEWS 01`: 27 units (23 Available) · `19.23M – 33.44M EGP`
   - `NEWKAIRO NEON VIEWS 02`: 70 units (64 Available) · `19.23M – 34.05M EGP`
   - `NEWKAIRO URBAN LIVING`: 99 units (99 Available) · `12.74M – 30.01M EGP`
   - `NEWKAIRO URBAN LIVING 03`: 1 unit (`KR01-208/P`, Ready for Reservation) · `15.16M EGP`
   - Features search, multi-facet filters, sorting, Unit Financial Dossier Modal, one-click **"Copy Broker Pitch"**, client-side CSV uploader, and Filtered CSV export.
4. **Multi-Option Brochure Download Center:** Supports **4 modes** (`Direct PDF / Printable Dossier`, `Lead-Gated Unlock`, `WhatsApp Sheet Delivery`, and `Multi-Brochure Custom Pack`).
5. **Broker Studio (`Open Broker Studio` in footer or `?studio=1`):** Add new projects, attach brochures, upload updated ATS/Cash CSVs, edit broker phone/WhatsApp/webhook, inspect captured leads CRM, and export updated JSON files (`projects.json`, `site_config.json`, `newkairo_inventory.json`).

---

## 5. Pending Next Edits (High Priority for Claude)

### Task A — Ingest the User's Google Drive Folder & Standard Payment PDF
The user shared Google Drive folder `https://drive.google.com/drive/folders/1V_sQNiDXeBeJyyfEy6cZgsDD3fZG6KAx?hl=ar`, which was restricted (sign-in required) during initial creation. Once the user shares the files directly with Claude (or sets folder access to *"Anyone with the link → Viewer"*):
1. **Extract from the Standard Payment PDF (krypton & NEWKAIRO):**
   - Exact installment milestones (e.g., 5% contract, 5% after 3 months, delivery payment %, quarterly/annual step-ups, number of years — 7 / 8 / 8.5 / 9 / 10 years if multiple options exist).
   - Exact **Cash Discount %** and **Final Cash Prices** per phase/unit type.
   - Exact **Delivery Date** (month/quarter/year per phase: Krypton, Neon Views 01/02, Golf Views, Urban Living) and **Maintenance Fee %** + **Club Membership Fee**.
2. **Update `data/payment_terms.json` & `js/inventory.js`:**
   - Replace the simulated cash discount slider default with the **official Cash Discount %** (and support multiple selectable official payment plans from the Standard Payment PDF inside both the **krypton 22-layout explorer** and the **Live 262-unit Primary ATS table** + **Unit Financial Dossier Modal**).
   - Add a **Delivery Date & Maintenance Fee** badge inside every NEWKAIRO phase card and Unit Dossier Modal.
3. **Place Official PDF Brochures into `assets/brochures/`:**
   - Match the exact filenames referenced in `data/projects.json` (see `assets/brochures/README.md`) OR update `fileUrl` in `data/projects.json` to point to the newly added PDFs. The site automatically checks `HEAD` on `fileUrl` and downloads the real PDF directly when present!

### Task B — Ingest Future Availability & Final Cash Price Sheets
When the user provides a newer Primary ATS CSV or Cash Price Excel/CSV:
1. Save raw CSV to `data/primary_ats_newkairo.csv` (if Excel `.xlsx`, convert to CSV first).
2. If the sheet includes a `Cash Price` column (or separate cash table by unit number), update `scripts/sync_ats_csv.py` and run:
   ```bash
   python3 scripts/sync_ats_csv.py data/primary_ats_newkairo.csv data/newkairo_inventory.json
   ```
3. `inventory.js` already reads `unit.cashPrice` and automatically switches the display from *"Est. Cash Discount"* to **"Official Cash Price"** whenever `cashPrice` is populated!

### Task C — Personalize Broker Identity & Connect Live Lead CRM
1. Edit `data/site_config.json` with Omar's real mobile number, WhatsApp digits, agency name, logo, and email.
2. Add a live CRM webhook (`leadCapture.webhookUrl`) using **Formspree**, **Make.com**, **Google Apps Script → Google Sheets**, or **HubSpot** so every qualified lead & gated brochure unlock flows straight into Omar's CRM and WhatsApp notifications.

### Task D — Optional Enhancements for Future Sprints
- **Arabic / English Bilingual Toggle (`AR / EN` with RTL layout):** Huge conversion boost for Egyptian and GCC buyers.
- **Interactive Masterplan Pin Map** for NEWKAIRO (Krypton Boulevard, Neon Views, Argon/Cerium Golf Rows, Urban Living).
- **Krypton Floor Plan Image Gallery:** Attach floor plan images from the Drive PDF into `assets/floorplans/` and display them inside each row of the krypton 22-layout explorer.
- **Meta Pixel + Google Analytics 4 + Google Ads Conversion Tracking** on `Submit Qualified Inquiry`, `Brochure Unlock`, and `WhatsApp Click`.

---

## 6. Copy-Paste Starter Prompt for Claude

When opening a new session in Claude, upload this `CLAUDE_HANDOFF.md` plus your **Standard Payment PDF** / **Cash Price Sheet** / **Brochures**, and paste:

> I am continuing development on my G Developments brokerage website & company profile portal (details in `CLAUDE_HANDOFF.md`). The repo is at `https://github.com/omarsherif8722-source/gdvelepomets-hemaly-`.
>
> Here are my official NEWKAIRO & krypton files (Standard Payment PDF, delivery dates, cash prices, and brochures). Please:
> 1. Parse every payment plan, cash discount percentage, maintenance fee, and exact delivery date from the Standard Payment PDF into `data/payment_terms.json`.
> 2. Update `js/inventory.js` and `js/app.js` so users can toggle between ALL official payment plans + official Cash Prices dynamically across the krypton layouts and all 262 Primary ATS NEWKAIRO units.
> 3. Link the official PDF brochures inside `assets/brochures/` and `data/projects.json` while keeping the same luxury editorial UI aesthetic.
