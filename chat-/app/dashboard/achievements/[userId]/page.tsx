"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AchievementType = "milestone" | "streak" | "badge";

type Achievement = {
  title: string;
  description?: string;
  icon?: string;
  type?: AchievementType;
  date?: string;
};

type ApiErrorBody = {
  message?: string;
};

type UserProfile = {
  _id: string;
  name?: string;
  email?: string;
  profilepic?: string;
  bio?: string;
  isCurrentUser?: boolean;
};

const typeStyles: Record<AchievementType, string> = {
  milestone: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  streak: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const typeHighlights: Record<AchievementType, string> = {
  milestone: "from-blue-500/30 via-indigo-500/10 to-transparent",
  streak: "from-amber-500/30 via-orange-500/10 to-transparent",
  badge: "from-emerald-500/30 via-teal-500/10 to-transparent",
};

const typeCopy: Record<AchievementType, string> = {
  milestone: "Major progress checkpoint",
  streak: "Consistency unlocked",
  badge: "Special recognition unlocked",
};

export default function UserAchievementsPage() {
  const params = useParams<{ userId: string }>();
  const userId = useMemo(() => String(params?.userId || ""), [params?.userId]);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [bioError, setBioError] = useState("");
  const [bioSuccess, setBioSuccess] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "🏆",
    type: "milestone" as AchievementType,
  });

  const parseResponse = async <T,>(res: Response): Promise<T | ApiErrorBody | null> => {
    const text = await res.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as T | ApiErrorBody;
    } catch {
      return { message: text };
    }
  };

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/achievements/${userId}`, { cache: "no-store" });
      const data = await parseResponse<Achievement[]>(res);

      if (!res.ok) {
        if (res.status === 404 && (data as ApiErrorBody)?.message === "No achievements found") {
          setAchievements([]);
          setError("");
          return;
        }
        throw new Error((data as ApiErrorBody)?.message || "Failed to load achievements");
      }

      setAchievements(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load achievements";
      setError(message);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoadingProfile(true);
      setBioError("");

      const res = await fetch(`/api/users/${userId}/profile`, { cache: "no-store" });
      const data = await parseResponse<UserProfile>(res);

      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to load profile");
      }

      const profileData = (data as UserProfile) || null;
      setProfile(profileData);
      setBioDraft(profileData?.bio || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setBioError(message);
      setProfile(null);
      setBioDraft("");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadAchievements();
    loadProfile();
  }, [userId, loadAchievements, loadProfile]);

  const handleSaveBio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile?.isCurrentUser) return;

    try {
      setIsSavingBio(true);
      setBioError("");
      setBioSuccess("");

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bioDraft }),
      });

      const data = await parseResponse<{ success?: boolean; bio?: string; profile?: UserProfile }>(res);
      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to update bio");
      }

      const updatedBio = (data as { bio?: string })?.bio || "";
      const updatedProfile = (data as { profile?: UserProfile })?.profile;
      setProfile(updatedProfile ? { ...updatedProfile, isCurrentUser: true } : (prev) => (prev ? { ...prev, bio: updatedBio } : prev));
      setBioDraft(updatedBio);
      setBioSuccess("Bio updated successfully ✅");
      await loadProfile();
    } catch (err) {
      setBioError(err instanceof Error ? err.message : "Failed to update bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [achievements]);

  const stats = useMemo(() => {
    const total = achievements.length;
    const milestones = achievements.filter((item) => (item.type || "milestone") === "milestone").length;
    const streaks = achievements.filter((item) => (item.type || "milestone") === "streak").length;
    const badges = achievements.filter((item) => (item.type || "milestone") === "badge").length;
    const completion = Math.min(100, Math.round((total / 12) * 100));

    return { total, milestones, streaks, badges, completion };
  }, [achievements]);

  const handleAddAchievement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !form.title.trim()) return;

    try {
      setIsAdding(true);
      setAddError("");
      setAddSuccess("");
      setError("");

      const res = await fetch("/api/achievements/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          achievement: {
            title: form.title.trim(),
            description: form.description.trim(),
            icon: form.icon.trim() || "🏆",
            type: form.type,
          },
        }),
      });

      const data = await parseResponse<Achievement[]>(res);
      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to add achievement");
      }

      setAchievements(Array.isArray(data) ? data : []);
      setError("");
      setForm({ title: "", description: "", icon: "🏆", type: "milestone" });
      setAddSuccess("Achievement added successfully ✅");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add achievement");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] pointer-events-none z-0"
        style={{ backgroundSize: "14px 24px" }}
      />
      <div className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-zinc-400 text-sm">User Profile Showcase</p>
            <h1 className="text-3xl font-semibold tracking-tight">Achievements Vault</h1>
            <p className="mt-1 text-zinc-400 text-sm">{profile?.name || "Unknown User"}</p>
            <p className="mt-2 text-zinc-500 text-sm break-all">User ID: {userId}</p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            Back to Chat
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Profile Bio</h2>
              <p className="text-sm text-zinc-500">
                {profile?.isCurrentUser
                  ? "Tell others about you. This appears when users open your profile."
                  : "User profile bio"}
              </p>
            </div>
            {profile?.isCurrentUser && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Editable
              </span>
            )}
          </div>

          {isLoadingProfile ? (
            <p className="text-sm text-zinc-400">Loading profile...</p>
          ) : profile?.isCurrentUser ? (
            <form onSubmit={handleSaveBio}>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Write your bio here..."
                rows={4}
                maxLength={300}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-500">{bioDraft.length}/300</span>
                <button
                  type="submit"
                  disabled={isSavingBio}
                  className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-300 disabled:opacity-60"
                >
                  {isSavingBio ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </form>
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
              {profile?.bio?.trim() || "No bio added yet."}
            </p>
          )}

          {bioError && <p className="mt-3 text-sm text-red-400">{bioError}</p>}
          {bioSuccess && <p className="mt-3 text-sm text-emerald-400">{bioSuccess}</p>}
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Progress Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-100">A richer showcase of wins 🏆</h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                Every achievement tells a story. This board highlights momentum, consistency, and meaningful milestones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                <p className="text-xs text-zinc-400">Total</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-blue-500/10 px-4 py-3">
                <p className="text-xs text-blue-300">Milestones</p>
                <p className="mt-1 text-2xl font-semibold text-blue-100">{stats.milestones}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-amber-500/10 px-4 py-3">
                <p className="text-xs text-amber-300">Streaks</p>
                <p className="mt-1 text-2xl font-semibold text-amber-100">{stats.streaks}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs text-emerald-300">Badges</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-100">{stats.badges}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Showcase completion</span>
              <span>{stats.completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-400 via-indigo-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${stats.completion}%` }}
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAddAchievement}
          className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Add Achievement</h2>
              <p className="mt-1 text-sm text-zinc-500">Create a new achievement for this user profile.</p>
            </div>

            <div className="inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "grid" ? "bg-zinc-100 text-black" : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "timeline" ? "bg-zinc-100 text-black" : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title (required)"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              required
            />

            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as AchievementType }))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="milestone">Milestone</option>
              <option value="streak">Streak</option>
              <option value="badge">Badge</option>
            </select>

            <input
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              placeholder="Icon (e.g. 🏆)"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />

            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isAdding || !form.title.trim()}
              className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-300 disabled:opacity-60"
            >
              {isAdding ? "Adding..." : "Add Achievement"}
            </button>

            <button
              type="button"
              onClick={loadAchievements}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Refresh
            </button>
          </div>

          {addError && <p className="mt-3 text-sm text-red-400">{addError}</p>}
          {addSuccess && <p className="mt-3 text-sm text-emerald-400">{addSuccess}</p>}
        </form>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 text-zinc-400">
            Loading achievements...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && achievements.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-10 text-center">
            <p className="text-lg text-zinc-300">No achievements yet</p>
            <p className="mt-2 text-zinc-500 text-sm">This user has not unlocked any achievements.</p>
          </div>
        )}

        {!loading && !error && achievements.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {sortedAchievements.map((achievement, index) => {
                  const type = (achievement.type || "milestone") as AchievementType;
                  const isFeatured = index === 0;

                  return (
                    <div
                      key={`${achievement.title}-${index}`}
                      className={`group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/85 p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-2xl ${
                        isFeatured ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div className={`absolute inset-0 bg-linear-to-br ${typeHighlights[type]} opacity-80`} />
                      <div className="relative">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-zinc-700 bg-zinc-900/80 text-2xl shadow-inner">
                              {achievement.icon || "🏆"}
                            </span>
                            <div className="min-w-0">
                              <h2 className="truncate text-base font-semibold text-zinc-100">{achievement.title}</h2>
                              <p className="truncate text-xs text-zinc-400">{typeCopy[type]}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs capitalize ${typeStyles[type]}`}>
                            {type}
                          </span>
                        </div>

                        {achievement.description ? (
                          <p className="text-sm leading-relaxed text-zinc-300">{achievement.description}</p>
                        ) : (
                          <p className="text-sm text-zinc-500">No description provided.</p>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-400">
                          <span>{isFeatured ? "Featured Achievement" : "Achievement Unlocked"}</span>
                          <span>
                            {achievement.date ? new Date(achievement.date).toLocaleString() : "Date unavailable"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl">
                <div className="relative ml-3 border-l border-zinc-800 pl-6">
                  {sortedAchievements.map((achievement, index) => {
                    const type = (achievement.type || "milestone") as AchievementType;

                    return (
                      <div key={`${achievement.title}-${index}`} className="relative mb-5 last:mb-0">
                        <span className="absolute -left-9.25 top-3 grid h-5 w-5 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-[10px]">
                          {achievement.icon || "🏆"}
                        </span>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-zinc-100">{achievement.title}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${typeStyles[type]}`}>
                              {type}
                            </span>
                          </div>

                          <p className="text-sm text-zinc-400">
                            {achievement.description || "No description provided."}
                          </p>

                          <p className="mt-2 text-xs text-zinc-500">
                            {achievement.date ? `Unlocked: ${new Date(achievement.date).toLocaleString()}` : "Date unavailable"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
