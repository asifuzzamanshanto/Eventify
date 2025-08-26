// api.js

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = typeof RAW_BASE === "string" ? RAW_BASE.replace(/\/+$/, "") : "";

const originalFetch = window.fetch;

window.fetch = async (input, init) => {
  if (typeof input === "string" && input.startsWith("/api") && API_BASE_URL) {
    input = API_BASE_URL + input;
  }
  return originalFetch(input, init);
};


console.log("[api] VITE_API_BASE_URL =", API_BASE_URL || "(not set)");