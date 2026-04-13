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
      return NextResponse.json([]);
    }

    const relations = await Friend.find({
      status: "accepted",
      $or: [{ requester: currentUser._id }, { recipient: currentUser._id }],
    })
      .populate("requester", "_id name email profilepic")
      .populate("recipient", "_id name email profilepic")
      .sort({ updatedAt: -1 });

    const friends = relations
      .map((relation) => {
        const isRequester = String(relation.requester?._id) === String(currentUser._id);
        return isRequester ? relation.recipient : relation.requester;
      })
      .filter(Boolean);

    return NextResponse.json(friends);
  } catch (error) {
    console.error("[friends:get]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
