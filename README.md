# K&A — thekahome.com

Static company site for **Kahome Inc** (brand: **K&A**), an AI services company in Irvine, California.
Bilingual (EN / 中文). No build step. Deployed via GitHub Pages (`CNAME` → thekahome.com):
push to `main` and it redeploys automatically.

## Pages

- `index.html` — homepage: hero + company summary, three service lines, who we serve,
  how it works, why K&A, careers, contact
- `careers.html` — careers page: working here, how hiring works, and the open-roles band
  (currently in its "no open roles" state)
- `privacy.html`, `terms.html` — legal pages (English only)
- `404.html` — not-found page (uses root-absolute asset paths because it is served at any depth)
- `sitemap.xml`, `robots.txt`
- `_config.yml` — GitHub Pages settings (keeps this README out of the published site)

## Shared files

- `styles.css` — the whole design system ("Soft Light Bento": pastel mesh hero, floating pill nav,
  rounded bento cards; Plus Jakarta Sans from Google Fonts). All styling lives here: pages carry
  no `<style>` blocks and no `style=""` attributes. The reusable sub-page kit is documented at the top
- `script.js` — language switch, mobile menu, anchors, scroll-spy, scroll reveal, pointer spotlights
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

## Site facts the Privacy Policy relies on (keep them true)

No cookies, no analytics, no pixels, no embeds, no forms. The only browser storage is
`localStorage["ka-lang"]`, and the only third-party request is Google Fonts.
If any of that changes, update `privacy.html` in the same commit.

## Open roles

There are no open roles at the moment, so both careers surfaces show the "no open roles" band
(`<div class="card jobs jobs--none">`): the `#careers` section of `index.html` and the
`#open-roles` section of `careers.html`.

To list a role again:

1. Paste the role-card block below after `.none-grid` inside that band, in both pages, and fill in
   every placeholder in both `data-en` and `data-zh`. The visible text of each element must equal
   its `data-en`.
2. Point the "Apply" button at the job posting (replace `href="#"`). One `<li>` per role; give each
   role title its own id (`job-1-title`, `job-2-title`, …).
3. Rewrite the band copy above the cards (the `h2` and `.none-lead`) and the first chip in the
   careers page hero ("No open roles"). On the homepage the `.none-lead` text sits in
   `data-html-en` / `data-html-zh`, because the Chinese line keeps a phrase together with
   `<span class="nb">`.
4. Update the meta, og and twitter descriptions in the `<head>` of `careers.html`.
5. When the role is filled, delete the pasted block and restore the band copy.

The `.roles`, `.role` and `.badge` styles are kept in `styles.css` for this.

```html
<p class="caps roles-lab" data-en="Open roles" data-zh="在招职位">Open roles</p>
<ul class="roles">
  <li>
    <svg class="stk role-stk" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-star"/></svg>
    <article class="card spot role" aria-labelledby="job-1-title" data-rv>
      <div class="role-main">
        <p class="badge"><i aria-hidden="true"></i><span data-en="Open role" data-zh="在招职位">Open role</span></p>
        <h3 class="h3" id="job-1-title" data-en="Role title" data-zh="Role title">Role title</h3>
        <ul class="role-meta">
          <li data-en="Location" data-zh="Location">Location</li>
          <li data-en="Employment type" data-zh="Employment type">Employment type</li>
        </ul>
        <p data-en="Role summary" data-zh="Role summary">Role summary</p>
      </div>
      <div class="role-side">
        <div>
          <h4 data-en="Requirements" data-zh="任职要求">Requirements</h4>
          <ul>
            <li data-en="Requirement" data-zh="Requirement">Requirement</li>
          </ul>
        </div>
        <div>
          <h4 data-en="Benefits" data-zh="福利待遇">Benefits</h4>
          <ul>
            <li data-en="Benefit" data-zh="Benefit">Benefit</li>
          </ul>
        </div>
      </div>
      <div class="role-cta">
        <a class="btn btn-dark" href="#" target="_blank" rel="noopener"><span data-en="Apply" data-zh="申请">Apply</span><svg class="i" aria-hidden="true" focusable="false"><use href="#i-out"/></svg><span class="vh" data-en="(opens in a new tab)" data-zh="（在新标签页打开）">(opens in a new tab)</span></a>
      </div>
    </article>
  </li>
</ul>
```
