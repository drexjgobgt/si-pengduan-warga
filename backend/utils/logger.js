const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    // ignore directory creation error
  }
}

const log = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  // Console log
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);

  // Non-blocking file append
  const logFile = path.join(
    logDir,
    `${level}-${new Date().toISOString().split("T")[0]}.log`
  );
  fs.appendFile(logFile, JSON.stringify(logEntry) + "\n", (err) => {
    if (err) console.error("Logging error:", err);
  });
};

module.exports = {
  info: (message, meta) => log("info", message, meta),
  error: (message, meta) => log("error", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  debug: (message, meta) => log("debug", message, meta),
};
