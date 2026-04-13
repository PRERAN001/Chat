import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import Friend from "@/model/friend.model";

export async function GET(req) {
  try {
    await connectDB();

    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: token.email });
    if (!currentUser) {
      return NextResponse.json({ incoming: [], sent: [], incomingCount: 0 });
    }

    const [incoming, sent] = await Promise.all([
      Friend.find({ recipient: currentUser._id, status: "pending" })
        .populate("requester", "_id name email profilepic")
        .sort({ createdAt: -1 }),
      Friend.find({ requester: currentUser._id, status: "pending" })
        .populate("recipient", "_id name email profilepic")
        .sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      incoming,
      sent,
      incomingCount: incoming.length,
    });
  } catch (error) {
    console.error("[friends:requests]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
