// app/api/upload-status/route.ts

import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import Status from "@/model/status.model";
import "@/model/user.model";

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


export async function GET() {
  try {
    await connectDB();

    
    const statuses = await Status.find()
      .populate("userId", "name profilepic email")
      .sort({ createdAt: -1 });

    return NextResponse.json(statuses);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}