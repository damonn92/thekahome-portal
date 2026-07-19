# K&A Home Company Portal

Static company site for `thekahome.com` — K&A Home Inc, Irvine, California.

Bilingual (EN / 中文) single-page portal covering the three layers of the business:
owned brands (Calivell, KZG, ODORUN), growth services (GoWest, OnShelfs), and
AI products (AISight, PostPilot).

## Files

- `index.html` — markup, meta/OG tags, JSON-LD
- `styles.css` — all styling (Fraunces + Archivo, warm editorial system)
- `script.js` — language toggle (localStorage), mobile nav, scroll reveal
- `assets/screenshots/*` — brand site screenshots; `ka-home.jpg` is the OG share image (1200×630)

No build step. Deployed via GitHub Pages (`CNAME` → thekahome.com).
Push to `main` and GitHub Pages redeploys automatically.
