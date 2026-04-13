import { Schema, model, models } from "mongoose";

const FriendSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

FriendSchema.index({ recipient: 1, status: 1 });
FriendSchema.index({ requester: 1, status: 1 });

const Friend = models.Friend || model("Friend", FriendSchema);

export default Friend;
