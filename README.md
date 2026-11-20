# G Developments — Company Profile & Private Brokerage Portal

A zero-build, dynamic real estate brokerage & company profile website for **G Developments** (founded by **Mahmoud El-Gamal**), centered on **NEWKAIRO & krypton** with live **Primary ATS inventory (262 units)**, full **10-project portfolio**, **multi-option brochure download center**, and built-in **Broker Studio CMS**.

## Highlights
- **NEWKAIRO & krypton Launch Center:** Interactive 22-layout krypton explorer (`7.875M – 20.35M EGP`, 5% down, 5% after 3 months, 8-year quarterly math) + phase cards.
- **Live NEWKAIRO Primary ATS Explorer:** All 262 tracked units across Golf Views (Argon & Cerium), Neon Views 01 & 02, and Urban Living with multi-facet filters, real-time installment & cash discount calculator, one-click broker pitch copy, CSV upload, and filtered CSV export.
- **Corporate Company Profile:** Complete executive profile of G Developments & Mahmoud El-Gamal (`docs/G_DEVELOPMENTS_COMPANY_PROFILE.md`) + printable PDF export right from the website.
- **Multi-Option Brochure Center:** Direct PDF / printable dossier generation, lead-gated VIP unlocks, WhatsApp sheet requests, and multi-brochure bundle requests.
- **Broker Studio (`?studio=1` or Footer Button):** Visually add new projects, attach brochures, import future Primary ATS / Cash Price CSVs, customize broker contact details & webhook URL, inspect captured leads CRM, and export updated JSON files.

## Run Locally
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.

## Update NEWKAIRO Availability / Cash Sheet
```bash
python3 scripts/sync_ats_csv.py data/primary_ats_newkairo.csv data/newkairo_inventory.json
```

## Deploy on GitHub Pages
1. Push this repository to GitHub (`main` branch).
2. Open **Settings → Pages → Build and deployment → Source: Deploy from a branch (`main` / `/ (root)`)**.
3. Your live website will be published automatically with zero build steps!

## Continuing in Claude
See [`CLAUDE_HANDOFF.md`](./CLAUDE_HANDOFF.md) for the complete technical architecture, data schemas, and Standard Payment PDF ingestion checklist.
