const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');
const { validateReviewEdit } = require('../utils/validate');

const router = express.Router();

router.use(requireAdmin);

// GET /api/admin/reviews?status=&rating=&search=&sort=&page=&limit=
router.get('/', (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
  const rating = req.query.rating ? Number(req.query.rating) : null;
  const search = String(req.query.search || '').slice(0, 100);
  const sort = ['newest', 'oldest', 'rating_high', 'rating_low'].includes(req.query.sort)
    ? req.query.sort
    : 'newest';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }

  const { rows, total } = db.getAllReviews({ status, rating, search, sort, limit, offset });

  res.json({
    reviews: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      rating: r.rating,
      review: r.review,
      date: r.submitted_at,
      updatedAt: r.updated_at,
      status: r.status,
      featured: !!r.featured
    })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  });
});

// GET /api/admin/reviews/summary — counts for the dashboard header
router.get('/summary', (req, res) => {
  const { total: pending } = db.getAllReviews({ status: 'pending', limit: 1, offset: 0 });
  const { total: approved } = db.getAllReviews({ status: 'approved', limit: 1, offset: 0 });
  const { total: rejected } = db.getAllReviews({ status: 'rejected', limit: 1, offset: 0 });
  const stats = db.getStats();
  res.json({ pending, approved, rejected, averageRating: stats.average, totalApproved: stats.total });
});

router.patch('/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of approved, rejected, pending.' });
  }
  if (!db.getReviewById(id)) return res.status(404).json({ error: 'Review not found.' });
  db.updateStatus(id, status);
  res.json({ ok: true });
});

router.patch('/:id/featured', (req, res) => {
  const id = Number(req.params.id);
  const { featured } = req.body || {};
  if (typeof featured !== 'boolean') {
    return res.status(400).json({ error: 'featured must be a boolean.' });
  }
  const review = db.getReviewById(id);
  if (!review) return res.status(404).json({ error: 'Review not found.' });
  if (featured && review.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved reviews can be featured.' });
  }
  db.updateFeatured(id, featured);
  res.json({ ok: true });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.getReviewById(id)) return res.status(404).json({ error: 'Review not found.' });

  const result = validateReviewEdit(req.body);
  if (!result.valid) {
    return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
  }
  if (Object.keys(result.data).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  const current = db.getReviewById(id);
  db.updateReviewContent(id, {
    name: result.data.name ?? current.name,
    rating: result.data.rating ?? current.rating,
    review: result.data.review ?? current.review
  });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.getReviewById(id)) return res.status(404).json({ error: 'Review not found.' });
  db.deleteReview(id);
  res.json({ ok: true });
});

module.exports = router;
