export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;
  const payload = {
    error: statusCode === 500 ? 'Internal server error' : error.message,
    message: error.message
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
}
