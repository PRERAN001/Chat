import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Chat from "@/model/chat.model";
import User from "@/model/user.model";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    await connectDB();

    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: token.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const groups = await Chat.find({
      isGroup: true,
      participants: currentUser._id,
    })
      .populate("participants", "name email profilepic")
      .sort({ updatedAt: -1 });

    return NextResponse.json(groups);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const { participants, groupName } = await req.json();

    if (!participants || participants.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 users" },
        { status: 400 }
      );
    }

    
    const chat = await Chat.create({
      participants,
      isGroup: true,
      groupname: groupName,
      
    });

    return NextResponse.json(chat);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}