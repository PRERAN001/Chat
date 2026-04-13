import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Server from "@/model/server.model";
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const servers = await Server.find({
    $or: [
      { members: userId },
      { owner: userId },
    ],
  });

  return NextResponse.json(servers);
}