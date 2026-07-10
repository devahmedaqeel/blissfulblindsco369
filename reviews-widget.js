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
    loadMoreBtn: document.getElementById('nrLoadMore'),
    writeBtn: document.getElementById('nrWriteReviewBtn'),
    overlay: document.getElementById('nrModalOverlay'),
    modalClose: document.getElementById('nrModalClose'),
    form: document.getElementById('nrReviewForm'),
    starPicker: document.getElementById('nrStarPicker'),
    ratingInput: document.getElementById('nrRatingInput'),
    name: document.getElementById('nrName'),
    email: document.getElementById('nrEmail'),
    review: document.getElementById('nrReview'),
    website: document.getElementById('nrWebsite'),
    formError: document.getElementById('nrFormError'),
    submitBtn: document.getElementById('nrSubmitBtn'),
    formSuccess: document.getElementById('nrFormSuccess'),
    turnstileWrap: document.getElementById('nrTurnstileWrap')
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
  // Write-a-review modal
  // ---------------------------------------------------------------------
  let selectedRating = 0;

  function openModal() {
    els.overlay.hidden = false;
    els.form.hidden = false;
    els.formSuccess.hidden = true;
    document.body.style.overflow = 'hidden';
    els.name.focus();
  }

  function closeModal() {
    els.overlay.hidden = true;
    document.body.style.overflow = '';
    els.form.reset();
    els.formError.hidden = true;
    setRating(0);
  }

  function setRating(n) {
    selectedRating = n;
    els.ratingInput.value = n ? String(n) : '';
    Array.from(els.starPicker.children).forEach((btn) => {
      btn.classList.toggle('is-filled', Number(btn.dataset.value) <= n);
      btn.setAttribute('aria-checked', Number(btn.dataset.value) === n ? 'true' : 'false');
    });
  }

  els.writeBtn.addEventListener('click', openModal);
  els.modalClose.addEventListener('click', closeModal);
  els.overlay.addEventListener('click', (e) => { if (e.target === els.overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.overlay.hidden) closeModal();
  });

  Array.from(els.starPicker.children).forEach((btn) => {
    btn.addEventListener('click', () => setRating(Number(btn.dataset.value)));
  });

  function getTurnstileToken() {
    if (window.turnstile && els.turnstileWrap.dataset.widgetId !== undefined) {
      try {
        return window.turnstile.getResponse(els.turnstileWrap.dataset.widgetId) || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  function renderTurnstileIfConfigured() {
    const siteKey = els.turnstileWrap.getAttribute('data-sitekey');
    if (!siteKey || siteKey.indexOf('YOUR_') === 0) {
      els.turnstileWrap.hidden = true; // no real key configured yet — dev mode
      return;
    }
    const check = setInterval(() => {
      if (window.turnstile) {
        clearInterval(check);
        const id = window.turnstile.render(els.turnstileWrap, { sitekey: siteKey });
        els.turnstileWrap.dataset.widgetId = id;
      }
    }, 200);
  }

  function clientValidate() {
    const name = els.name.value.trim();
    const email = els.email.value.trim();
    const review = els.review.value.trim();
    if (!selectedRating) return 'Please select a star rating.';
    if (name.length < 2 || name.length > 80) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (review.length < 10 || review.length > 1000) return 'Review must be between 10 and 1000 characters.';
    return null;
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.formError.hidden = true;

    const clientError = clientValidate();
    if (clientError) {
      els.formError.textContent = clientError;
      els.formError.hidden = false;
      return;
    }

    els.submitBtn.disabled = true;
    els.submitBtn.classList.add('nr-btn-loading');

    try {
      const res = await fetch(API_BASE + '/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: els.name.value.trim(),
          email: els.email.value.trim(),
          rating: selectedRating,
          review: els.review.value.trim(),
          website: els.website.value, // honeypot — real users leave this empty
          turnstileToken: getTurnstileToken()
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');

      els.form.hidden = true;
      els.formSuccess.hidden = false;
    } catch (err) {
      els.formError.textContent = err.message;
      els.formError.hidden = false;
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.classList.remove('nr-btn-loading');
    }
  });

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  loadFirstPage();
  renderTurnstileIfConfigured();
})();
