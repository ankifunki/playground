import { NextResponse, type NextRequest } from "next/server";
import { findProject } from "./content/site";
import { cookieName, hasAccess } from "./lib/access";

// Every request under /work/<slug>/ (the page and its images) passes through here.
export async function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2];
  const project = slug ? findProject(slug) : undefined;
  if (!project || project.access === "public") return NextResponse.next();

  if (await hasAccess(slug, req.cookies.get(cookieName(slug))?.value)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/unlock/${slug}/`;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: "/work/:path*" };
