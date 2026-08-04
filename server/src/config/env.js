const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['PORT', 'MONGO_URI', 'NODE_ENV'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[config] Missing required environment variables: ${missing.join(', ')}. ` +
      `Copy .env.example to .env and fill in the values.`,
  );
  process.exit(1);
}

const config = {
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
};

module.exports = config;
