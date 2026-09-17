# K&A — thekahome.com

Static company site for **Kahome Inc** (brand: **K&A**), an AI services company in Irvine, California.
Bilingual (EN / 中文). No build step. Deployed via GitHub Pages (`CNAME` → thekahome.com):
push to `main` and it redeploys automatically.

## Pages

- `index.html` — homepage: hero + company summary, three service lines, who we serve,
  how it works, why K&A, careers, contact
- `careers.html` — open roles (apply links go to LinkedIn)
- `privacy.html`, `terms.html` — legal pages (English only)
- `404.html` — not-found page (uses root-absolute asset paths because it is served at any depth)
- `sitemap.xml`, `robots.txt`
- `_config.yml` — GitHub Pages settings (keeps this README out of the published site)

## Shared files

- `styles.css` — the whole design system; reusable sub-page classes are documented at the top
- `script.js` — language switch, mobile menu, anchors, scroll-spy, scroll reveal
- `assets/brand/*` — logo (colour + white wordmark), star mark, favicons
- `assets/og.jpg` — 1200×630 social share card

Every page copies three regions from `index.html` verbatim, marked with HTML comments:
`HEAD-COMMON`, `HEADER`, `FOOTER`. Change them in `index.html` first, then mirror the change
in the other pages. Two documented differences: `404.html` uses root-absolute paths
(`/assets/…`, `/styles.css`, `/script.js`), and the `/#careers` nav link in `careers.html`
carries `class="is-current"`.

## Language

Visible strings carry `data-en` / `data-zh` (plus `data-html-*`, `data-alt-*`, `data-arialabel-*`, etc.).
The visible default text of an element is its `data-en` value.
The choice is stored in `localStorage["ka-lang"]`; `?lang=zh` opens the Chinese version directly.

## Company details used across the site (keep them consistent everywhere, incl. JSON-LD)

Kahome Inc · 400 Spectrum Center Dr, Ste 1900, Irvine, CA 92618 · (949) 300-3161 · damon@thekahome.com

## Adding a job

Copy the `<li>` job card in `careers.html` (and the summary card in the homepage `#careers`
section), update the text in both languages, and point the apply button at the new posting.
