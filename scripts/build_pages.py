#!/usr/bin/env python3
"""Generate every page of the site from shared parts.

    python3 scripts/build_pages.py

Writes index.html (NEWKAIRO home) and one folder per project, e.g.
krypton/index.html, golf-views/index.html, using data/portfolio.json.
Edit a project's text, theme colours, images or video in portfolio.json
and run this again. To give a project a hero film, add to its entry:

    "video": {"loop": "assets/video/NAME-loop.mp4",
              "film": "assets/video/NAME-film.mp4",
              "poster": "assets/video/NAME-poster.jpg"}
"""
import hashlib
import json
import re
from html import escape as h
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = json.loads((ROOT / "data/portfolio.json").read_text())
PROJECTS = P["projects"]
BY_ID = {p["id"]: p for p in PROJECTS}
REGIONS = {r["id"]: r for r in P["regions"]}
TERMS = json.loads((ROOT / "data/payment_terms.json").read_text())
PHASES = {ph["id"]: ph for d in TERMS["destinations"] for ph in d["phases"]}
# Content versions for the stylesheet and script, so a browser never pairs a new page with an old cached file
def version(path):
    return hashlib.sha1((ROOT / path).read_bytes()).hexdigest()[:10]
CSS_V = version("css/site.css")
JS_V = version("js/site.js")

PHONE_TEL = "+201227275122"
PHONE = "+20 122 727 5122"
WA = "https://wa.me/201227275122?text="

NEWKAIRO_THEME = {"dark": "#221f20", "dark2": "#36302f", "dark3": "#141213", "accent": "#ce3927"}

WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>'
PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>'
PHONE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.58 3.6a1 1 0 0 1-.25 1z"/></svg>'
CONTACT = "Contact a salesperson"  # shown wherever the phone number used to appear
DOWN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v12.2l4.6-4.6 1.4 1.4-7 7-7-7 1.4-1.4 4.6 4.6z"/></svg>'


def wa(text):
    from urllib.parse import quote
    return WA + quote(text)


def u(path):
    if not path:
        return ""
    return path if path.startswith(("/", "http")) else "/" + path


def img(base, alt, sizes="100vw", eager=False):
    b = u(base)
    lazy = "" if eager else ' loading="lazy"'
    return f'<img src="{b}.jpg" srcset="{b}-sm.jpg 800w, {b}.jpg 1800w" sizes="{sizes}" alt="{h(alt)}"{lazy} decoding="async">'


def theme_style(t):
    return (f'--oxblood:{t["dark"]};--oxblood-2:{t["dark2"]};--oxblood-3:{t["dark3"]};--vermilion:{t["accent"]};')


def full_name(p):
    return f'{p["parent"]} {p["name"]}' if p.get("parent") else p["name"]


# ---------------------------------------------------------------- key figures
# The numbers a buyer reads first (down payment, years to pay, delivery...) are shown large,
# with a short plain-English line under them. payment_terms.json: [5, 5] = 5% at signing, 5% three months later.
PLAN_RE = re.compile(r"(\d+(?:\.\d+)?)%(?: \+ (\d+(?:\.\d+)?)%)?, (\d+) years")
NUM_RE = re.compile(r"(From |Up to )?(\d[\d.,]*\+?(?:\s*(?:–|-|to)\s*\d[\d.,]*)?(?:%|M|K)?)\s*(.*)")


def fact_items(k, v):
    """One fact as figures: dicts with label, and either num (+ pre, unit) or text, plus an optional note."""
    kl = k.lower()
    m = PLAN_RE.fullmatch(v)
    if m:
        first, second, years = m.groups()
        lead = "" if kl == "plan" else f"{k}: "
        return [
            {"label": f"{lead}Down payment", "num": f"{first}%",
             "note": f"at signing, then {second}% three months later" if second else "at signing"},
            {"label": f"{lead}Pay over", "num": years, "unit": "years", "note": "equal quarterly instalments"},
        ]
    if kl == "plan":
        m = re.fullmatch(r"(Up to )?(\d+) years", v)
        if m:
            return [{"label": "Pay over", "pre": "up to" if m[1] else "", "num": m[2], "unit": "years",
                     "note": "equal quarterly instalments"}]
    if kl == "cash":
        m = re.fullmatch(r"(Up to )?(\d+(?:\.\d+)?)% off", v)
        if m:
            return [{"label": "Paying in cash", "pre": "up to" if m[1] else "", "num": f"{m[2]}%", "unit": "off",
                     "note": "discount for paying in full"}]
    m = NUM_RE.fullmatch(v)
    if m:
        return [{"label": k, "pre": (m[1] or "").strip().lower(), "num": re.sub(r"\s+to\s+", "–", m[2]), "unit": m[3]}]
    return [{"label": k, "text": v}]


def fact_html(item):
    note = f'<em>{h(item["note"])}</em>' if item.get("note") else ""
    if "num" in item:
        pre = f'<small>{h(item["pre"])}</small>' if item.get("pre") else ""
        unit = f' <span>{h(item["unit"])}</span>' if item.get("unit") else ""
        return f'<div class="fact"><dt>{h(item["label"])}</dt><dd><span class="fig">{pre}<b>{h(item["num"])}</b>{unit}</span>{note}</dd></div>'
    return f'<div class="fact fact--text"><dt>{h(item["label"])}</dt><dd>{h(item["text"])}{note}</dd></div>'


def facts_html(p):
    """The project's facts. A From price is kept off the page and becomes the plan's real down payment."""
    out = []
    for k, v in p["facts"]:
        if k.lower() == "from":
            phase = PHASES.get(((p.get("payment") or {}).get("phases") or [None])[0])
            down = phase["plans"][0]["down"][0] if phase and phase["plans"][0].get("down") else None
            if not down or down >= 100:
                continue
            out.append({"label": "Down payment", "num": f"{down:g}%", "note": "at signing"})
            continue
        out.extend(fact_items(k, v))
    return "".join(fact_html(x) for x in out)


# ---------------------------------------------------------------- amenities
# Line icons for amenities (24 x 24, drawn with the current text colour). Each project lists its amenities in
# data/portfolio.json ("amenities"); NEWKAIRO and NEWGIZA parcels also show their town's ("townAmenities").
def _waves(y):
    return f'<path d="M2 {y}c1.7 0 1.7-1.3 3.3-1.3S7 {y} 8.7 {y}s1.6-1.3 3.3-1.3S13.7 {y} 15.3 {y}s1.7-1.3 3.4-1.3S20.3 {y} 22 {y}"/>'


AMENITY_ICONS = {
    "golf": ("Golf", '<path d="M8 20V3.5l8.5 4L8 11.5"/><path d="M4 20.5c3-1.2 9-1.2 12 0"/>'),
    "pool": ("Pool", '<path d="M8 15V7a3 3 0 0 0-3-3M15 15V7a3 3 0 0 0-3-3M8 9h7M8 12h7"/>' + _waves(19.5)),
    "beach": ("Beach", '<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v8.5M3 20.5h18"/>'),
    "lagoon": ("Lagoons", _waves(7.5) + _waves(12.5) + _waves(17.5)),
    "lake": ("Lake", '<path d="M15.5 9.5v-5M18 9.5v-3M13 9.5V7"/>' + _waves(13.5) + _waves(18)),
    "gym": ("Gym", '<rect x="5" y="6" width="3" height="12" rx="1"/><rect x="16" y="6" width="3" height="12" rx="1"/><path d="M2.5 9.5v5M21.5 9.5v5M8 12h8"/>'),
    "dining": ("Restaurants", '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 3v18"/><path d="M18 21V3c-2.2 1.4-3.2 4-3.2 7.5H18"/>'),
    "retail": ("Shops", '<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>'),
    "school": ("Schools", '<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5M22 9.5V15"/>'),
    "university": ("University", '<path d="M3 9.5 12 4l9 5.5"/><path d="M5.5 10.5v8M10 10.5v8M14 10.5v8M18.5 10.5v8M3 20.5h18"/>'),
    "medical": ("Medical", '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8v8M8 12h8"/>'),
    "concierge": ("Concierge", '<path d="M4 17.5a8 8 0 0 1 16 0z"/><path d="M2.5 20.5h19M12 9.5v-2M10 7.5h4"/>'),
    "housekeeping": ("Housekeeping", '<path d="m12 3.5 1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6L4.5 11l5.6-1.9z"/><path d="M19 17v4M17 19h4"/>'),
    "hotel": ("Hotel", '<path d="M3 18.5V6M3 14.5h18v4"/><path d="M21 14.5V12a3 3 0 0 0-3-3h-7v5.5"/><circle cx="7" cy="11" r="1.8"/>'),
    "park": ("Park", '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21M8.5 21h7"/>'),
    "gardens": ("Gardens", '<path d="M12 21v-8"/><path d="M12 13c0-4 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5zM12 15.5c0-3-2-5-5-5 0 3 2 5 5 5z"/>'),
    "tram": ("Tram", '<rect x="5" y="5" width="14" height="12.5" rx="3"/><path d="M5 11h14M9.5 2.5 12 5l2.5-2.5M8 17.5 6 21M16 17.5l2 3.5"/>'),
    "sports": ("Sports club", '<circle cx="12" cy="12" r="8.5"/><path d="M5.8 6.2c3.2 3.3 3.2 8.3 0 11.6M18.2 6.2c-3.2 3.3-3.2 8.3 0 11.6"/>'),
    "security": ("Security", '<path d="M12 3.2 19.5 6v5.6c0 4.7-3.2 7.9-7.5 9.2-4.3-1.3-7.5-4.5-7.5-9.2V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    "clubhouse": ("Clubhouse", '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5M10 20v-5h4v5"/>'),
    "offices": ("Offices", '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12.5h18"/>'),
    "cablepark": ("Cable park", '<path d="M2.5 4l19 4.5M13.5 7l-3 7.5"/>' + _waves(19)),
    "promenade": ("Promenade", '<circle cx="13.5" cy="4.5" r="1.8"/><path d="m11 21 1.8-5.5-2.8-3 1.4-4.5 3.6 3.2 3 .8M10 12.5 8 16"/>'),
    "ac": ("Air conditioning", '<path d="M12 2.5v19M3.8 7.3l16.4 9.4M3.8 16.7l16.4-9.4M9.5 3.8 12 6l2.5-2.2M9.5 20.2 12 18l2.5 2.2"/>'),
    "sea": ("Sea", '<circle cx="12" cy="9.5" r="3.8"/><path d="M12 2.5v1.3M5 9.5H3.7M20.3 9.5H19"/>' + _waves(18.5)),
    "downtown": ("Downtown", '<path d="M3.5 21V10h6v11M9.5 21V4.5h8V21M17.5 21v-7.5h3V21M2 21h20M12.5 8h2.5M12.5 11h2.5M12.5 14h2.5"/>'),
    "active": ("Active zones", '<circle cx="15" cy="4.5" r="1.8"/><path d="m5 20 4-1.5 1.8-3.5M8.5 10l3.5-2.5 3.5 2.5 2 3 3 .5M12 7.5 10.8 15l4 2.5V21"/>'),
}


def _amenity_items(items):
    out = []
    for it in items:
        key, label = (it, None) if isinstance(it, str) else it
        name, path = AMENITY_ICONS[key]
        out.append(f'<li><span class="amenities__icon"><svg viewBox="0 0 24 24" aria-hidden="true">{path}</svg></span>{h(label or name)}</li>')
    return "\n".join(f"                    {x}" for x in out)


def amenities_html(p):
    """The project's amenities as icons, then its town's (minus any it already lists)."""
    own = p.get("amenities") or []
    town = (P.get("townAmenities") or {}).get(p.get("parent") or "")
    if not own and not town:
        return ""
    keys = {it if isinstance(it, str) else it[0] for it in own}
    html_ = f"""
                <div class="amenities">
                  <h4 class="amenities__title">Amenities</h4>
                  <ul class="amenities__grid">
{_amenity_items(own)}
                  </ul>"""
    if town:
        rest = [it for it in town["items"] if (it if isinstance(it, str) else it[0]) not in keys]
        html_ += f"""
                  <h4 class="amenities__title">{h(town["title"])}</h4>
                  <ul class="amenities__grid">
{_amenity_items(rest)}
                  </ul>"""
    return html_ + "\n                </div>"


# ---------------------------------------------------------------- partials
def head(title, desc, og_image, theme, poster=None):
    pre = f'\n  <link rel="preload" as="image" href="{u(poster)}">' if poster else ""
    return f'''<!doctype html>
<html lang="en" style="{theme_style(theme)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{h(title)}</title>
  <meta name="description" content="{h(desc)}">
  <meta name="theme-color" content="{theme["dark"]}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{h(title)}">
  <meta property="og:description" content="{h(desc)}">
  <meta property="og:image" content="{u(og_image)}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="G Developments">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">{pre}
  <link rel="stylesheet" href="/css/site.css?v={CSS_V}">
</head>'''


NAV = [
    ("/#portfolio", "Portfolio"),
    ("/#payments", "Your future home"),
    ("/#brochures", "Brochures"),
    ("#contact", "Contact"),
]
MENU = [
    ("/#newkairo", "NEWKAIRO"),
    ("/krypton/", "Krypton"),
    ("/#portfolio", "Portfolio"),
    ("/#payments", "Your future home"),
    ("/#brochures", "Brochures"),
    ("#contact", "Contact"),
]
CURRENT = ' aria-current="page"'
CHEVRON = '<svg class="areas__chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def area_menus(slug=None):
    """The area tabs in the top bar: one dropdown per region, listing its projects."""
    out = []
    for r in P["regions"]:
        rows = [("/#newkairo", "NEWKAIRO", "The city and its four parcels", False)] if r["id"] == "east" else []
        rows += [(f'/{p["slug"]}/', p["name"], " · ".join(x for x in (p.get("parent"), p.get("status")) if x), p["slug"] == slug)
                 for p in PROJECTS if p["region"] == r["id"]]
        here = any(row[3] for row in rows)
        items = "\n".join(
            f'            <li><a href="{href}"{CURRENT if cur else ""}><span class="areas__name">{h(name)}</span><span class="areas__meta">{h(meta)}</span></a></li>'
            for href, name, meta, cur in rows)
        out.append(f'''      <div class="areas__item" data-area>
        <button class="areas__tab{" is-current" if here else ""}" type="button" aria-expanded="false" aria-controls="area-{r["id"]}" data-area-tab>{h(r["name"])}{CHEVRON}</button>
        <div class="areas__panel" id="area-{r["id"]}" hidden>
          <p class="areas__line">{h(r["line"])}</p>
          <ul>
{items}
          </ul>
        </div>
      </div>''')
    return "\n".join(out)


def masthead(slug=None):
    links = "\n".join(f'      <a href="{href}">{label}</a>' for href, label in NAV)
    mlinks = "\n".join(f'    <a href="{href}">{label}</a>' for href, label in MENU)
    return f'''  <a class="skip" href="#main">Skip to content</a>

  <header class="masthead" data-masthead>
    <a class="masthead__mark" href="/" aria-label="G Developments, home">
      <span class="masthead__name">G Developments</span>
      <span class="masthead__role">Private sales advisory</span>
    </a>
    <nav class="masthead__nav" aria-label="Sections">
{links}
    </nav>
    <a class="masthead__call" href="tel:{PHONE_TEL}" >Call a salesperson</a>
    <button class="masthead__menu" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu>Menu</button>
    <nav class="areas" aria-label="Projects by area">
{area_menus(slug)}
    </nav>
  </header>

  <nav class="mobile-nav" id="mobile-nav" hidden aria-label="Sections">
{mlinks}
    <a class="mobile-nav__call" href="tel:{PHONE_TEL}">{CONTACT}</a>
  </nav>'''


def hero(word, brand, title, lede, wa_text, video=None, image=None, illustrative=False, label="Hero", explore=None):
    """explore: (project name, section anchor) adds an "Explore <name>" button on the right that scrolls into the project."""
    if video:
        media = f'''<video class="hero__video" autoplay muted loop playsinline preload="auto" poster="{u(video["poster"])}" aria-hidden="true" data-hero-video>
          <source src="{u(video["loop"])}" type="video/mp4">
        </video>'''
        film_btn = f'''<button class="btn btn--light" type="button" data-film-open>{PLAY_SVG} Play the film</button>
            '''
    else:
        media = f'<div class="hero__video hero__img" aria-hidden="true">{img(image, "", "100vw", eager=True)}</div>'
        film_btn = ""
    explore_btn = (f'\n          <a class="btn btn--light hero__explore" href="{explore[1]}">Explore {h(explore[0])} {DOWN_SVG}</a>'
                   if explore else "")
    cue = "" if explore else '<p class="hero__cue" aria-hidden="true">Scroll</p>'
    tag = '<p class="hero__tag">Illustrative image</p>' if illustrative and not video else ""
    return f'''    <section class="hero" id="top" data-hero>
      <div class="hero__stage">
        {media}
        <div class="hero__shade" aria-hidden="true"></div>
        <div class="hero__mask" aria-hidden="true"><span>{h(word)}</span></div>
        {tag}
        <div class="hero__copy">
          <p class="brandline brandline--light">{brand}</p>
          <h1 class="hero__title">{h(title)}</h1>
          <p class="hero__lede">{h(lede)}</p>{explore_btn}
          <div class="hero__actions">
            <a class="btn btn--red" href="tel:{PHONE_TEL}" data-wa="{h(label)} hero call">{PHONE_SVG} {CONTACT}</a>
            {film_btn}<a class="btn btn--ghost-light" href="{wa(wa_text)}" target="_blank" rel="noopener" data-wa="{h(label)} hero">{WA_SVG} Message a salesperson</a>
          </div>
        </div>
        {cue}
      </div>
    </section>'''


INTERESTS = ["Krypton, NEWKAIRO", "Golf Views, NEWKAIRO", "Neon Views, NEWKAIRO", "Urban Living, NEWKAIRO", "NEWGIZA or Artlife",
             "Meditown, NEWGIZA", "IVY New Zayed", "Seashell Ras El Hekma", "Playa Ras El Hekma", "Playa Ghazala", "Seashell", "Ein Bay, Ain Sokhna",
             "Not sure yet, advise me"]
INTEREST_FOR = {"krypton": 0, "golf-views": 1, "neon-views": 2, "urban-living": 3, "newgiza": 4, "artlife": 4, "meditown": 5, "ivy": 6,
                "seashell-rah": 7, "playa-rah": 8, "playa": 9, "seashell": 10, "ein-bay": 11}


def contact(selected=None):
    opts = "\n".join(f'              <option{" selected" if i == selected else ""}>{h(o)}</option>' for i, o in enumerate(INTERESTS))
    view = wa("Hello, I'd like to arrange a private viewing.")
    return f'''    <section class="contact" id="contact">
      <div class="wrap contact__grid">
        <div class="contact__intro">
          <p class="brandline brandline--light">Private viewings<span>/</span>By appointment</p>
          <h2 class="sec-title">Speak with our sales team.</h2>
          <p>Tell us what you are looking for and a salesperson will come back with the units that fit, their current status, and a time to see them.</p>
          <a class="contact__number" href="{view}" target="_blank" rel="noopener" data-wa="Contact number">{CONTACT}</a>
          <div class="contact__actions">
            <a class="btn btn--light" href="{view}" target="_blank" rel="noopener" data-wa="Contact button">{WA_SVG} Message on WhatsApp</a>
            <a class="btn btn--ghost-light" href="tel:{PHONE_TEL}">Call a salesperson</a>
          </div>
          <ul class="contact__offices" data-offices></ul>
        </div>

        <form class="enquiry" data-enquiry novalidate>
          <h3>Send your brief</h3>
          <p class="enquiry__hint">Opens WhatsApp with your details filled in. Nothing is sent until you press send there.</p>
          <label class="field"><span>Your name</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>Interested in</span>
            <select name="interest">
{opts}
            </select>
          </label>
          <label class="field"><span>Budget</span>
            <select name="budget">
              <option>Up to 15M EGP</option>
              <option>15M – 30M EGP</option>
              <option>30M – 50M EGP</option>
              <option>50M – 80M EGP</option>
              <option>Above 80M EGP</option>
            </select>
          </label>
          <label class="field"><span>How you would pay</span>
            <select name="terms">
              <option>Installments</option>
              <option>Cash</option>
              <option>Open to both</option>
            </select>
          </label>
          <label class="field field--wide"><span>Anything else</span><textarea name="note" rows="3" placeholder="Views, floor, delivery timing, a unit code"></textarea></label>
          <p class="enquiry__error" data-enquiry-error hidden>Add your name so we know who is writing.</p>
          <button class="btn btn--dark" type="submit">Open WhatsApp with my brief</button>
        </form>
      </div>
    </section>'''


def tail(film=None):
    film_dlg = ""
    if film:
        film_dlg = f'''
  <dialog class="film" data-film aria-label="Film">
    <button class="film__close" type="button" data-film-close>Close</button>
    <video controls playsinline preload="none" poster="{u(film["poster"])}" data-film-video>
      <source src="{u(film["film"])}" type="video/mp4">
    </video>
  </dialog>
'''
    return f'''  <footer class="footer">
    <div class="wrap footer__grid">
      <p class="footer__mark">Mahmoud Elhemaly <span>Private real estate advisory</span></p>
      <p class="footer__legal" data-disclaimer>Independent advisory for G Developments projects in Egypt. This is not the official G Developments website. Prices, payment plans and availability come from developer releases and are confirmed at reservation.</p>
      <p class="footer__legal">NEWKAIRO, Krypton, Golf Views and Neon Views images and films are from the developer. Images for other destinations are illustrative. © 2026 · <button type="button" class="footer__link" data-privacy-open>Privacy and ad measurement</button></p>
    </div>
  </footer>

  <a class="wa-float" href="{wa("Hello, I'm interested in a G Developments property.")}" target="_blank" rel="noopener" data-wa="Floating button" aria-label="Message a salesperson on WhatsApp">
    <span class="wa-float__icon">{WA_SVG}</span>
    <span class="wa-float__num">{CONTACT}</span>
  </a>
{film_dlg}
  <dialog class="lightbox" data-lightbox-dialog aria-label="Image viewer">
    <button class="lightbox__close" type="button" data-lightbox-close>Close</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <figure><img alt="" data-lightbox-img><figcaption data-lightbox-cap></figcaption></figure>
    <button class="lightbox__nav lightbox__nav--next" type="button" data-lightbox-next aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
  </dialog>

  <script src="/js/site.js?v={JS_V}" defer></script>
</body>
</html>
'''


def siblings(p):
    if p.get("parent") == "NEWKAIRO":
        sibs = [x for x in PROJECTS if x.get("parent") == "NEWKAIRO" and x["id"] != p["id"]]
        head_ = ("NEWKAIRO<span>/</span>Parcels", "More of NEWKAIRO.", '<a class="link" href="/#newkairo">Back to NEWKAIRO</a>')
    else:
        sibs = [x for x in PROJECTS if x["region"] == p["region"] and x["id"] != p["id"]]
        r = REGIONS[p["region"]]
        head_ = (f'{h(r["name"])}<span>/</span>Nearby', f'More in {h(r["name"])}.', '<a class="link" href="/#portfolio">See every destination</a>')
        if not sibs:
            sibs = [x for x in PROJECTS if x.get("parent") == "NEWKAIRO"]
            head_ = ("NEWKAIRO<span>/</span>Parcels", "Also selling now: NEWKAIRO.", '<a class="link" href="/#newkairo">Visit NEWKAIRO</a>')
    cards = "\n".join(parcel_card(x) for x in sibs)
    return f'''    <section class="siblings">
      <div class="wrap">
        <div class="sec-head sec-head--split">
          <div><p class="brandline">{head_[0]}</p><h2 class="sec-title">{head_[1]}</h2></div>
          <p class="sec-lede">{head_[2]}</p>
        </div>
        <div class="parcels" data-parcels>
{cards}
        </div>
      </div>
    </section>'''


def parcel_card(x):
    t = x["theme"]
    pic = img(x["heroImage"], f'{x["name"]}, {x["place"]}', "(min-width: 900px) 45vw, 100vw") if x.get("heroImage") else ""
    return f'''          <a class="parcel" href="/{x["slug"]}/" style="--c:{t["dark"]};--a:{t["accent"]}" data-parcel="{x["id"]}">
            <span class="parcel__img">{pic}</span>
            <span class="parcel__body">
              <span class="parcel__parent">{h(x.get("parent") or REGIONS[x["region"]]["name"])}</span>
              <span class="parcel__name">{h(x["name"])}</span>
              <span class="parcel__line">{h(x["heroTitle"])}</span>
              <span class="parcel__from" data-from="{x["id"]}"></span>
              <span class="parcel__go">Enter {h(x["name"])}</span>
            </span>
          </a>'''


# ---------------------------------------------------------------- pages
def project_page(p):
    t = p["theme"]
    brand = f'{h(p["parent"])}<span>/</span>{h(p["name"])}' if p.get("parent") else f'{h(REGIONS[p["region"]]["name"])}<span>/</span>{h(p["name"])}'
    lede = p["intro"].split(". ")[0].rstrip(".") + "."
    has_gallery = bool(p.get("gallery"))
    has_pay = bool(p.get("payment"))
    books = p.get("brochures") or []
    first = PHASES.get(((p.get("payment") or {}).get("phases") or [None])[0])
    entry = first["plans"][0]["down"][0] if first and first["plans"][0].get("down") else None
    tabs = [("place", "The place"), ("homes", f"Residences &amp; {entry:g}% Entry" if entry and entry < 100 else "Residences")]
    if has_pay:
        tabs.append(("pay", "Payment"))
    if has_gallery:
        tabs.append(("gallery", "Gallery"))
    if books:
        tabs.append(("books", "Brochures"))
    rest = ' tabindex="-1"'
    tab_html = "\n".join(
        f'          <button role="tab" id="pt-{k}" aria-controls="pp-{k}" aria-selected="{"true" if i == 0 else "false"}"{"" if i == 0 else rest}>{label}</button>'
        for i, (k, label) in enumerate(tabs))
    facts = facts_html(p)
    highlights = "".join(f'<li>{h(x)}</li>' for x in p.get("highlights", []))
    place_img = img(p["heroImage"], f'{p["name"]}, {p["place"]}', "(min-width: 900px) 60vw, 100vw") if p.get("heroImage") else f'<div class="typo-panel"><span>{h(p["name"])}</span></div>'
    illus = '<figcaption class="place__tag">Illustrative image</figcaption>' if p.get("illustrative") else ""
    pay_panel = ""
    if has_pay:
        pay_panel = f'''
          <div class="panel" role="tabpanel" id="pp-pay" aria-labelledby="pt-pay" hidden>
            <div class="atelier__grid" data-pay-root data-dest="{p["payment"]["destination"]}" data-phases="{",".join(p["payment"]["phases"])}">
              <div class="atelier__controls">
                <fieldset class="chips" data-pay-phases><legend>Phase</legend></fieldset>
                <fieldset class="chips" data-pay-plans hidden><legend>Plan</legend></fieldset>
                <label class="range" hidden>
                  <span class="range__label">Unit price</span>
                  <span class="price-input"><input type="text" inputmode="numeric" autocomplete="off" aria-label="Unit price in EGP" data-pay-price><span>EGP</span></span>
                  <input type="range" aria-label="Unit price slider" data-pay-range>
                </label>
                <p class="atelier__note" data-pay-note></p>
              </div>
              <div class="atelier__result" data-pay-result aria-live="polite"></div>
            </div>
          </div>'''
    gal_panel = f'''
          <div class="panel" role="tabpanel" id="pp-gallery" aria-labelledby="pt-gallery" hidden>
            <div class="gallery" data-p-gallery></div>
          </div>''' if has_gallery else ""
    books_panel = f'''
          <div class="panel" role="tabpanel" id="pp-books" aria-labelledby="pt-books" hidden>
            <div class="library__grid" data-p-books="{",".join(books)}"></div>
          </div>''' if books else ""
    body = f'''{head(f'{full_name(p)} | G Developments', f'{full_name(p)}: {p["heroTitle"]} {p["intro"]}', (p.get("heroImage") or "assets/img/krypton/kr-dusk") + ".jpg", t, (p.get("video") or {}).get("poster"))}
<body data-page="project" data-project="{p["id"]}">
{masthead(p["slug"])}

  <main id="main">
{hero(p["wordmark"], brand, p["heroTitle"], lede, f"Hello, I'd like to hear about {full_name(p)}.", p.get("video"), p.get("heroImage"), p.get("illustrative"), p["name"], (p["name"], "#project"))}

    <section class="showcase" id="project">
      <div class="wrap">
        <div class="sec-head">
          <p class="brandline brandline--light">{brand}</p>
          <h2 class="sec-title">{h(p["heroTitle"])}</h2>
          <p class="sec-lede">{h(p["place"])}. {h(p["status"])}.</p>
        </div>

        <div class="tabs tabs--light" role="tablist" aria-label="{h(p["name"])}">
{tab_html}
        </div>

        <div class="panels">
          <div class="panel" role="tabpanel" id="pp-place" aria-labelledby="pt-place">
            <div class="place">
              <figure class="place__hero">{place_img}{illus}</figure>
              <div class="place__text">
                <h3>{h(p["name"])}</h3>
                <p>{h(p["intro"])}</p>
                <dl class="facts facts--dark">{facts}</dl>{amenities_html(p)}
                <ul class="place__list place__list--ticks">{highlights}</ul>
              </div>
            </div>
          </div>

          <div class="panel" role="tabpanel" id="pp-homes" aria-labelledby="pt-homes" hidden>
            <div class="p-homes" data-p-homes></div>
          </div>
{pay_panel}{gal_panel}{books_panel}
        </div>
      </div>
    </section>

{siblings(p)}

{contact(INTEREST_FOR.get(p["id"]))}
  </main>

{tail(p.get("video"))}'''
    return body


def krypton_page(p):
    t = p["theme"]
    src = (ROOT / "scripts/krypton_section.html").read_text().replace("<!-- AMENITIES -->", amenities_html(p).strip())
    return f'''{head("Krypton, NEWKAIRO | G Developments", "Krypton at NEWKAIRO: fully finished serviced residences above The Boulevard, from 7.88M EGP with 5% down and 8 years to pay. Floor plans, released units and payment plans.", "assets/img/krypton/kr-dusk.jpg", t, p["video"]["poster"])}
<body data-page="krypton" data-project="krypton">
{masthead("krypton")}

  <main id="main">
{hero("krypton", "NEWKAIRO<span>/</span>Krypton", p["heroTitle"], "Fully finished one to three bedroom serviced homes from 7.88M EGP, with 5% down and 8 years to pay. Call us for the exact amount to reserve.", "Hello, I'd like to hear about Krypton at NEWKAIRO.", p["video"], None, False, "Krypton", ("Krypton", "#krypton"))}

{src}

{siblings(p)}

{contact(0)}
  </main>

{tail(p["video"])}'''


def home_page():
    src = (ROOT / "scripts/home_sections.html").read_text()
    nk_video = {"loop": "assets/video/newkairo-loop-hd.mp4", "film": "assets/video/newkairo-film-hd.mp4", "poster": "assets/video/newkairo-poster-hd.jpg"}
    nk_cards = "\n".join(parcel_card(x) for x in PROJECTS if x.get("parent") == "NEWKAIRO")
    src = src.replace("{{PARCELS}}", nk_cards)
    return f'''{head("NEWKAIRO, Krypton and the full portfolio | G Developments", "Private advisory for G Developments in Egypt: NEWKAIRO with Krypton, Golf Views, Neon Views and Urban Living, plus NEWGIZA, IVY, Seashell and Playa. Official payment plans and brochures.", "assets/video/newkairo-poster-hd.jpg", NEWKAIRO_THEME, nk_video["poster"])}
<body data-page="home">
{masthead()}

  <main id="main">
{hero("NEWKAIRO", "G Developments<span>/</span>NEWKAIRO", "A new city for East Cairo, built around an 18-hole course.", "Krypton, Golf Views, Neon Views and Urban Living. Enter with 5% down and up to 8 years to pay — call for released holds and private cash terms.", "Hello, I'd like to hear about NEWKAIRO.", nk_video, None, False, "NEWKAIRO")}

{src}

{contact()}
  </main>

{tail(nk_video)}'''


def main():
    (ROOT / "index.html").write_text(home_page())
    written = ["index.html"]
    for p in PROJECTS:
        out = ROOT / p["slug"] / "index.html"
        out.parent.mkdir(exist_ok=True)
        out.write_text(krypton_page(p) if p["id"] == "krypton" else project_page(p))
        written.append(f'{p["slug"]}/index.html')
    print("Wrote", len(written), "pages:", ", ".join(written))


if __name__ == "__main__":
    main()
