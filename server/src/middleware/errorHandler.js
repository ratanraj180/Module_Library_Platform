const config = require('../config/env');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const body = {
    success: false,
    message,
  };

  if (config.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;