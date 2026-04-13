import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import achievements from "../../../../model/achimvemnts.model";
import mongoose from "mongoose";
import User from "@/model/user.model";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, achievement } = await req.json();

    if (!userId || !achievement?.title) {
      return NextResponse.json(
        { message: "userId and achievement.title are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(String(userId))) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const baseUser = await User.findById(String(userId)).select("name email").lean();

    const updated = await achievements.findByIdAndUpdate(
      String(userId),
      {
        $setOnInsert: {
          name: baseUser?.name || achievement?.userName || "User",
          email: baseUser?.email || achievement?.userEmail || `${String(userId)}@achievements.local`,
        },
        $push: {
          achievements: {
            title: achievement.title,
            description: achievement.description || "",
            icon: achievement.icon || "🏆",
            type: achievement.type || "milestone",
            date: achievement.date || new Date(),
          },
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(Array.isArray(updated?.achievements) ? updated.achievements : []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error adding achievement";
    return NextResponse.json({ message }, { status: 500 });
  }
}