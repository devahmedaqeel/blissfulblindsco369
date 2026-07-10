const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// Overridable so a host with a persistent-disk mount (e.g. Render) can
// point this at that disk's absolute path — otherwise the database would
// live on the container's ephemeral filesystem and be wiped on every
// redeploy/restart. Defaults to the same local ./data folder as before.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'reviews.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// ---------------------------------------------------------------------
// Every query below uses a prepared statement with bound parameters —
// no user input is ever concatenated into SQL text, which is what
// structurally prevents SQL injection (not just "escaping").
// ---------------------------------------------------------------------

const stmts = {
  insertReview: db.prepare(`
    INSERT INTO reviews (name, email, rating, review, avatar_url, ip_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `),
  getReviewById: db.prepare('SELECT * FROM reviews WHERE id = ?'),
  deleteReview: db.prepare('DELETE FROM reviews WHERE id = ?'),
  updateStatus: db.prepare(
    "UPDATE reviews SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ),
  updateFeatured: db.prepare(
    "UPDATE reviews SET featured = ?, updated_at = datetime('now') WHERE id = ?"
  ),
  updateReviewContent: db.prepare(`
    UPDATE reviews
    SET name = ?, rating = ?, review = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  getAdminByUsername: db.prepare('SELECT * FROM admin_users WHERE username = ?'),
  insertAdmin: db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)'),
  countAdmins: db.prepare('SELECT COUNT(*) AS n FROM admin_users'),

  insertLead: db.prepare(`
    INSERT INTO leads (source, name, email, phone, postcode, service, appointment_date, appointment_time, message, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  markLeadEmailStatus: db.prepare(
    'UPDATE leads SET admin_email_sent = ?, customer_email_sent = ? WHERE id = ?'
  )
};

function insertReview({ name, email, rating, review, avatarUrl, ipHash }) {
  const info = stmts.insertReview.run(name, email, rating, review, avatarUrl || null, ipHash || null);
  return Number(info.lastInsertRowid);
}

function getReviewById(id) {
  return stmts.getReviewById.get(id);
}

function deleteReview(id) {
  return stmts.deleteReview.run(id).changes > 0;
}

function updateStatus(id, status) {
  return stmts.updateStatus.run(status, id).changes > 0;
}

function updateFeatured(id, featured) {
  return stmts.updateFeatured.run(featured ? 1 : 0, id).changes > 0;
}

function updateReviewContent(id, { name, rating, review }) {
  return stmts.updateReviewContent.run(name, rating, review, id).changes > 0;
}

// Public: only approved reviews, newest first, optional min-rating filter,
// pagination via limit/offset. Built with a small dynamic WHERE clause but
// every value is still bound as a parameter — never interpolated.
function getApprovedReviews({ limit = 12, offset = 0, minRating = null, featuredOnly = false } = {}) {
  const clauses = ["status = 'approved'"];
  const params = [];
  if (minRating) {
    clauses.push('rating = ?');
    params.push(minRating);
  }
  if (featuredOnly) {
    clauses.push('featured = 1');
  }
  const where = clauses.join(' AND ');
  const stmt = db.prepare(`
    SELECT id, name, rating, review, avatar_url, submitted_at, featured
    FROM reviews
    WHERE ${where}
    ORDER BY featured DESC, submitted_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(...params, limit, offset);
}

function countApproved({ minRating = null } = {}) {
  const clauses = ["status = 'approved'"];
  const params = [];
  if (minRating) {
    clauses.push('rating = ?');
    params.push(minRating);
  }
  const where = clauses.join(' AND ');
  const stmt = db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE ${where}`);
  return Number(stmt.get(...params).n);
}

function getStats() {
  const row = db
    .prepare("SELECT COUNT(*) AS total, AVG(rating) AS avg FROM reviews WHERE status = 'approved'")
    .get();
  const total = Number(row.total) || 0;
  const average = total > 0 ? Math.round(Number(row.avg) * 10) / 10 : 0;
  return { total, average };
}

// Admin: full listing with search/filter/sort, still fully parameterized.
function getAllReviews({ status = null, rating = null, search = '', sort = 'newest', limit = 50, offset = 0 } = {}) {
  const clauses = [];
  const params = [];

  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (rating) {
    clauses.push('rating = ?');
    params.push(rating);
  }
  if (search) {
    clauses.push('(name LIKE ? ESCAPE \'\\\' OR email LIKE ? ESCAPE \'\\\' OR review LIKE ? ESCAPE \'\\\')');
    const escaped = search.replace(/[\\%_]/g, (c) => '\\' + c);
    const like = `%${escaped}%`;
    params.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy =
    sort === 'oldest' ? 'submitted_at ASC' :
    sort === 'rating_high' ? 'rating DESC, submitted_at DESC' :
    sort === 'rating_low' ? 'rating ASC, submitted_at DESC' :
    'submitted_at DESC';

  const rows = db
    .prepare(`SELECT * FROM reviews ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const total = Number(
    db.prepare(`SELECT COUNT(*) AS n FROM reviews ${where}`).get(...params).n
  );
  return { rows, total };
}

function getAdminByUsername(username) {
  return stmts.getAdminByUsername.get(username);
}

function createAdminUser(username, passwordHash) {
  return stmts.insertAdmin.run(username, passwordHash);
}

function countAdmins() {
  return Number(stmts.countAdmins.get().n);
}

function insertLead({ source, name, email, phone, postcode, service, appointmentDate, appointmentTime, message, ipHash }) {
  const info = stmts.insertLead.run(
    source,
    name,
    email,
    phone,
    postcode || null,
    service || null,
    appointmentDate || null,
    appointmentTime || null,
    message || null,
    ipHash || null
  );
  return Number(info.lastInsertRowid);
}

function markLeadEmailStatus(id, { adminEmailSent, customerEmailSent }) {
  return stmts.markLeadEmailStatus.run(adminEmailSent ? 1 : 0, customerEmailSent ? 1 : 0, id).changes > 0;
}

module.exports = {
  db,
  insertReview,
  getReviewById,
  deleteReview,
  updateStatus,
  updateFeatured,
  updateReviewContent,
  getApprovedReviews,
  countApproved,
  getStats,
  getAllReviews,
  getAdminByUsername,
  createAdminUser,
  countAdmins,
  insertLead,
  markLeadEmailStatus
};
