import "server-only";

export function getSiteURL() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("Configure SITE_URL for authentication links.");
  const url = new URL(value);
  const local = url.origin === "http://127.0.0.1:3000" || url.origin === "http://localhost:3000";
  if ((!local && url.protocol !== "https:") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an HTTPS origin, or the local development origin.");
  }
  return url.origin;
}
