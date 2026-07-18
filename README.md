# Blissful Blinds — Website

Official Blissful Blinds website — responsive, SEO/GEO-optimized,
high-performance business website for **Blissful Blinds Ltd** (Company No.
17329706), a made-to-measure blinds, shutters, and window-covering
supplier serving Peterborough, Leicester, and Luton & Bedford.

Static HTML/CSS/JS site. No build step, no framework — every page is served as-is.
The live production domain is `blissfulblindsltd.co.uk`.

Project folder: `Blissful Blinds Co 369`. Nothing in the code references
this folder's name or path — every link is relative, and all schema/canonical
URLs point at the production domain, not the local path — so the folder can
be renamed or moved freely without breaking anything.

## Structure

```
index.html                 Homepage
styles.css                 Single shared stylesheet used by every page
app.js                     Single shared script used by every page
vercel.json                Hosting config: security headers, static-asset
                            caching, and 301 redirects for removed pages
robots.txt / sitemap.xml   XML crawl files for search engines
llms.txt                   Plain-text summary for AI crawlers/answer engines
images/                    Live image assets referenced by the site

Product category pages (one folder each, e.g. roller-blinds/index.html):
  roller-blinds/  vertical-blinds/  venetian-blinds/  perfect-fit-blinds/
  vision-blinds/  pleated-blinds/  roman-blinds/  wooden-blinds/
  faux-wood-blinds/  window-shutters/  blackout-blinds/
  conservatory-blinds/  skylight-blinds/  motorised-blinds/
  child-blinds/  commercial-blinds/
window-blinds-range/       Hub/overview page linking to all of the above

Local SEO landing pages (one per real service region — see locations.md):
  blinds-peterborough/  blinds-leicester/  blinds-luton-bedford/

blog/                       Buying-guide/comparison/local-guide articles
  index.html                Blog listing page
  roller-vs-vertical-blinds/
  venetian-vs-vertical-blinds/
  wooden-vs-faux-wood-blinds/
  blinds-moving-in-checklist/
  made-to-measure-blinds-cost-guide/
  free-home-consultation-guide/

sitemap/index.html          Human-readable HTML sitemap (separate from sitemap.xml)
privacy-policy/ , terms-conditions/    Legal pages

knowledge-base/*.md         Source-of-truth facts (products, pricing,
                            locations, warranty, FAQ, etc.) the chatbot
                            retrieves from — also what any future content
                            work should be grounded in, to avoid inventing
                            facts about the business.

api/                        Vercel serverless functions: booking/enquiry
                            notifications, email (Nodemailer), web push,
                            Supabase writes, rate limiting, lead validation.
admin/                      Password-free-behind-auth enquiries dashboard
                            (dashboard.js/css + index.html) — reads leads
                            from Supabase in real time.
supabase/                   migration.sql + SETUP.md for the Postgres
                            schema backing bookings/enquiries.
review-system/              Standalone Node.js/Express backend (own
                            README.md) — NOT part of the static deploy,
                            runs as its own process. See its own README.

chatbot.js / chatbot-kb.js / chatbot.css
                            Client-side AI sales & support widget —
                            retrieval over knowledge-base/*.md, no backend
                            call needed for answering.

public/, scripts/, scratch/  Misc assets, one-off test/verification
                            scripts, and working files — not part of the
                            deployed static site.

dev-tools/                 NOT part of the live site — nothing here is
                            referenced by any page. Safe to ignore or delete.
  crop_images.js / crop_images_sharp.js   One-off image-processing scripts.
  formatted_index.html     An old formatted backup of index.html.
  test.txt                 Stray file, no purpose.
  unused-assets/           Leftover WordPress plugin files and orphaned
                            images from the original site scrape this
                            project was built from — confirmed unreferenced.
```

## How pages relate

- Every page shares the same `styles.css` and `app.js` — there's no
  per-page CSS/JS. Subpages load them via a relative `../styles.css` /
  `../app.js` (or `../../` for the one-level-deeper `blog/<slug>/` pages).
- The main nav, footer, and breadcrumbs link between all pages.
  `sitemap.xml` (machine-readable) and `sitemap/index.html` (human-readable)
  both list every live URL.
- Product/location/blog pages are otherwise independent copies of the same
  header/footer/booking-form template — there's no shared include/partial
  system since this isn't a templated build, so a change to nav or footer
  markup needs to be applied to every file individually.

## SEO & GEO (AI search) notes

- Every product, location, and blog page carries `Service`/`Article` +
  `BreadcrumbList` + `FAQPage` JSON-LD (the FAQ schema is always paired
  with a matching **visible** FAQ accordion on the page, per Google's
  rich-result requirement — schema-only FAQ content isn't used anywhere).
- The homepage carries `HomeAndConstructionBusiness` (with a nested
  `ContactPoint`, `PostalAddress`, real `Review`/`AggregateRating` — kept
  at the actual count of reviews shown, never inflated), `WebSite`, and an
  `ItemList` of the full product range. `window-blinds-range/index.html`
  mirrors that list as a `CollectionPage`.
- Curtains and a standalone "Blinds Accessories" line were removed
  site-wide (not services this business actually delivers) — both old
  URLs 301-redirect to `/` via `vercel.json`.
- `vercel.json` also sets long-lived immutable caching on `/images/*` and
  a shorter cache on CSS/JS, alongside the existing security headers
  (CSP/HSTS/etc.) on the catch-all route.
- Any new content (product facts, FAQ answers, location/pricing details)
  should be sourced from `knowledge-base/*.md` or copy already published
  elsewhere on the site — several knowledge-base files explicitly flag
  facts that must **not** be invented (e.g. no DIY measuring guide exists,
  no general cleaning instructions beyond a few product-specific claims,
  no confirmed "years in business"/certifications).

## Business info baked into the code

- Domain: `blissfulblindsltd.co.uk`
- Phone: `01733 853037` (landline) / WhatsApp & mobile: `+44 7341 645339`
- Email: `blissfulblindsco369@gmail.com` (contact mailbox kept as-is —
  intentionally not switched to a domain-matched address, see project memory)
- Address: 75 Ringwood Bretton, Peterborough, PE3 9SR
- Hours: Mon–Sat 09:00–18:00, Sun closed
- Service regions: Peterborough (PE), Leicester (LE), Luton & Bedford
  (LU/MK/SG) — full town-by-town lists live in `knowledge-base/locations.md`
  and the footer's "Areas We Cover" box on every page.

If any of the above changes, it needs updating in multiple places: the
visible page text, the footer on every page, the location landing pages,
and the `HomeAndConstructionBusiness` JSON-LD block in `index.html`'s `<head>`.

## Known trade-offs (not bugs)

- `styles.css` is one large (4,800+ line) file shared by every page.
  Normal for a hand-built static site without a build step, but means
  each page downloads CSS it doesn't fully use.
- No shared header/footer/nav partial system — see "How pages relate" above.
- Critical-CSS extraction and responsive `<picture>`/`srcset` images are
  known, deliberately deferred performance work (not yet started).
