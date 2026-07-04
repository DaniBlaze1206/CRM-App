const mongoose = require('mongoose');
const config = require('./env');

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('MongoDB reconnected');
});


async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.info('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error(`MongoDB initial connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
