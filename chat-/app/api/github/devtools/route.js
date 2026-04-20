import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const safeGitHubFetch = async (accessToken, path) => {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      return {
        ok: false,
        status: res.status,
        error: payload?.message || `GitHub API request failed for ${path}`,
      };
    }

    const json = await res.json();
    return { ok: true, data: json };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : `Unexpected error for ${path}`,
    };
  }
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
    return NextResponse.json(
      { error: "Unauthorized: missing GitHub access token" },
      { status: 401 }
    );
  }

  const profileResult = await safeGitHubFetch(accessToken, "/user");
  const login = profileResult?.data?.login;

  if (!login) {
    return NextResponse.json(
      { error: "Unable to resolve GitHub profile for this session", details: profileResult?.error },
      { status: 400 }
    );
  }

  const [
    rateLimit,
    repos,
    notifications,
    orgs,
    starred,
    events,
    authoredPrs,
    assignedIssues,
  ] = await Promise.all([
    safeGitHubFetch(accessToken, "/rate_limit"),
    safeGitHubFetch(accessToken, "/user/repos?sort=updated&per_page=10"),
    safeGitHubFetch(accessToken, "/notifications?all=true&participating=false&per_page=10"),
    safeGitHubFetch(accessToken, "/user/orgs?per_page=10"),
    safeGitHubFetch(accessToken, "/user/starred?per_page=10"),
    safeGitHubFetch(accessToken, `/users/${encodeURIComponent(login)}/events?per_page=15`),
    safeGitHubFetch(
      accessToken,
      `/search/issues?q=${encodeURIComponent(`is:pr is:open author:${login}`)}&per_page=10`
    ),
    safeGitHubFetch(
      accessToken,
      `/search/issues?q=${encodeURIComponent(`is:issue is:open assignee:${login}`)}&per_page=10`
    ),
  ]);

  const sections = {
    profile: profileResult,
    rateLimit,
    repos,
    notifications,
    organizations: orgs,
    starred,
    events,
    authoredPrs,
    assignedIssues,
  };

  const errors = Object.entries(sections)
    .filter(([, value]) => !value?.ok)
    .map(([key, value]) => ({
      section: key,
      status: value?.status,
      error: value?.error,
    }));

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    login,
    data: {
      profile: profileResult?.data || null,
      rateLimit: rateLimit?.data || null,
      repos: repos?.data || [],
      notifications: notifications?.data || [],
      organizations: orgs?.data || [],
      starred: starred?.data || [],
      events: events?.data || [],
      authoredPrs: authoredPrs?.data?.items || [],
      assignedIssues: assignedIssues?.data?.items || [],
    },
    errors,
  });
}
