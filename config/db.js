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
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure code if initial database connection fails
    process.exit(1);
  }
}

module.exports = connectDB;
