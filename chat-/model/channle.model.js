import { Schema, model, models } from "mongoose";

const ChannelSchema = new Schema(
  {
    serverId: {
      type: Schema.Types.ObjectId,
      ref: "Server",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["text", "voice"],
      default: "text"
    }
  },
  { timestamps: true }
);

const Channel = models.Channel || model("Channel", ChannelSchema);

export default Channel;