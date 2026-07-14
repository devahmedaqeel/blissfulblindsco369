// Server-side validation + sanitization for review submissions.
// This is defense in depth: the frontend also validates, and the frontend
// only ever renders user text via textContent (never innerHTML) — but a
// server must never trust the client, so everything is re-checked here.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters (incl. accented), spaces, hyphens, apostrophes, periods.
const NAME_RE = /^[\p{L}\p{M} .'-]+$/u;

function stripTags(str) {
  return String(str).replace(/<[^>]*>/g, '');
}

function collapseWhitespace(str) {
  return String(str).replace(/\s+/g, ' ').trim();
}

/**
 * Validates a review submission payload.
 * Returns { valid: true, data } or { valid: false, errors }.
 */
function validateReviewSubmission(body) {
  const errors = {};
  body = body || {};

  // Honeypot: a hidden field real users never fill in. If it has a value,
  // treat the whole submission as spam without revealing why to the caller.
  if (body.website) {
    return { valid: false, errors: { _spam: true } };
  }

  let name = collapseWhitespace(stripTags(body.name || ''));
  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2 || name.length > 80) errors.name = 'Name must be between 2 and 80 characters.';
  else if (!NAME_RE.test(name)) errors.name = 'Name contains characters that are not allowed.';

  const email = String(body.email || '').trim();
  if (!email) errors.email = 'Email is required.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const ratingNum = Number(body.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    errors.rating = 'Rating must be a whole number between 1 and 5.';
  }

  let review = collapseWhitespace(stripTags(body.review || ''));
  if (!review) errors.review = 'Review message is required.';
  else if (review.length < 10 || review.length > 1000) {
    errors.review = 'Review must be between 10 and 1000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { name, email, rating: ratingNum, review }
  };
}

/**
 * Validates an admin edit payload (subset of fields, all optional but
 * validated when present).
 */
function validateReviewEdit(body) {
  const errors = {};
  const data = {};
  body = body || {};

  if (body.name !== undefined) {
    const name = collapseWhitespace(stripTags(body.name));
    if (!name || name.length < 2 || name.length > 80 || !NAME_RE.test(name)) {
      errors.name = 'Invalid name.';
    } else {
      data.name = name;
    }
  }

  if (body.rating !== undefined) {
    const ratingNum = Number(body.rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.rating = 'Rating must be a whole number between 1 and 5.';
    } else {
      data.rating = ratingNum;
    }
  }

  if (body.review !== undefined) {
    const review = collapseWhitespace(stripTags(body.review));
    if (!review || review.length < 10 || review.length > 1000) {
      errors.review = 'Review must be between 10 and 1000 characters.';
    } else {
      data.review = review;
    }
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data };
}

module.exports = { validateReviewSubmission, validateReviewEdit, stripTags, collapseWhitespace, EMAIL_RE };
