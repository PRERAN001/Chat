import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userName = token.name;
  const users = await User.find({
    name: { $ne: userName }
  });
  return NextResponse.json(users);
}