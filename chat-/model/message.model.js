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
      },

      fileName: {
        type: String
      },

      mimeType: {
        type: String
      }
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
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