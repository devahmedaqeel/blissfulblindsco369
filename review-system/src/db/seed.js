/*
 * Seeds the database with the 4 real customer testimonials already
 * published on the homepage's existing testimonials carousel (Charlotte C.,
 * Claire Germain, Irene McLaughlin, Sue Sharp — all genuine site content,
 * not invented). Safe to run multiple times — skips if reviews already
 * exist so it never duplicates data.
 *
 * These are legacy imports with no email on file and no exact original
 * submission date, so both are marked clearly below rather than faked.
 */
const { db, insertReview, updateStatus } = require('./db');

const SEED_REVIEWS = [
  {
    name: 'Charlotte C.',
    email: 'legacy-import+charlotte@blissfulblindsco369.com',
    rating: 5,
    review: 'Extremely pleased with our new vertical blinds. The advisor brought lots of fabric samples, measured carefully, and they were fitted in less than two weeks. Exceptional quality and very tidy fitting service.',
    submittedAt: '2026-04-18 10:00:00'
  },
  {
    name: 'Claire Germain',
    email: 'legacy-import+claire@blissfulblindsco369.com',
    rating: 5,
    review: 'Fantastic prices and excellent customer care. We had quotes from other companies but Blissful Blinds Ltd beat them easily. The wooden venetians look amazing. Will definitely use them again!',
    submittedAt: '2026-05-06 14:30:00'
  },
  {
    name: 'Irene McLaughlin',
    email: 'legacy-import+irene@blissfulblindsco369.com',
    rating: 5,
    review: 'Had our perfect fit blinds installed in the conservatory yesterday. They clip directly to the glass frame and work brilliantly. Professional and child-safe. Highly recommended.',
    submittedAt: '2026-05-24 09:15:00'
  },
  {
    name: 'Sue Sharp',
    email: 'legacy-import+sue@blissfulblindsco369.com',
    rating: 5,
    review: 'Great service from start to finish. The booking was quick, measurement was prompt, and the installer took down my old blinds and fitted the new roller blinds beautifully. Very neat job.',
    submittedAt: '2026-06-12 16:45:00'
  }
];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;
  if (Number(existing) > 0) {
    console.log(`Reviews table already has ${existing} row(s) — skipping seed.`);
    return;
  }

  for (const r of SEED_REVIEWS) {
    const id = insertReview({
      name: r.name,
      email: r.email,
      rating: r.rating,
      review: r.review,
      avatarUrl: null,
      ipHash: 'seed'
    });
    updateStatus(id, 'approved');
    db.prepare('UPDATE reviews SET submitted_at = ?, updated_at = ? WHERE id = ?').run(
      r.submittedAt,
      r.submittedAt,
      id
    );
  }

  console.log(`Seeded ${SEED_REVIEWS.length} real testimonials as approved reviews.`);
}

seed();
