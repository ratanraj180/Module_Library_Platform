const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.MONGO_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[db] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
