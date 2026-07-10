# Blissful Blinds Co 369 — Website

Static HTML/CSS/JS site. No build step, no framework — every page is served as-is.

Project folder: `Blissful Blinds Co 369`. Nothing in the code references
this folder's name or path — every link is relative, and all schema/canonical
URLs point at the production domain (`blissfulblindsco369.com`), not the
local path — so the folder can be renamed or moved freely without breaking
anything.

## Structure

```
index.html                 Homepage
styles.css                 Single shared stylesheet used by every page
app.js                     Single shared script used by every page
robots.txt / sitemap.xml   SEO crawl files
images/                    Live image assets referenced by the site
  gallery/                 "Our Recent Installations" photos

perfect-fit-blinds/index.html    \
pleated-blinds/index.html         \
roller-blinds/index.html           |  One folder per blind type.
venetian-blinds/index.html         |  Each is a standalone page:
vertical-blinds/index.html         |  <name>/index.html, so the live
vision-blinds/index.html           |  URL is /<name>/ with no .html
window-blinds-range/index.html    /   extension.
window-shutters/index.html       /

dev-tools/                 NOT part of the live site — nothing here is
                            referenced by any page. Safe to ignore or delete.
  crop_images.js
  crop_images_sharp.js     One-off image-processing scripts used during
                            site setup, kept for reference.
  formatted_index.html     An old formatted backup of index.html.
  test.txt                 Stray file, no purpose.
  unused-assets/           Leftover WordPress plugin files (css/, js/,
                            fonts/) and orphaned images from the original
                            site scrape this project was built from —
                            confirmed unreferenced by any page.
```

## How pages relate

- Every page shares the same `styles.css` and `app.js` — there's no
  per-page CSS/JS. Subpages load them via `../styles.css` / `../app.js`
  since they're one folder deep.
- The homepage nav, footer, and breadcrumbs link between all 9 pages.
  `sitemap.xml` lists all 9 URLs for search engines.
- The 8 blind-type pages are otherwise independent copies of the same
  header/footer template — a change to nav or footer markup needs to be
  applied to all 9 files individually (there's no shared include/partial
  system since this isn't a templated build).

## Business info baked into the code

- Domain: `blissfulblindsco369.com`
- Phone: `07341 645339` / Email: `blissfulblindsco369@gmail.com`
- Address: 75 Ringwood Bretton, Peterborough, PE3 9SR
- Hours: Mon–Sat 09:00–18:00, Sun closed
- Primary service areas: Peterborough, Leicester, Luton (+ Milton Keynes,
  Northampton, Bedford, Cambridge)

If any of the above changes, it needs updating in multiple places: the
visible page text, the footer on every page, and the `LocalBusiness`
JSON-LD block in `index.html`'s `<head>`.

## Known trade-offs (not bugs)

- Most product/offer images are hotlinked from `blindsworldltd.com`
  rather than hosted locally — a leftover from how this site was
  originally built. Works, but is a dependency on someone else's server.
- `styles.css` is one 3000+ line file shared by all 9 pages. Normal for
  a hand-built static site without a build step, but means each page
  downloads CSS it doesn't fully use.
