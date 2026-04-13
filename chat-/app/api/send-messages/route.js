import { NextResponse } from "next/server";
import  connectDB  from "@/lib/db";
import User from "@/model/user.model";
import Chat from "@/model/chat.model";
import Message from "@/model/message.model";

export async function POST(req) {
  try {
    await connectDB();

    const { senderEmail, receiverEmail, chatId, channelId, text, replyTo, fileUrl, fileName, mimeType } = await req.json();

    const sender = await User.findOne({ email: senderEmail });
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const senderId = sender._id;

    let chat = null;

    if (channelId) {
      // channel mode does not require chat lookup
    } else if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      const receiver = await User.findOne({ email: receiverEmail });
      if (!receiver) {
        return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
      }

      const receiverId = receiver._id;

      chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] }
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [senderId, receiverId]
        });
      }
    }

    let replyToMessageId = null;
    if (replyTo) {
      const parentMessage = await Message.findById(replyTo);
      if (!parentMessage) {
        return NextResponse.json({ error: "Reply target message not found" }, { status: 404 });
      }

      replyToMessageId = parentMessage._id;
    }

    const message = await Message.create({
      chatId: chat?._id ?? null,
      channelId: channelId ?? null,
      senderId,
      replyTo: replyToMessageId,
      content: {
        type: fileUrl ? "file" : "text",
        text: text || fileName || "",
        url: fileUrl || "",
        fileName: fileName || "",
        mimeType: mimeType || "",
      }
    });

    const populatedMessage = await Message.findById(message._id).populate({
      path: "replyTo",
      select: "_id senderId content isDeleted createdAt",
    });

    if (chat) {
      chat.lastMessage = fileUrl ? `📎 ${fileName || "File"}` : text;
      await chat.save();
    }

    return NextResponse.json({
      success: true,
      message: populatedMessage,
      chatId: chat?._id ?? null,
      channelId: channelId ?? null
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}