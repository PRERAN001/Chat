import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import Server from "../../../../model/server.model";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { serverId, userId } = await req.json();

    if (!serverId || !userId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const server = await Server.findById(serverId);

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    // 🔥 add user only if not already present
    if (!server.members.includes(userId)) {
      server.members.push(userId);
      await server.save();
    }

    return NextResponse.json(server);

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Join failed" },
      { status: 500 }
    );
  }
}