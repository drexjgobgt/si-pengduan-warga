const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
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

  // File log
  const logFile = path.join(
    logDir,
    `${level}-${new Date().toISOString().split("T")[0]}.log`
  );
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
};

module.exports = {
  info: (message, meta) => log("info", message, meta),
  error: (message, meta) => log("error", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  debug: (message, meta) => log("debug", message, meta),
};
