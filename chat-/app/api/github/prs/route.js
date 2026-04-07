import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
export async function GET(req) {
  const token = await getToken({ req });
  const accessToken = token?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized: missing GitHub access token" }, { status: 401 });
  }

  const owner = "PRERAN001";
  const repo = "uber-clone-complete";
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Server missing GITHUB_OWNER or GITHUB_REPO configuration" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      }
    }
  );

  console.log("responseeeeeeeeeeee",res)

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message || "Failed to fetch PRs from GitHub";
    return NextResponse.json({ error: message }, { status: res.status });
  }

  if (!Array.isArray(data)) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data);
}