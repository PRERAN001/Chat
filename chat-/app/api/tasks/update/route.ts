import  connectDB  from "@/lib/db";
import Task from "../../../../model/task.model";
export async function PATCH(req: Request) {
  await connectDB();

  const { taskId, status, serverId } = await req.json();

  if (!taskId || !status) {
    return Response.json({ message: "taskId and status are required" }, { status: 400 });
  }

  if (serverId) {
    const task = await Task.findById(taskId);
    if (!task || String(task.serverId) !== String(serverId)) {
      return Response.json({ message: "Task not found for this server" }, { status: 404 });
    }
  }

  const updated = await Task.findByIdAndUpdate(
    taskId,
    { status },
    { returnDocument: "after" }
  );

  return Response.json(updated);
}