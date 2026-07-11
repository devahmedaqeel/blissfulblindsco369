/*
 * Blissful Blinds Co 369 — Customer Review System (public widget).
 *
 * Self-contained: only touches its own `nr-*` classes/ids inside the new
 * #customer-reviews section. Talks to the standalone review-system API
 * (see /review-system). Renders only genuine, admin-approved reviews —
 * never fabricates review count/rating, and injects Review/AggregateRating
 * schema.org markup built exclusively from that real, approved data.
 */
(function () {
  'use strict';

  const API_BASE = window.BB_REVIEWS_API_BASE || '/api';
  const PAGE_SIZE = 9;

  const els = {
    section: document.getElementById('customer-reviews'),
    score: document.getElementById('nrScore'),
    stars: document.getElementById('nrStars'),
    count: document.getElementById('nrCount'),
    chips: document.getElementById('nrFilterChips'),
    grid: document.getElementById('nrGrid'),
    empty: document.getElementById('nrEmpty'),
    loadMoreWrap: document.getElementById('nrLoadMoreWrap'),
    loadMoreBtn: document.getElementById('nrLoadMore')
  };

  if (!els.section) return;

  const state = { rating: null, page: 1, totalPages: 1 };

  function starString(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function initials(name) {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  function formatDate(iso) {
    try {
      return new Date(String(iso).replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return iso;
    }
  }

  // ---------------------------------------------------------------------
  // Rendering — every piece of user-supplied text uses textContent, never
  // innerHTML, so nothing a customer types can ever execute as markup
  // here even if it somehow slipped past server-side sanitization.
  // ---------------------------------------------------------------------
  function renderSummary(stats) {
    if (!stats.total) {
      els.score.textContent = '—';
      els.stars.textContent = '';
      els.count.textContent = 'No reviews yet — be the first to leave one!';
      return;
    }
    els.score.textContent = stats.average.toFixed(1) + '/5';
    els.stars.textContent = starString(Math.round(stats.average));
    els.count.textContent = 'Based on ' + stats.total + (stats.total === 1 ? ' Customer Review' : ' Customer Reviews');
  }

  function buildCard(r) {
    const card = document.createElement('article');
    card.className = 'nr-card' + (r.featured ? ' is-featured' : '');

    if (r.featured) {
      const ribbon = document.createElement('span');
      ribbon.className = 'nr-featured-ribbon';
      ribbon.textContent = 'Featured';
      card.appendChild(ribbon);
    }

    const head = document.createElement('div');
    head.className = 'nr-card-head';

    const avatar = document.createElement('div');
    avatar.className = 'nr-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = initials(r.name);
    head.appendChild(avatar);

    const identity = document.createElement('div');
    identity.className = 'nr-card-identity';

    const nameRow = document.createElement('div');
    nameRow.className = 'nr-card-name';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = r.name;
    nameRow.appendChild(nameSpan);
    const verified = document.createElement('span');
    verified.className = 'nr-verified-badge';
    verified.title = 'This review was checked and approved by our team';
    verified.textContent = '✓ Verified';
    nameRow.appendChild(verified);
    identity.appendChild(nameRow);

    const dateEl = document.createElement('div');
    dateEl.className = 'nr-card-date';
    dateEl.textContent = formatDate(r.date);
    identity.appendChild(dateEl);

    head.appendChild(identity);
    card.appendChild(head);

    const starsEl = document.createElement('div');
    starsEl.className = 'nr-card-stars';
    starsEl.setAttribute('aria-label', r.rating + ' out of 5 stars');
    starsEl.textContent = starString(r.rating);
    card.appendChild(starsEl);

    const textEl = document.createElement('p');
    textEl.className = 'nr-card-text';
    textEl.textContent = r.review;
    card.appendChild(textEl);

    return card;
  }

  function renderCards(reviews, append) {
    if (!append) els.grid.innerHTML = '';
    reviews.forEach((r) => els.grid.appendChild(buildCard(r)));
    els.empty.hidden = els.grid.children.length > 0;
  }

  // ---------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------
  const allLoadedReviews = [];

  async function fetchPage(page, append) {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (state.rating) params.set('rating', String(state.rating));

    const res = await fetch(API_BASE + '/reviews?' + params.toString());
    if (!res.ok) throw new Error('Failed to load reviews.');
    const data = await res.json();

    state.page = data.page;
    state.totalPages = data.totalPages;
    renderCards(data.reviews, append);
    els.loadMoreBtn.hidden = data.page >= data.totalPages;

    if (!state.rating) {
      renderSummary(data.stats);
      if (!append) allLoadedReviews.length = 0;
      allLoadedReviews.push(...data.reviews);
      injectReviewSchema(data.stats, allLoadedReviews);
    }
  }

  function loadFirstPage() {
    els.grid.setAttribute('aria-busy', 'true');
    fetchPage(1, false)
      .catch(() => { els.count.textContent = 'Reviews are temporarily unavailable.'; })
      .finally(() => els.grid.removeAttribute('aria-busy'));
  }

  els.loadMoreBtn.addEventListener('click', () => {
    fetchPage(state.page + 1, true).catch(() => {});
  });

  els.chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.nr-chip');
    if (!btn) return;
    Array.from(els.chips.children).forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.rating = btn.dataset.rating ? Number(btn.dataset.rating) : null;
    state.page = 1;
    fetchPage(1, false).catch(() => {});
  });

  // ---------------------------------------------------------------------
  // Schema.org — built only from real approved reviews already rendered
  // on the page, never invented. Google explicitly disallows markup that
  // doesn't match visible page content, so this mirrors what's shown.
  // ---------------------------------------------------------------------
  function injectReviewSchema(stats, reviews) {
    if (!stats.total) return;
    let script = document.getElementById('nr-review-schema');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'nr-review-schema';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://blissfulblindsco369.com/#business',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: stats.average,
        reviewCount: stats.total,
        bestRating: 5,
        worstRating: 1
      },
      review: reviews.slice(0, 20).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        datePublished: String(r.date).slice(0, 10),
        reviewBody: r.review,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1
        }
      }))
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  loadFirstPage();
})();
