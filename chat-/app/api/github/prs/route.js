import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ghFetch = async (accessToken, path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  const body = await res.json();
  return { res, body };
};

export async function GET(req) {
  const token = await getToken({ req });
  
  // Check if user is authenticated via Google (not allowed for GitHub features)
  if (token?.provider === "google") {
    return NextResponse.json(
      { error: "GitHub features are not available for Google-authenticated users" },
      { status: 403 }
    );
  }

  const accessToken = token?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized: missing GitHub access token" }, { status: 401 });
  }

  const profileResponse = await ghFetch(accessToken, "/user");
  if (!profileResponse.res.ok) {
    return NextResponse.json(
      { error: profileResponse.body?.message || "Failed to resolve GitHub profile" },
      { status: profileResponse.res.status }
    );
  }

  const login = profileResponse.body?.login;
  if (!login) {
    return NextResponse.json({ error: "GitHub login not found for this session" }, { status: 400 });
  }

  const query = encodeURIComponent(`is:pr is:open author:${login}`);
  const searchResponse = await ghFetch(
    accessToken,
    `/search/issues?q=${query}&sort=updated&order=desc&per_page=25`
  );

  if (!searchResponse.res.ok) {
    const message = searchResponse.body?.message || "Failed to fetch PRs from GitHub";
    return NextResponse.json({ error: message }, { status: searchResponse.res.status });
  }

  const items = Array.isArray(searchResponse.body?.items) ? searchResponse.body.items : [];

  if (!Array.isArray(items)) {
    return NextResponse.json([]);
  }

  return NextResponse.json(items);
}