# Mahmoud Elhemaly · Private advisory for G Developments

A static, no-build website for Krypton at NEWKAIRO and the wider G Developments portfolio.
Plain HTML, CSS and JavaScript, so any static host serves it as-is (Render, GitHub Pages, Netlify).

## Pages

- `/` NEWKAIRO home: the NEWKAIRO film through the wordmark, the four NEWKAIRO parcels, the portfolio, payment plans, brochures and contact.
- `/krypton/` Krypton, a NEWKAIRO parcel: floor plans, floor by floor, payments, gallery and brochures.
- One themed page per project: `/golf-views/`, `/neon-views/`, `/urban-living/`, `/newgiza/`, `/artlife/`, `/meditown/`, `/ivy/`, `/seashell-ras-el-hekma/`, `/playa-ras-el-hekma/`, `/playa-ghazala/`, `/seashell/`, `/ein-bay/`.

All pages are generated from shared parts by `python3 scripts/build_pages.py`. Each project's text, colours (`theme`), wordmark, images and video live in `data/portfolio.json`.

Run the build again after editing `css/site.css` or `js/site.js` as well: the pages link to them with a content version (`site.css?v=…`), so visitors get the new files straight away instead of a cached copy.

**Adding a project film.** Put three files in `assets/video/` (a short muted loop, the full film, a poster frame), add them to the project in `data/portfolio.json`:

```json
"video": { "loop": "assets/video/golf-loop.mp4", "film": "assets/video/golf-film.mp4", "poster": "assets/video/golf-poster.jpg" }
```

then run `python3 scripts/build_pages.py` and push. The page switches from the still image to the film, with a "Play the film" button.

## What's on the home page

| Section | What it does | Data |
| --- | --- | --- |
| Hero | The Krypton film plays through the "krypton" wordmark, then opens full screen on scroll | `assets/video/` |
| Krypton | Tabs for the place, 25 floor plans with room sizes, floor-by-floor released units (Blocks 1–2), payment steps and a gallery | `data/krypton.json`, `assets/img/plans/` |
| Portfolio | Destination tabs (East Cairo, West Cairo, North Coast, Ain Sokhna), 13 projects, a details panel with homes, payment terms and brochures | `data/portfolio.json` |
| Payment plans | Every destination and phase from the Standard Payment Plans of October 18, 2026, with a price input, schedule, maintenance and cash price | `data/payment_terms.json` |
| Brochures | Krypton Blocks 1 and 2, Golf Views and Neon Views PDFs, compressed for the web | `assets/brochures/` |
| Contact | WhatsApp and "Call a salesperson" on +20 122 727 5122, and a brief form that opens WhatsApp pre-filled | `data/site_config.json` |

## Private dashboard

`/dashboard` (unlisted, not indexed) opens with a passcode and shows inventory totals by project and status, the full unit list with filters, a "Send to client" WhatsApp share per unit and a CSV export. The passcode is checked in the browser, so treat it as a light lock: the data file is still reachable for anyone who knows its address. To change it, put the output of `printf '%s' 'NEW-CODE' | shasum -a 256` into `PASS_HASH` in `js/dashboard.js`.

**Website stats.** The site sends visits and these events to Umami Cloud (free plan): WhatsApp click and Call click (with where on the page), Brochure download, Film play, Project opened, Krypton layout viewed, Payment plan opened and Brief sent. To switch it on, fill `analytics.umamiScript`, `analytics.umamiWebsiteId` and `analytics.umamiShareUrl` in `data/site_config.json` from your Umami account; the dashboard then shows the stats. Visits only count on `mahmoud-elhemaly.onrender.com` (set in `analytics.domains`), so local testing stays out of the numbers.

**Meta Pixel and Conversions API.** The same actions go to Meta as `PageView`, `ViewContent` (project pages, layouts, the film), `CustomizeProduct` (payment plans), `Contact` (WhatsApp and call), `Lead` (brief sent) and `BrochureDownload`, each twice under one event id: from the browser (the Pixel, once `analytics.metaPixelId` is filled in) and from the media-buying dashboard's server (`analytics.collectUrl`), so Meta counts it once and still gets it when the Pixel is blocked. Put the same Pixel ID in the dashboard's `META_DATASET_ID` on Render. No names or phone numbers are sent. To test, open any page with `?track=test` (with `META_TEST_EVENT_CODE` set on the dashboard, the events show in Events Manager → Test events).

**Privacy notice.** On the first visit a short notice says what is measured and that it goes to Meta, with Details (the full explanation, also linked in every footer) and Turn off. Turning it off stops the Pixel and everything sent to the dashboard and Meta, deletes Meta's cookies, and drops the ref code from WhatsApp messages. `privacy.mode` in `data/site_config.json`: `notice` (measure unless turned off, the default) or `ask` (measure only after Allow).

**Ref codes.** A visit's source (`utm_*`, `ad_id`, `ref`, `fbclid` from the ad's link) is kept for 30 days, and every WhatsApp message the site opens ends with `(Ref W-…)` (the ad), a Tracked link's code, or `(Ref WEB)`. The dashboard turns the code back into the campaign, ad set and ad.

The WhatsApp button with the number under it stays on screen everywhere.

## Updating

**New availability sheets.** Export the Primary ATS reports to Excel, then:

```bash
pip3 install openpyxl
python3 scripts/build_inventory.py ~/Downloads/"Primary ATS"*.xlsx
```

The newest "As of" date wins when two files cover the same report. Unknown phases are listed so you can map them in `PHASES` at the top of the script. Commit and push; Render redeploys on its own.

**New payment sheet.** Edit `data/payment_terms.json`. Each phase has `down` (payments at contracting, e.g. `[5, 5]`), `installments`, `delivery` months and `cash` discount.

**Contact details.** `data/site_config.json`. Paste a Formspree or Google Apps Script URL into `leadCapture.webhookUrl` to receive a copy of every form brief by email or in a sheet.

## Run locally

```bash
python3 -m http.server 4174
```

Then open http://localhost:4174. Opening `index.html` directly from disk won't load the data files.

## Notes

- Krypton, Golf Views, Neon Views and NEWKAIRO images are extracted from the developer brochures. Images for NEWGIZA, IVY, the North Coast and Ain Sokhna are illustrative and labelled as such.
- The site states it is independent advisory and not the official G Developments website.
