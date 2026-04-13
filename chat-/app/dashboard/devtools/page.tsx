"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

type GitHubUser = {
  login: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  bio?: string;
  followers?: number;
  following?: number;
  public_repos?: number;
  public_gists?: number;
  company?: string;
  location?: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
  updated_at?: string;
};

type GitHubItem = {
  id: number;
  title: string;
  html_url: string;
  repository_url?: string;
};

type DevToolsPayload = {
  fetchedAt: string;
  login: string;
  data: {
    profile: GitHubUser | null;
    repos: GitHubRepo[];
    authoredPrs: GitHubItem[];
    assignedIssues: GitHubItem[];
    notifications: Array<{ id: string; reason?: string; subject?: { title?: string; url?: string } }>;
    events: Array<{ id: string; type?: string; repo?: { name?: string }; created_at?: string }>;
    organizations: Array<{ id: number; login: string; avatar_url?: string; html_url?: string }>;
    starred: GitHubRepo[];
    rateLimit?: {
      rate?: {
        limit?: number;
        remaining?: number;
        reset?: number;
      };
    };
  };
  errors: Array<{ section: string; status?: number; error?: string }>;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function DevToolsPage() {
  const { status } = useSession();
  const [payload, setPayload] = useState<DevToolsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoading(false);
      setError("Please sign in with GitHub to access developer tools.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/github/devtools", { cache: "no-store" });
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body?.error || "Failed to load developer tools data");
        }

        if (!cancelled) {
          setPayload(body);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const profile = payload?.data?.profile;
  const rate = payload?.data?.rateLimit?.rate;

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h1 className="text-2xl font-bold tracking-tight">🛠️ Developer Tools Hub</h1>
          <p className="mt-2 text-sm text-zinc-400">
            GitHub-powered workspace insights, activity, issues, pull requests, and notifications.
          </p>
          {payload?.fetchedAt && (
            <p className="mt-2 text-xs text-zinc-500">Last synced: {formatDateTime(payload.fetchedAt)}</p>
          )}
        </div>

        {loading && <p className="text-zinc-400">Loading developer tools...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && payload && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Open authored PRs</p>
                <p className="mt-2 text-2xl font-semibold">{payload.data.authoredPrs.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Assigned issues</p>
                <p className="mt-2 text-2xl font-semibold">{payload.data.assignedIssues.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Notifications</p>
                <p className="mt-2 text-2xl font-semibold">{payload.data.notifications.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Rate limit remaining</p>
                <p className="mt-2 text-2xl font-semibold">{rate?.remaining ?? "-"}</p>
                <p className="text-xs text-zinc-500">of {rate?.limit ?? "-"}</p>
              </div>
            </div>

            {profile && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-center gap-4">
                  {profile.avatar_url && (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.login}
                      width={52}
                      height={52}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">{profile.name || profile.login}</h2>
                    <p className="text-sm text-zinc-400">@{profile.login}</p>
                    {profile.html_url && (
                      <a
                        href={profile.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View GitHub profile
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{profile.bio || "No bio available."}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Followers: {profile.followers ?? 0} · Following: {profile.following ?? 0} · Repos: {profile.public_repos ?? 0} · Gists: {profile.public_gists ?? 0}
                </p>
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionList title="Recent Repositories" items={payload.data.repos.slice(0, 8).map((repo) => ({
                key: String(repo.id),
                title: repo.full_name,
                subtitle: `${repo.language || "Unknown"} · ⭐ ${repo.stargazers_count ?? 0} · Forks ${repo.forks_count ?? 0}`,
                href: repo.html_url,
              }))} />

              <SectionList title="Open PRs You Authored" items={payload.data.authoredPrs.slice(0, 8).map((item) => ({
                key: String(item.id),
                title: item.title,
                subtitle: item.repository_url?.split("/repos/")[1] || "Repository unknown",
                href: item.html_url,
              }))} />

              <SectionList title="Open Issues Assigned to You" items={payload.data.assignedIssues.slice(0, 8).map((item) => ({
                key: String(item.id),
                title: item.title,
                subtitle: item.repository_url?.split("/repos/")[1] || "Repository unknown",
                href: item.html_url,
              }))} />

              <SectionList title="Notifications" items={payload.data.notifications.slice(0, 8).map((item) => ({
                key: String(item.id),
                title: item.subject?.title || "Untitled",
                subtitle: `Reason: ${item.reason || "unknown"}`,
              }))} />
            </div>

            {payload.errors.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                <p className="font-medium">Some sections could not be fetched:</p>
                <ul className="mt-2 list-disc pl-5">
                  {payload.errors.map((item) => (
                    <li key={item.section}>
                      {item.section}: {item.error || "unknown error"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; title: string; subtitle?: string; href?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No data available.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-100 hover:text-blue-300">
                  {item.title}
                </a>
              ) : (
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
              )}
              {item.subtitle && <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
