import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/db";
import User from "@/model/user.model";

export async function GET(
  req: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const token = await getToken({ req: req as unknown as Parameters<typeof getToken>[0]["req"] });
    const params = await context.params;
    const userId = String(params?.userId || "");

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const user = await User.findById(userId).select("_id name email profilepic bio").lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isCurrentUser = Boolean(token?.email && user.email === token.email);

    return NextResponse.json({
      ...user,
      bio: user.bio || "",
      isCurrentUser,
    });
  } catch {
    return NextResponse.json({ message: "Error fetching profile" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const token = await getToken({ req: req as unknown as Parameters<typeof getToken>[0]["req"] });
    if (!token?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const userId = String(params?.userId || "");

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const user = await User.findById(userId).select("_id email bio");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.email !== token.email) {
      return NextResponse.json({ message: "You can only edit your own bio" }, { status: 403 });
    }

    const body = await req.json();
    const bio = String(body?.bio || "").trim();

    if (bio.length > 300) {
      return NextResponse.json({ message: "Bio must be 300 characters or less" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { bio } },
      { new: true }
    ).select("_id name email profilepic bio");

    return NextResponse.json({
      success: true,
      bio: updated?.bio || "",
      profile: updated,
    });
  } catch {
    return NextResponse.json({ message: "Error updating bio" }, { status: 500 });
  }
}
