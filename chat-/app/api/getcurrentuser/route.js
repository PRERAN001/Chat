import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/model/user.model";
import { getToken } from "next-auth/jwt";
export async function GET(req) {
    await connectDB();
    const token = await getToken({ req });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = token.email;
    if (!userEmail) {
        return NextResponse.json({ error: "Email missing in token" }, { status: 400 });
    }

    const userinfo = await User.findOne({ email: userEmail });
    if (!userinfo) {
        return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(userinfo);
}