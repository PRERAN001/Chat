import mongoose, { Schema, models, model } from "mongoose";

const AchievementSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  icon: String,
  type: {
    type: String,
    enum: ["milestone", "streak", "badge"],
    default: "milestone",
  },
  date: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  achievements: [AchievementSchema],
});

const achievements= models.achievements || model("achievements", UserSchema);
export default achievements