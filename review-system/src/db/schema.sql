CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review        TEXT NOT NULL,
  avatar_url    TEXT,
  submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured      INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  ip_hash       TEXT
);

CREATE INDEX IF NOT EXISTS idx_reviews_status       ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating        ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_submitted_at  ON reviews(submitted_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status_rating ON reviews(status, rating);

CREATE TABLE IF NOT EXISTS admin_users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Captures every booking/quote/chatbot-lead form submission site-wide, as
-- a durable record independent of whether the notification emails for it
-- succeeded — so a Gmail SMTP hiccup never means a lead is silently lost.
CREATE TABLE IF NOT EXISTS leads (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  source                TEXT NOT NULL,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  postcode              TEXT,
  service               TEXT,
  appointment_date      TEXT,
  appointment_time      TEXT,
  message               TEXT,
  submitted_at          TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash               TEXT,
  admin_email_sent      INTEGER NOT NULL DEFAULT 0 CHECK (admin_email_sent IN (0,1)),
  customer_email_sent   INTEGER NOT NULL DEFAULT 0 CHECK (customer_email_sent IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_leads_source        ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_submitted_at   ON leads(submitted_at);
