
import { Schema, model, models } from "mongoose";

const StatusSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: {
        type: String, // text | image | video
        enum: ["text", "image", "video"],
        default: "image"
      },

      text: String,
      mediaUrl: String
    },

    viewers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);


StatusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Status = models.Status || model("Status", StatusSchema);

export default Status;