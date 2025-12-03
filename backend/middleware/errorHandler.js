const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Database errors
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Data sudah ada (duplicate entry)",
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referensi data tidak valid",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token tidak valid" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token sudah expired" });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Terjadi kesalahan server",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
