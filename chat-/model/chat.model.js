import mongoose, { Schema, models, model } from "mongoose";

const ChatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    isGroup: {
      type: Boolean,
      default: false
    },

    lastMessage: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);


const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;