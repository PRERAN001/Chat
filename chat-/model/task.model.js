import { Schema, models, model } from "mongoose";

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,

  serverId: {
    type: Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  dueDate: Date,
}, { timestamps: true });

const Task=models.Task || model("Task", TaskSchema);
export default Task;