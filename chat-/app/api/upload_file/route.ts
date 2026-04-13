import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", "blog_upload");

    const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dxn29vjxu/auto/upload", {
      method: "POST",
      body: cloudForm,
    });

    const data = await cloudRes.json();

    if (!cloudRes.ok || !data?.secure_url) {
      return NextResponse.json({ error: data?.error?.message || "Cloud upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileUrl: data.secure_url,
      fileName: data.original_filename ? `${data.original_filename}${data.format ? `.${data.format}` : ""}` : file.name,
      mimeType: file.type || "application/octet-stream",
      bytes: data.bytes || file.size,
      cloudinaryPublicId: data.public_id,
      resourceType: data.resource_type,
    });
  } catch (error) {
    console.error("[upload_file]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
