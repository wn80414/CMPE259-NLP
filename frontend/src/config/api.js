export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("Missing VITE_API_URL in .env");
}