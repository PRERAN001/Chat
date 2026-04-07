import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Channel from "@/model/channle.model";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");

  const channels = await Channel.find({ serverId });

  return NextResponse.json(channels);
}