import TasksPage from "./TasksPage";

export const metadata = {
  title: "Tasks",
};

export default function DashboardTasks() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-400">Loading tasks...</div>}>
      <TasksPage />
    </Suspense>
  );
}
