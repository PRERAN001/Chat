import { NextResponse } from "next/server";
import connectDB  from "@/lib/db";
import achievements from "../../../../model/achimvemnts.model"


export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId, achievementId } = await req.json();

    await achievements.findByIdAndUpdate(userId, {
      $pull: { achievements: { _id: achievementId } },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting" }, { status: 500 });
  }
}