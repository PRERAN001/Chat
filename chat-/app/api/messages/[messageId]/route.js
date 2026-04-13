import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import Message from "@/model/message.model";

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { messageId } = await params;
    if (!messageId) {
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    const { senderEmail } = await req.json();
    if (!senderEmail) {
      return NextResponse.json({ error: "Sender email is required" }, { status: 400 });
    }

    const sender = await User.findOne({ email: senderEmail });
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (String(message.senderId) !== String(sender._id)) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = {
      ...message.content,
      type: "text",
      text: "This message was deleted",
      url: "",
    };

    await message.save();

    return NextResponse.json({
      success: true,
      messageId: String(message._id),
      chatId: message.chatId ? String(message.chatId) : null,
      channelId: message.channelId ? String(message.channelId) : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
