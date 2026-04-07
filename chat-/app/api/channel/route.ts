import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Channel from "@/model/channle.model";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, serverId } = await req.json();

    if (!name || !serverId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const channel = await Channel.create({
      name,
      serverId
    });

    return NextResponse.json(channel);

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}