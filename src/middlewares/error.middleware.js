// Catch‑all error formatter
export const errorHandler = (err, req, res, next) => {
  // If a response has already been sent, let Express finish
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // send detailed errors only when you attach them
    errors: err.errors || [],
    // never leak stack traces in production
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
