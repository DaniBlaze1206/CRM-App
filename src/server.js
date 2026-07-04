const config = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const app = require('./app');

let server;

async function start() {
  await connectDB();

  server = app.listen(config.port, () => {
    logger.info(`CRM server running on port ${config.port} [${config.env}]`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  const mongoose = require('mongoose');
  await mongoose.connection.close(false);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

module.exports = { start };
