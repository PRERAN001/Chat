import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import Friend from "@/model/friend.model";

const makePairKey = (id1, id2) => [String(id1), String(id2)].sort().join(":");

export async function POST(req) {
  try {
    await connectDB();

    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId } = await req.json();
    if (!recipientId) {
      return NextResponse.json({ error: "recipientId is required" }, { status: 400 });
    }

    const requester = await User.findOne({ email: token.email });
    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    if (String(requester._id) === String(recipient._id)) {
      return NextResponse.json({ error: "You cannot send friend request to yourself" }, { status: 400 });
    }

    const pairKey = makePairKey(requester._id, recipient._id);
    const existing = await Friend.findOne({ pairKey });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 409 });
      }

      if (existing.status === "pending") {
        if (String(existing.requester) === String(requester._id)) {
          return NextResponse.json({ error: "Friend request already sent" }, { status: 409 });
        }

        return NextResponse.json(
          { error: "This user already sent you a request. Please accept it from requests." },
          { status: 409 }
        );
      }

      existing.requester = requester._id;
      existing.recipient = recipient._id;
      existing.status = "pending";
      existing.respondedAt = null;
      await existing.save();

      return NextResponse.json({ success: true, requestId: String(existing._id), status: existing.status });
    }

    const created = await Friend.create({
      requester: requester._id,
      recipient: recipient._id,
      pairKey,
      status: "pending",
    });

    return NextResponse.json({ success: true, requestId: String(created._id), status: created.status });
  } catch (error) {
    console.error("[friends:request]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
