const TOKEN_KEY = "access_token";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function setJWTtoCookie(token: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toUTCString();
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
}

export async function removeJWTfromCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export async function getJWTfromCookie() {
  const token = getCookieValue(TOKEN_KEY);
  if (!token) return null;

  const normalized = token.trim().replace(/^"|"$/g, "");
  if (!normalized || normalized === "undefined" || normalized === "null") {
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
    return null;
  }

  return normalized;
}
