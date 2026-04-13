import  connectDB  from "@/lib/db";
import Server from "../../../model/server.model";
import Task from "../../../model/task.model";

const normalizeTask = (task: {
  _id: unknown;
  title: string;
  description?: string;
  userId: unknown;
  assignedTo?: unknown;
  assignedBy?: unknown;
  status?: string;
  priority?: string;
  dueDate?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}) => ({
  _id: String(task._id),
  title: task.title,
  description: task.description || "",
  userId: String(task.userId),
  assignedTo: task.assignedTo ? String(task.assignedTo) : "",
  assignedBy: task.assignedBy ? String(task.assignedBy) : "",
  status: task.status || "pending",
  priority: task.priority || "medium",
  dueDate: task.dueDate || null,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    if (!body?.title || !body?.userId || !body?.serverId) {
      return Response.json(
        { message: "title, userId, and serverId are required" },
        { status: 400 }
      );
    }

    const server = await Server.findById(body.serverId);
    if (!server) {
      return Response.json({ message: "Server not found" }, { status: 404 });
    }

    const isMember = String(server.owner) === String(body.userId)
      || (Array.isArray(server.members) && server.members.some((member: unknown) => String(member) === String(body.userId)));

    if (!isMember) {
      return Response.json({ message: "You do not have access to this server" }, { status: 403 });
    }

    const assignedTo = body.assignedTo || body.userId;
    const assignedBy = body.assignedBy || body.userId;

    const isAssigneeMember = String(server.owner) === String(assignedTo)
      || (Array.isArray(server.members) && server.members.some((member: unknown) => String(member) === String(assignedTo)));

    if (!isAssigneeMember) {
      return Response.json({ message: "Assigned user must be a member of this server" }, { status: 400 });
    }

    const task = await Task.create({
      ...body,
      serverId: body.serverId,
      assignedTo,
      assignedBy,
    });

    return Response.json(normalizeTask(task.toObject()));
  } catch {
    return Response.json({ message: "Error creating task" }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const serverId = searchParams.get("serverId");

    if (!userId || !serverId) {
      return Response.json({ message: "userId and serverId are required" }, { status: 400 });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return Response.json({ message: "Server not found" }, { status: 404 });
    }

    const isMember = String(server.owner) === String(userId)
      || (Array.isArray(server.members) && server.members.some((member: unknown) => String(member) === String(userId)));

    if (!isMember) {
      return Response.json({ message: "You do not have access to this server" }, { status: 403 });
    }

    const tasks = await Task.find({
      serverId,
    }).sort({ createdAt: -1 }).lean();

    return Response.json(Array.isArray(tasks) ? tasks.map(normalizeTask) : []);
  } catch {
    return Response.json({ message: "Error loading tasks" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
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
    ).lean();

    if (!updated) {
      return Response.json({ message: "Task not found" }, { status: 404 });
    }

    return Response.json(normalizeTask(updated));
  } catch {
    return Response.json({ message: "Error updating task" }, { status: 500 });
  }
}