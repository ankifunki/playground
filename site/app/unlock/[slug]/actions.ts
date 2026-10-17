"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findProject } from "@/content/site";
import { ACCESS_MS, checkPassword, cookieName, tokenFor } from "@/lib/access";

export async function unlock(form: FormData) {
  const slug = String(form.get("slug") ?? "");
  const attempt = String(form.get("password") ?? "");
  const project = findProject(slug);
  if (!project || project.access !== "password") redirect("/");

  const expires = Date.now() + ACCESS_MS;
  const token = (await checkPassword(slug, attempt)) ? await tokenFor(slug, expires) : null;
  if (!token) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    redirect(`/unlock/${slug}/?error=1`);
  }

  (await cookies()).set(cookieName(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/work/${slug}/`,
    maxAge: ACCESS_MS / 1000,
  });
  redirect(`/work/${slug}/`);
}
