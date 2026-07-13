---
title: Service Locations & Coverage Areas
source: index.html #areas-covered section, footer, app.js region/postcode data, LocalBusiness structured data
---

## Peterborough Area
Peterborough City Centre, Stamford, Spalding, Wisbech, March, Whittlesey, Market
Deeping, Oundle, Yaxley, Crowland.
Postcode prefix: PE

## Leicester Area
Leicester City Centre, Loughborough, Hinckley, Wigston, Coalville, Melton Mowbray,
Market Harborough, Oadby, Lutterworth, Ashby-de-la-Zouch.
Postcode prefix: LE

## Luton & Bedfordshire Area
Luton Town Centre, Dunstable, Bedford, Leighton Buzzard, Houghton Regis, Ampthill,
Flitwick, Sandy, Biggleswade, Kempston.
Postcode prefixes: LU, MK, SG

## Postcode checker logic (as implemented on the site)
The site's own postcode checker matches only the first 1–2 letters of a postcode to a
region:
- PE → Peterborough area
- LE → Leicester area
- LU, MK, SG → Luton & Bedfordshire area (MK covers Bedford/Ampthill, SG covers
  Sandy/Biggleswade — not Milton Keynes or Stevenage themselves)

If a customer's postcode prefix isn't one of these, the site's own checker tells them
they're outside the current service area and to call to confirm — the chatbot should
do the same rather than guess.

## Head office
75 Ringwood Bretton, Peterborough, PE3 9SR.
