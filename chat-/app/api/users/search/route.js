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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const baseFilter = {
      _id: { $ne: currentUser._id },
      ...(q
        ? {
            $or: [
              { name: { $regex: q, $options: "i" } },
              { email: { $regex: q, $options: "i" } },
            ],
          }
        : {}),
    };

    const candidates = await User.find(baseFilter)
      .select("_id name email profilepic")
      .sort({ name: 1 })
      .limit(25);

    const candidateIds = candidates.map((item) => item._id);

    const relations = await Friend.find({
      $or: [
        { requester: currentUser._id, recipient: { $in: candidateIds } },
        { recipient: currentUser._id, requester: { $in: candidateIds } },
      ],
    });

    const relationByOtherUser = new Map();
    for (const rel of relations) {
      const otherId =
        String(rel.requester) === String(currentUser._id)
          ? String(rel.recipient)
          : String(rel.requester);

      let relationStatus = "none";
      if (rel.status === "accepted") {
        relationStatus = "friends";
      } else if (rel.status === "pending") {
        relationStatus =
          String(rel.requester) === String(currentUser._id)
            ? "request_sent"
            : "request_received";
      }

      relationByOtherUser.set(otherId, relationStatus);
    }

    const result = candidates.map((user) => ({
      ...user.toObject(),
      relationStatus: relationByOtherUser.get(String(user._id)) || "none",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[users:search]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
