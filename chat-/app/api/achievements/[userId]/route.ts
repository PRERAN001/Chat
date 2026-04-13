import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import achievements from "../../../../model/achimvemnts.model";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;
    const userId = String(params?.userId || "");

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json([]);
    }

    const user = await achievements.findById(userId).lean();

    if (!user || !Array.isArray(user.achievements)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(user.achievements);
  } catch {
    return NextResponse.json({ message: "Error fetching" }, { status: 500 });
  }
}