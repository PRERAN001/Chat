// app/api/upload-status/route.ts

import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import Status from "@/model/status.model";
import User from "@/model/user.model";
import Friend from "@/model/friend.model";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") 
    const userId = formData.get("userId") 

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", "blog_upload");

    const cloudRes = await fetch(
      "https://api.cloudinary.com/v1_1/dxn29vjxu/auto/upload",
      {
        method: "POST",
        body: cloudForm
      }
    );
    console.log("response from clouinary",cloudRes)

    const data = await cloudRes.json();


    const status = await Status.create({
      userId,
      content: {
        type: "image", 
        mediaUrl: data.secure_url
      }
    });
    console.log("statusss",status)

    return NextResponse.json({
      success: true,
      status
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


export async function GET(req) {
  try {
    await connectDB();

    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let currentUserId = null;

    if (token?.email) {
      const currentUser = await User.findOne({ email: token.email }).select("_id");
      currentUserId = currentUser?._id || null;
    }

    let accessibleUserIds = [];
    if (currentUserId) {
      const acceptedFriends = await Friend.find({
        status: "accepted",
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      }).select("requester recipient");

      const friendIds = acceptedFriends.map((item) =>
        String(item.requester) === String(currentUserId) ? item.recipient : item.requester
      );

      accessibleUserIds = [String(currentUserId), ...friendIds.map(String)];
    }

    const statuses = await Status.find(
      accessibleUserIds.length > 0 ? { userId: { $in: accessibleUserIds } } : {}
    )
      .populate("userId", "name profilepic email")
      .sort({ createdAt: -1 });

    return NextResponse.json(statuses);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}