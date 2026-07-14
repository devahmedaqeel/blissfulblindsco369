/*
 * Creates (or resets) an admin user. Run manually — never expose this
 * over HTTP. There is deliberately no default admin/admin account baked
 * into the system; you must run this once before the admin panel is usable.
 *
 * Usage:
 *   node src/db/createAdmin.js <username> <password>
 */
const bcrypt = require('bcryptjs');
const { db, getAdminByUsername, createAdminUser } = require('./db');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Usage: node src/db/createAdmin.js <username> <password>');
  process.exit(1);
}

if (password.length < 10) {
  console.error('Password must be at least 10 characters long.');
  process.exit(1);
}

const existing = getAdminByUsername(username);
const hash = bcrypt.hashSync(password, 12);

if (existing) {
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, username);
  console.log(`Password updated for existing admin user "${username}".`);
} else {
  createAdminUser(username, hash);
  console.log(`Admin user "${username}" created.`);
}
