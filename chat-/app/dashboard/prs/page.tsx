"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

type PR = {
  id: number;
  title: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
};

type PRProps = {
  compact?: boolean;
};

export default function PR({ compact = false }: PRProps) {
  const { status } = useSession();
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      setLoading(false);
      setError("Please sign in to view pull requests.");
      setPrs([]);
      return;
    }

    let cancelled = false;

    const fetchPRs = async (retried = false) => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/github/prs", { cache: "no-store" });
        console.log("pr responseee",res)

        if (res.status === 401 && !retried) {
          setTimeout(() => {
            if (!cancelled) {
              fetchPRs(true);
            }
          }, 300);
          return;
        }

        if (!res.ok) {
          let message = "Failed to fetch PRs";
          try {
            const errBody = await res.json();
            if (errBody?.error) message = errBody.error;
          } catch {
            // ignore parse errors and keep default message
          }
          throw new Error(message);
        }

        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        if (!cancelled) {
          setPrs(normalized);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPRs();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const wrapperClass = compact
    ? "w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-zinc-100 shadow-xl"
    : "min-h-screen bg-gray-900 p-6 text-white";

  const titleClass = compact ? "mb-4 text-lg font-semibold" : "mb-6 text-2xl font-bold";

  return (
    <div className={wrapperClass}>
      <h1 className={titleClass}>🚀 GitHub Pull Requests</h1>

      {/* Loading */}
      {loading && <p className="text-sm text-zinc-400">Loading PRs...</p>}

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* PR List */}
      <div className={`grid gap-3 ${compact ? "max-h-72 overflow-y-auto pr-1" : "gap-4"}`}>
        {prs.map((pr) => (
          <div
            key={pr.id}
            className={`rounded-xl border p-4 transition ${
              compact
                ? "border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900"
                : "bg-gray-800 shadow hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Image
                src={pr.user.avatar_url}
                alt="avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-zinc-400">
                {pr.user.login}
              </span>
            </div>

            <h2 className="text-lg font-semibold">{pr.title}</h2>

            <a
              href={pr.html_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              View PR →
            </a>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && prs.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">No PRs found.</p>
      )}
    </div>
  );
}