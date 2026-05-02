const API_URL = import.meta.env.VITE_API_URL;

console.log("Using API URL:", API_URL);

if (!API_URL) {
  throw new Error("REACT_APP_API_URL is not defined in environment variables");
}
export default API_URL;