/*
 * Blissful Blinds Co 369 — Customer Review System (public widget).
 *
 * Self-contained: only touches its own `nr-*` classes/ids inside the new
 * #customer-reviews section. Talks to the standalone review-system API
 * (see /review-system). Renders only genuine, admin-approved reviews —
 * never fabricates review count, and injects Review schema.org markup
 * built exclusively from that real, approved data. No star ratings are
 * shown or referenced anywhere (by design).
 */
(function () {
  'use strict';

  const API_BASE = window.BB_REVIEWS_API_BASE || '/api';
  const PAGE_SIZE = 9;

  const els = {
    section: document.getElementById('customer-reviews'),
    count: document.getElementById('nrCount'),
    grid: document.getElementById('nrGrid'),
    empty: document.getElementById('nrEmpty'),
    loadMoreWrap: document.getElementById('nrLoadMoreWrap'),
    loadMoreBtn: document.getElementById('nrLoadMore')
  };

  if (!els.section) return;

  const state = { page: 1, totalPages: 1 };

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
      els.count.textContent = 'No reviews yet — be the first to leave one!';
      return;
    }
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
    identity.appendChild(nameRow);

    const dateEl = document.createElement('div');
    dateEl.className = 'nr-card-date';
    dateEl.textContent = formatDate(r.date);
    identity.appendChild(dateEl);

    head.appendChild(identity);
    card.appendChild(head);

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

    const res = await fetch(API_BASE + '/reviews?' + params.toString());
    if (!res.ok) throw new Error('Failed to load reviews.');
    const data = await res.json();

    state.page = data.page;
    state.totalPages = data.totalPages;
    renderCards(data.reviews, append);
    els.loadMoreBtn.hidden = data.page >= data.totalPages;

    renderSummary(data.stats);
    if (!append) allLoadedReviews.length = 0;
    allLoadedReviews.push(...data.reviews);
    injectReviewSchema(data.stats, allLoadedReviews);
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

  // ---------------------------------------------------------------------
  // Schema.org — built only from real approved reviews already rendered
  // on the page, never invented. Google explicitly disallows markup that
  // doesn't match visible page content, so this mirrors what's shown —
  // no aggregateRating/reviewRating fields, since star ratings aren't
  // displayed anywhere on the page.
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
      review: reviews.slice(0, 20).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        datePublished: String(r.date).slice(0, 10),
        reviewBody: r.review
      }))
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  loadFirstPage();
})();
