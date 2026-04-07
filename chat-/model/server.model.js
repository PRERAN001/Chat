import { Schema, model, models } from "mongoose";

const ServerSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    icon: String
  },
  { timestamps: true }
);

const Server = models.Server || model("Server", ServerSchema);

export default Server;