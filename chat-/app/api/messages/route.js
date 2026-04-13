// app/api/messages/route.ts

import { NextResponse } from "next/server";
import  connectDB  from "@/lib/db";
import User from "@/model/user.model";
import Chat from "@/model/chat.model";
import Message from "@/model/message.model";

export async function GET(req) {
  try {
    await connectDB();

    const messageQueryOptions = {
      path: "replyTo",
      select: "_id senderId content isDeleted createdAt",
    };

    const { searchParams } = new URL(req.url);

    const channelId = searchParams.get("channelId");
    if (channelId) {
      const messages = await Message.find({
        channelId,
      })
        .populate(messageQueryOptions)
        .sort({ createdAt: 1 });

      return NextResponse.json(messages);
    }

    const chatId = searchParams.get("chatId");
    if (chatId) {
      const messages = await Message.find({
        chatId,
      })
        .populate(messageQueryOptions)
        .sort({ createdAt: 1 });

      return NextResponse.json(messages);
    }

    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    const u1 = await User.findOne({ email: user1 });
    const u2 = await User.findOne({ email: user2 });

    if (!u1 || !u2) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chat = await Chat.findOne({
      participants: { $all: [u1._id, u2._id] }
    });

    if (!chat) {
      return NextResponse.json([]);
    }

    const messages = await Message.find({
      chatId: chat._id
    })
      .populate(messageQueryOptions)
      .sort({ createdAt: 1 });

    return NextResponse.json(messages);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}