"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type TaskStatus = "pending" | "completed";
type TaskPriority = "low" | "medium" | "high";

type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  assignedTo?: string;
  assignedBy?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt?: string;
};

type CurrentUser = {
  _id?: string;
  name?: string;
};

type ServerInfo = {
  _id: string;
  name?: string;
  owner?: string;
  members?: string[];
};

type UserOption = {
  _id: string;
  name?: string;
  email?: string;
  profilepic?: string;
};

type ApiErrorBody = {
  message?: string;
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function TasksPage() {
  const searchParams = useSearchParams();
  const serverId = useMemo(() => searchParams.get("serverId") || "", [searchParams]);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    assignedTo: "",
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

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks]
  );

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.status === "pending").length,
    [tasks]
  );

  const myTasks = useMemo(
    () => tasks.filter((task) => String(task.userId) === String(currentUser?._id)),
    [tasks, currentUser?._id]
  );

  const assignedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          String(task.assignedTo || "") === String(currentUser?._id) &&
          String(task.userId) !== String(currentUser?._id)
      ),
    [tasks, currentUser?._id]
  );

  const assignableUsers = useMemo(() => {
    const allowedIds = new Set([...(serverInfo?.members || []), serverInfo?.owner ? String(serverInfo.owner) : ""]);

    const current: UserOption[] = currentUser?._id
      ? [{ _id: String(currentUser._id), name: `${currentUser.name || "Me"} (You)` }]
      : [];

    const combined: UserOption[] = [...current];
    users.forEach((user) => {
      if (serverInfo && !allowedIds.has(String(user._id))) {
        return;
      }

      if (!combined.some((item) => item._id === user._id)) {
        combined.push({
          ...user,
          name: user.name || user.email || user._id,
        });
      }
    });

    return combined;
  }, [currentUser?._id, currentUser?.name, users, serverInfo]);

  const fetchCurrentUser = useCallback(async () => {
    const res = await fetch("/api/getcurrentuser", { cache: "no-store" });
    const data = await parseResponse<CurrentUser>(res);

    if (!res.ok) {
      throw new Error((data as ApiErrorBody)?.message || "Failed to load current user");
    }

    return (data || {}) as CurrentUser;
  }, []);

  const fetchServerInfo = useCallback(async () => {
    if (!serverId) {
      setServerInfo(null);
      return;
    }

    const res = await fetch(`/api/server?serverId=${serverId}`, { cache: "no-store" });
    const data = await parseResponse<ServerInfo>(res);

    if (!res.ok) {
      throw new Error((data as ApiErrorBody)?.message || "Failed to load server");
    }

    setServerInfo((data || null) as ServerInfo | null);
  }, [serverId]);

  const fetchTasks = useCallback(async (userId: string) => {
    if (!serverId) {
      setTasks([]);
      return;
    }

    const res = await fetch(`/api/tasks?userId=${userId}&serverId=${serverId}`, { cache: "no-store" });
    const data = await parseResponse<TaskItem[]>(res);

    if (!res.ok) {
      throw new Error((data as ApiErrorBody)?.message || "Failed to load tasks");
    }

    setTasks(Array.isArray(data) ? data : []);
  }, [serverId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await parseResponse<UserOption[]>(res);

      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to load users");
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!serverId) {
        setError("Open tasks from a server to view its task board.");
        setTasks([]);
        return;
      }

      const user = await fetchCurrentUser();
      setCurrentUser(user);
      await fetchServerInfo();
      await fetchUsers();

      if (!user?._id) {
        setTasks([]);
        return;
      }

      await fetchTasks(String(user._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser, fetchServerInfo, fetchTasks, fetchUsers, serverId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser?._id || !form.title.trim() || !serverId) return;

    try {
      setIsCreating(true);
      setCreateError("");

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          userId: currentUser._id,
          serverId,
          assignedTo: form.assignedTo || currentUser._id,
          assignedBy: currentUser._id,
          status: "pending",
          priority: form.priority,
          dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        }),
      });

      const data = await parseResponse<TaskItem>(res);
      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to create task");
      }

      if (data && !Array.isArray(data)) {
        setTasks((prev) => [data as TaskItem, ...prev]);
      }

      setForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTaskStatus = async (task: TaskItem) => {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";

    try {
      setUpdatingTaskId(task._id);
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task._id,
            serverId,
          status: nextStatus,
        }),
      });

      const data = await parseResponse<TaskItem>(res);
      if (!res.ok) {
        throw new Error((data as ApiErrorBody)?.message || "Failed to update task");
      }

      if (data && !Array.isArray(data)) {
        setTasks((prev) =>
          prev.map((item) => (item._id === task._id ? (data as TaskItem) : item))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const renderTaskCard = (task: TaskItem) => {
    const assignedUser = assignableUsers.find((user) => user._id === String(task.assignedTo || ""));

    return (
      <div
        key={task._id}
        className={`rounded-2xl border p-4 shadow-sm transition-colors ${
          task.status === "completed"
            ? "border-zinc-800 bg-zinc-900/40"
            : "border-zinc-700 bg-zinc-900/70"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`text-sm font-semibold ${
                task.status === "completed" ? "line-through text-zinc-500" : "text-zinc-100"
              }`}
            >
              {task.title}
            </h3>
            {task.description ? <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{task.description}</p> : null}
          </div>

          <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${priorityStyles[task.priority || "medium"]}`}>
            {task.priority || "medium"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
          <span>{task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}</span>
          <span className="text-zinc-700">•</span>
          <span>Assigned to: {assignedUser?.name || "Unassigned"}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-500">
            {String(task.userId) === String(currentUser?._id) ? "Created by you" : "Assigned to you"}
          </span>

          <button
            onClick={() => toggleTaskStatus(task)}
            disabled={updatingTaskId === task._id}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800 disabled:opacity-60"
          >
            {updatingTaskId === task._id
              ? "Updating..."
              : task.status === "completed"
              ? "Mark Pending"
              : "Mark Done"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-black font-sans flex items-center justify-center text-zinc-100">
      <div className="h-full w-full max-w-400 bg-zinc-950 shadow-2xl overflow-hidden flex border-zinc-800/60 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none z-0" />

        <div className="w-[36%] min-w-90 max-w-130 border-r border-zinc-800 flex flex-col bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="h-27 bg-zinc-900/80 flex items-end px-6 pb-4 text-zinc-100 shrink-0 border-b border-zinc-800">
            <Link
              href="/dashboard"
              className="mr-6 flex items-center hover:bg-zinc-800 p-2 -ml-2 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
              </svg>
            </Link>
            <div>
              <h1 className="text-[20px] font-semibold mb-0.5 tracking-wide">Tasks</h1>
              <p className="text-xs text-zinc-500">
                {serverInfo?.name ? `${serverInfo.name} task board` : "Server task board"}
              </p>
            </div>
          </div>

          <div className="px-4 pb-3 pt-2 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-semibold">Server only</p>
              <p className="text-xs text-zinc-500 truncate">
                {serverInfo?.name ? `Tasks for ${serverInfo.name}` : `Server ID: ${serverId}`}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
            >
              Back
            </Link>
          </div>

          <form onSubmit={createTask} className="px-4 py-4 border-b border-zinc-800 bg-zinc-900/40 space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="w-full bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              required
            />
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>

              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100"
              />
            </div>

            <select
              value={form.assignedTo}
              onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100"
            >
              <option value="">Assign to yourself</option>
              {assignableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || user.email || user._id}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isCreating || !currentUser?._id || !serverId}
              className="w-full rounded-lg py-2 text-sm font-semibold bg-zinc-100 text-black hover:bg-zinc-300 disabled:opacity-50"
            >
              {isCreating ? "Adding..." : "Add Task"}
            </button>
            {createError && <p className="text-xs text-rose-400">{createError}</p>}
            {!serverId && <p className="text-xs text-amber-400">Open this page from a server to add tasks.</p>}
          </form>

          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Pending: <span className="text-zinc-200 font-semibold">{pendingCount}</span></span>
            <span className="text-zinc-400">Completed: <span className="text-zinc-200 font-semibold">{completedCount}</span></span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {loading ? (
              <div className="p-4 text-sm text-zinc-500">Loading tasks...</div>
            ) : (
              <>
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">My tasks</h3>
                    <span className="text-[11px] text-zinc-500">{myTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {myTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-500">
                        Tasks you create will appear here.
                      </div>
                    ) : (
                      myTasks
                        .slice()
                        .sort((a, b) => {
                          if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
                          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                        })
                        .map(renderTaskCard)
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">Tasks assigned</h3>
                    <span className="text-[11px] text-zinc-500">{assignedTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {assignedTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-500">
                        Tasks assigned to you will appear here.
                      </div>
                    ) : (
                      assignedTasks
                        .slice()
                        .sort((a, b) => {
                          if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
                          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                        })
                        .map(renderTaskCard)
                    )}
                  </div>
                </section>

                {tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-center text-zinc-500 text-sm">
                    No tasks yet. Add one above.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center z-10 border-l border-zinc-800">
          <div className="text-center px-10 max-w-xl">
            <h2 className="text-3xl font-bold text-zinc-200 tracking-tight">Plan. Do. Repeat.</h2>
            <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
              Create tasks, set priority, and mark them complete as you progress. Your task board is synced with your backend routes.
            </p>
            {error && (
              <p className="mt-4 text-sm text-rose-400">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
