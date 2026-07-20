#!/usr/bin/env node
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blissful-blinds';

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }

  const username = args[0].toLowerCase().trim();
  const password = args[1];

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(uri);
  console.log(`Connected successfully.`);

  try {
    // Check if user already exists
    const existing = await AdminUser.findOne({ username });
    if (existing) {
      console.log(`Admin user "${username}" already exists. Updating password...`);
      existing.password = password;
      await existing.save();
      console.log(`Password updated successfully.`);
    } else {
      const admin = new AdminUser({ username, password });
      await admin.save();
      console.log(`Admin user "${username}" created successfully.`);
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
