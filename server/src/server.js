const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

const server = app.listen(config.PORT, () => {
  console.log(`[server] Server listening on port ${config.PORT}`);
  connectDB();
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
  server.close(() => process.exit(1));
});
