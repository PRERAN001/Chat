import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github";
import User from "@/model/user.model";
import connectDB from "@/lib/db";

const fetchGitHub = async (accessToken, path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
};

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo notifications read:org",
        },
      },
    })
  ],
  pages: {
    signIn: "/signin" 
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      await connectDB();

      if (account?.provider === "github" && account?.access_token) {
        token.accessToken = account.access_token;

        const githubUser = await fetchGitHub(account.access_token, "/user");
        const githubEmails = await fetchGitHub(account.access_token, "/user/emails");

        const primaryEmail = Array.isArray(githubEmails)
          ? githubEmails.find((item) => item?.primary && item?.verified)?.email ||
            githubEmails.find((item) => item?.verified)?.email ||
            githubEmails[0]?.email
          : undefined;

        const fallbackEmail =
          primaryEmail ||
          githubUser?.email ||
          profile?.email ||
          token?.email ||
          (githubUser?.login ? `${githubUser.login}@users.noreply.github.com` : undefined);

        const resolvedName =
          githubUser?.name ||
          profile?.name ||
          githubUser?.login ||
          token?.name ||
          "Developer";

        const resolvedPicture =
          githubUser?.avatar_url ||
          profile?.avatar_url ||
          profile?.picture ||
          token?.picture ||
          "https://avatars.githubusercontent.com/u/583231?v=4";

        token.id = String(githubUser?.id || profile?.id || token?.sub || token?.id || "");
        token.name = resolvedName;
        token.email = fallbackEmail;
        token.picture = resolvedPicture;
        token.github = {
          login: githubUser?.login,
          nodeId: githubUser?.node_id,
          company: githubUser?.company,
          location: githubUser?.location,
          blog: githubUser?.blog,
          twitterUsername: githubUser?.twitter_username,
          followers: githubUser?.followers,
          following: githubUser?.following,
          publicRepos: githubUser?.public_repos,
          publicGists: githubUser?.public_gists,
          hireable: githubUser?.hireable,
          bio: githubUser?.bio,
          profileUrl: githubUser?.html_url,
          createdAt: githubUser?.created_at,
          updatedAt: githubUser?.updated_at,
        };

        if (fallbackEmail) {
          await User.findOneAndUpdate(
            { email: fallbackEmail },
            {
              $set: {
                idd: String(githubUser?.id || profile?.id || token?.sub || token?.id || fallbackEmail),
                name: resolvedName,
                email: fallbackEmail,
                profilepic: resolvedPicture,
                githubLogin: githubUser?.login || null,
                githubId: githubUser?.id ? String(githubUser.id) : null,
                githubProfileUrl: githubUser?.html_url || null,
                company: githubUser?.company || null,
                location: githubUser?.location || null,
                blog: githubUser?.blog || null,
                twitterUsername: githubUser?.twitter_username || null,
                followers: typeof githubUser?.followers === "number" ? githubUser.followers : null,
                following: typeof githubUser?.following === "number" ? githubUser.following : null,
                publicRepos: typeof githubUser?.public_repos === "number" ? githubUser.public_repos : null,
                publicGists: typeof githubUser?.public_gists === "number" ? githubUser.public_gists : null,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;

      session.accessToken = token.accessToken;
      session.github = token.github;

      return session;
    }
  }
}


const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }