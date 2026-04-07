import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Server from "@/model/server.model";
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const servers = await Server.find({
    members: userId
  });

  return NextResponse.json(servers);
}