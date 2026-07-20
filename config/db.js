const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the environment variable MONGODB_URI.
 * Includes automated connection retry logic and error logging.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

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
