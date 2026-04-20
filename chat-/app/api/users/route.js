import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import Friend from "@/model/friend.model";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  await connectDB();
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : 5;

  // Get current user
  const currentUser = await User.findOne({ email: token.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Build query - exclude current user, optionally filter by name
  let query = { _id: { $ne: currentUser._id } };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  // Get users with limit (for discover, show 5. for search, show more)
  const users = await User.find(query).limit(limit).lean();

  // Get friend requests info
  const friendRequests = await Friend.find({
    $or: [
      { requester: currentUser._id },
      { recipient: currentUser._id }
    ]
  }).lean();

  // Map friend status for each user
  const usersWithFriendStatus = users.map(user => {
    const friendRequest = friendRequests.find(
      fr => (fr.requester.toString() === user._id.toString() || fr.recipient.toString() === user._id.toString())
    );

    return {
      ...user,
      friendStatus: friendRequest?.status || null,
      isSender: friendRequest?.requester.toString() === currentUser._id.toString(),
      friendRequestId: friendRequest?._id || null,
    };
  });

  return NextResponse.json(usersWithFriendStatus);
}