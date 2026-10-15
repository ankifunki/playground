// Password access for locked case studies.
// Runs in both the middleware (edge) and server actions (node), so it uses Web Crypto only.
//
// Env:
//   CASE_COOKIE_SECRET           long random string, signs the unlock cookie
//   CASE_PASSWORD_<SLUG>         one password per case study, e.g. CASE_PASSWORD_MULTI_LOCATION
//
// The cookie value is HMAC(secret, slug + password), so changing a project's
// password signs everyone out of that project.

const enc = new TextEncoder();

export const cookieName = (slug: string) => `case_${slug.replace(/[^a-z0-9]/gi, "_")}`;

export const passwordFor = (slug: string) =>
  process.env[`CASE_PASSWORD_${slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`];

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The cookie value that unlocks `slug`, or null when the project isn't configured (fail closed). */
export async function tokenFor(slug: string) {
  const secret = process.env.CASE_COOKIE_SECRET;
  const password = passwordFor(slug);
  if (!secret || !password) return null;
  return hmac(secret, `${slug}\n${password}`);
}

export async function hasAccess(slug: string, cookie: string | undefined) {
  const token = await tokenFor(slug);
  return !!token && !!cookie && safeEqual(token, cookie);
}

export async function checkPassword(slug: string, attempt: string) {
  const secret = process.env.CASE_COOKIE_SECRET;
  const password = passwordFor(slug);
  if (!secret || !password) return false;
  // Compare digests so the comparison time doesn't depend on the password.
  const [a, b] = await Promise.all([hmac(secret, attempt), hmac(secret, password)]);
  return safeEqual(a, b);
}
