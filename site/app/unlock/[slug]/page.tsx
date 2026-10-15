import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProject, profile } from "@/content/site";
import { unlock } from "./actions";

export const metadata: Metadata = { title: "Password", robots: { index: false } };

export default async function Unlock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const project = findProject(slug);
  if (!project || project.access !== "password") notFound();

  return (
    <main className="page">
      <a href="/" className="mono" style={{ textDecoration: "none" }}>
        ← {profile.name}
      </a>
      <div className="unlock">
        <div style={{ display: "grid", gap: 12 }}>
          <h1>{project.title}</h1>
          <p style={{ color: "var(--grey)" }}>{project.line}</p>
        </div>
        <form action={unlock}>
          <input type="hidden" name="slug" value={slug} />
          <label htmlFor="password">This case study is password protected</label>
          <div className="field">
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
            <button type="submit">Unlock</button>
          </div>
          {error && (
            <p className="error" role="alert">
              That password didn’t work. Check it with me, or ask for a new one.
            </p>
          )}
        </form>
        <p style={{ color: "var(--grey)", fontSize: 15 }}>
          No password? Email <a href={`mailto:${profile.email}`}>{profile.email}</a> and I’ll walk you through the work.
        </p>
      </div>
    </main>
  );
}
