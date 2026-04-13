import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Server from "../../../model/server.model";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const serverId = searchParams.get("serverId");

    if (serverId) {
      const server = await Server.findById(serverId);
      if (!server) {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }

      return NextResponse.json(server);
    }

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const servers = await Server.find(query);
    return NextResponse.json(servers);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const { name, userId } = await req.json();

    if (!name || !userId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const server = await Server.create({
      name,
      owner: userId,
      members: [userId] 
    });

    return NextResponse.json(server);

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}