// config.js
const isLocal = process.env.NODE_ENV === "development";
const config = {
  API_BASE_URL: "https://fit.neu.edu.vn/codelab/api",
  RAISE_HAND_ENDPOINT: isLocal
    ? "http://localhost:8015/api/raiseHand"
    : "https://fit.neu.edu.vn/codelab/api/raiseHand",
  API_OJ_BASE_URL: "https://fit.neu.edu.vn/oj",
  API_LOG_URL: "https://fit.neu.edu.vn/codelab/api/logs",
  // API_LOG_URL: "http://localhost:8015/api/logs"
};

export default config;
