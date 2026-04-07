import mongoose, { Schema,  model } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      
    },

    channelId: {
    type: Schema.Types.ObjectId,
    ref: "Channel",
    default: null
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: {
        type: String,
        enum: ["text", "image", "video", "file"],
        default: "text"
      },

      text: {
        type: String
      },

      url: {
        type: String
      }
    },

    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || model("Message", MessageSchema);

export default Message;