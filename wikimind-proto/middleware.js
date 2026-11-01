// Password gate for the whole prototype (Vercel Routing Middleware).
// The password is read from the WIKIMIND_PASSWORD environment variable.
export const config = { matcher: "/((?!favicon.ico).*)" };

const COOKIE = "wm_auth";
const LOGIN = "/__login";

async function token(pw) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("wikimind:" + pw));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const pass = () => new Response(null, { headers: { "x-middleware-next": "1" } });
const safeNext = (n) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

function page(next, error) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>Wikimind</title>
<style>
:root{--bg:#F8F6F2;--card:#fff;--ink:#1F1B17;--ink2:#6B6259;--accent:#4B45D6;--err:#B4362F;--sh:0 1px 2px rgba(40,32,24,.06),0 8px 28px rgba(40,32,24,.08);color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#16130F;--card:#1D1A17;--ink:#EFEBE6;--ink2:#B0A79C;--accent:#A9A5FF;--err:#FF8A80;--sh:0 1px 2px rgba(0,0,0,.4);color-scheme:dark}}
*{box-sizing:border-box}html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--ink);font-family:"Geist",system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;padding:24px;-webkit-tap-highlight-color:transparent}
form{background:var(--card);box-shadow:var(--sh);border-radius:20px;padding:32px 28px;width:100%;max-width:360px}
h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:30px;letter-spacing:-.01em;margin:0 0 6px}
p{color:var(--ink2);margin:0 0 22px;font-size:15px;line-height:1.5}
input{width:100%;font:inherit;font-size:16px;color:var(--ink);background:var(--bg);border:0;border-radius:12px;padding:13px 14px;outline:none}
input:focus-visible{box-shadow:0 0 0 2px var(--accent)}
button{margin-top:12px;width:100%;font:inherit;font-weight:600;font-size:15px;color:#fff;background:var(--accent);border:0;border-radius:12px;padding:13px;cursor:pointer;transition:transform .16s cubic-bezier(.23,1,.32,1)}
button:active{transform:scale(.97)}
.e{color:var(--err);font-size:14px;margin:10px 0 0}
</style></head><body>
<form method="post" action="${LOGIN}"><h1>Wikimind</h1><p>Prototype preview. Enter the password to continue.</p>
<input type="hidden" name="next" value="${esc(next)}">
<input type="password" name="password" autocomplete="current-password" placeholder="Password" aria-label="Password" autofocus required>
${error ? '<p class="e" role="alert">That password didn’t work.</p>' : ""}
<button type="submit">Continue</button></form></body></html>`;
}
const html = (body, status) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export default async function middleware(req) {
  const pw = process.env.WIKIMIND_PASSWORD;
  if (!pw) return new Response("Password not configured", { status: 503 });
  const url = new URL(req.url);
  const want = await token(pw);

  if (url.pathname === LOGIN && req.method === "POST") {
    const f = await req.formData();
    const next = safeNext(String(f.get("next") || "/"));
    if ((await token(String(f.get("password") || ""))) !== want) return html(page(next, true), 401);
    return new Response(null, {
      status: 303,
      headers: {
        location: next,
        "set-cookie": `${COOKIE}=${want}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    });
  }
  const cookie = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (cookie && cookie.slice(COOKIE.length + 1) === want) return pass();
  return html(page(safeNext(url.pathname + url.search), false), 401);
}
