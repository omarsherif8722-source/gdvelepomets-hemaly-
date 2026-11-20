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
import json
from html import escape as h
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = json.loads((ROOT / "data/portfolio.json").read_text())
PROJECTS = P["projects"]
BY_ID = {p["id"]: p for p in PROJECTS}
REGIONS = {r["id"]: r for r in P["regions"]}

PHONE_TEL = "+201227275122"
PHONE = "+20 122 727 5122"
WA = "https://wa.me/201227275122?text="

NEWKAIRO_THEME = {"dark": "#221f20", "dark2": "#36302f", "dark3": "#141213", "accent": "#ce3927"}

WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>'
PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>'


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
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23421115'/%3E%3Ctext x='32' y='46' font-family='Georgia,serif' font-size='40' fill='%23fff' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">{pre}
  <link rel="stylesheet" href="/css/site.css">
</head>'''


NAV = [
    ("/#newkairo", "NEWKAIRO"),
    ("/krypton/", "Krypton"),
    ("/#portfolio", "Portfolio"),
    ("/#payments", "Payment plans"),
    ("/#brochures", "Brochures"),
    ("#contact", "Contact"),
]


def masthead(current=None):
    cur = ' aria-current="page" class="is-current"'
    links = "\n".join(f'      <a href="{href}"{cur if label == current else ""}>{label}</a>' for href, label in NAV)
    mlinks = "\n".join(f'    <a href="{href}">{label}</a>' for href, label in NAV[:-1] + [("/#developer", "G Developments"), NAV[-1]])
    return f'''  <a class="skip" href="#main">Skip to content</a>

  <header class="masthead" data-masthead>
    <a class="masthead__mark" href="/" aria-label="Mahmoud Elhemaly, home">
      <span class="masthead__name">Mahmoud Elhemaly</span>
      <span class="masthead__role">Private advisory, G Developments</span>
    </a>
    <nav class="masthead__nav" aria-label="Sections">
{links}
    </nav>
    <a class="masthead__call" href="tel:{PHONE_TEL}" aria-label="Call a salesperson on {PHONE}">Call a salesperson</a>
    <button class="masthead__menu" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu>Menu</button>
  </header>

  <nav class="mobile-nav" id="mobile-nav" hidden aria-label="Sections">
{mlinks}
    <a class="mobile-nav__call" href="tel:{PHONE_TEL}">Call a salesperson, {PHONE}</a>
  </nav>'''


def hero(word, brand, title, lede, wa_text, video=None, image=None, illustrative=False, label="Hero"):
    if video:
        media = f'''<video class="hero__video" autoplay muted loop playsinline preload="auto" poster="{u(video["poster"])}" aria-hidden="true" data-hero-video>
          <source src="{u(video["loop"])}" type="video/mp4">
        </video>'''
        film_btn = f'''<button class="btn btn--light" type="button" data-film-open>{PLAY_SVG} Play the film</button>
            '''
    else:
        media = f'<div class="hero__video hero__img" aria-hidden="true">{img(image, "", "100vw", eager=True)}</div>'
        film_btn = ""
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
          <p class="hero__lede">{h(lede)}</p>
          <div class="hero__actions">
            {film_btn}<a class="btn btn--ghost-light" href="{wa(wa_text)}" target="_blank" rel="noopener" data-wa="{h(label)} hero">{WA_SVG} Message a salesperson</a>
          </div>
        </div>
        <p class="hero__cue" aria-hidden="true">Scroll</p>
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
          <a class="contact__number" href="{view}" target="_blank" rel="noopener" data-wa="Contact number">{PHONE}</a>
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
      <p class="footer__legal">NEWKAIRO, Krypton, Golf Views and Neon Views images and films are from the developer. Images for other destinations are illustrative. © 2026</p>
    </div>
  </footer>

  <a class="wa-float" href="{wa("Hello, I'm interested in a G Developments property.")}" target="_blank" rel="noopener" data-wa="Floating button" aria-label="Message a salesperson on WhatsApp at {PHONE}">
    <span class="wa-float__icon">{WA_SVG}</span>
    <span class="wa-float__num">{PHONE}</span>
  </a>
{film_dlg}
  <dialog class="lightbox" data-lightbox-dialog aria-label="Image viewer">
    <button class="lightbox__close" type="button" data-lightbox-close>Close</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <figure><img alt="" data-lightbox-img><figcaption data-lightbox-cap></figcaption></figure>
    <button class="lightbox__nav lightbox__nav--next" type="button" data-lightbox-next aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
  </dialog>

  <script src="/js/site.js" defer></script>
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
    tabs = [("place", "The place"), ("homes", "Homes")]
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
    facts = "".join(f'<div><dt>{h(k)}</dt><dd>{h(v)}</dd></div>' for k, v in p["facts"])
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
                <label class="range">
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
{masthead()}

  <main id="main">
{hero(p["wordmark"], brand, p["heroTitle"], lede, f"Hello, I'd like to hear about {full_name(p)}.", p.get("video"), p.get("heroImage"), p.get("illustrative"), p["name"])}

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
                <dl class="facts facts--dark">{facts}</dl>
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
    src = (ROOT / "scripts/krypton_section.html").read_text()
    return f'''{head("Krypton, NEWKAIRO | G Developments", "Krypton at NEWKAIRO: fully finished serviced residences above The Boulevard, from 7.88M EGP with 5% down and 8 years to pay. Floor plans, released units and payment plans.", "assets/img/krypton/kr-dusk.jpg", t, p["video"]["poster"])}
<body data-page="krypton" data-project="krypton">
{masthead("Krypton")}

  <main id="main">
{hero("krypton", "NEWKAIRO<span>/</span>Krypton", p["heroTitle"], "Fully finished one to three bedroom homes from 7.88M EGP. Five percent down, eight years to pay.", "Hello, I'd like to hear about Krypton at NEWKAIRO.", p["video"], None, False, "Krypton")}

{src}

{siblings(p)}

{contact(0)}
  </main>

{tail(p["video"])}'''


def home_page():
    src = (ROOT / "scripts/home_sections.html").read_text()
    nk_video = {"loop": "assets/video/newkairo-loop.mp4", "film": "assets/video/newkairo-film.mp4", "poster": "assets/video/newkairo-poster.jpg"}
    nk_cards = "\n".join(parcel_card(x) for x in PROJECTS if x.get("parent") == "NEWKAIRO")
    src = src.replace("{{PARCELS}}", nk_cards)
    return f'''{head("NEWKAIRO, Krypton and the full portfolio | G Developments", "Private advisory for G Developments in Egypt: NEWKAIRO with Krypton, Golf Views, Neon Views and Urban Living, plus NEWGIZA, IVY, Seashell and Playa. Official payment plans and brochures.", "assets/video/newkairo-poster.jpg", NEWKAIRO_THEME, nk_video["poster"])}
<body data-page="home">
{masthead("NEWKAIRO")}

  <main id="main">
{hero("NEWKAIRO", "G Developments<span>/</span>NEWKAIRO", "A new city for East Cairo, built around an 18-hole course.", "Krypton, Golf Views, Neon Views and Urban Living. From 7.88M EGP, with 5% down and up to 8 years to pay.", "Hello, I'd like to hear about NEWKAIRO.", nk_video, None, False, "NEWKAIRO")}

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
