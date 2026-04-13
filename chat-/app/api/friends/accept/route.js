import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import Friend from "@/model/friend.model";

export async function POST(req) {
  try {
    await connectDB();

    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const currentUser = await User.findOne({ email: token.email });
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const requestDoc = await Friend.findById(requestId);
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (String(requestDoc.recipient) !== String(currentUser._id)) {
      return NextResponse.json({ error: "You can only accept requests sent to you" }, { status: 403 });
    }

    if (requestDoc.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending" }, { status: 409 });
    }

    requestDoc.status = "accepted";
    requestDoc.respondedAt = new Date();
    await requestDoc.save();

    return NextResponse.json({ success: true, status: requestDoc.status, requestId: String(requestDoc._id) });
  } catch (error) {
    console.error("[friends:accept]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
