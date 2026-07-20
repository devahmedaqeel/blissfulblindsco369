const mongoose = require('mongoose');
const config = require('./config');

/**
 * Connects to the MongoDB database using config.mongodbUri (which falls back
 * to a local dev URI when MONGODB_URI isn't set). Includes error logging.
 */
async function connectDB() {
  const uri = config.mongodbUri;

  try {
    // Set Mongoose options
    const options = {
      autoIndex: true, // Build indexes automatically in dev/production
    };

    await mongoose.connect(uri, options);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    // Serverless functions share one process across requests — exiting here
    // would crash every route (including /api/health) for the whole warm
    // container, not just the one request that needed the database. Routes
    // that depend on Mongoose already fail with their own try/catch when the
    // connection isn't ready, which is the graceful failure we want instead.
    console.error('MongoDB connection error:', error.message);
  }
}

module.exports = connectDB;
