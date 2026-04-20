import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
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
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  pages: {
    signIn: "/signin" 
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow callback URLs on the same origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Redirect to dashboard after sign-in
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },

    async jwt({ token, account, profile }) {
      try {
        await connectDB();
      } catch (error) {
        console.error("[auth:db-connection-error]", error);
        return token;
      }

      if (account?.provider === "github" && account?.access_token) {
        token.accessToken = account.access_token;
        token.provider = "github";

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
          try {
            await User.findOneAndUpdate(
              { email: fallbackEmail },
              {
                $set: {
                  idd: String(githubUser?.id || profile?.id || token?.sub || token?.id || fallbackEmail),
                  name: resolvedName,
                  email: fallbackEmail,
                  profilepic: resolvedPicture,
                  authProvider: "github",
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
          } catch (error) {
            console.error("[auth:github:db-error]", error);
          }
        }
      } else if (account?.provider === "google") {
        token.provider = "google";
        token.id = profile?.sub || token?.sub;
        token.name = profile?.name || token?.name;
        token.email = profile?.email || token?.email;
        
        // Use Google's profile picture or generate avatar using name/email as seed
        const googlePicture = profile?.image || profile?.picture;
        const seed = profile?.name || profile?.email || "User";
        token.picture = googlePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

        if (token.email && token.name && token.id) {
          try {
            await User.findOneAndUpdate(
              { email: token.email },
              {
                $set: {
                  idd: String(token.id),
                  name: token.name,
                  email: token.email,
                  profilepic: token.picture,
                  authProvider: "google",
                  googleId: String(token.id),
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (error) {
            console.error("[auth:google:db-error]", error);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      session.user.provider = token.provider;

      session.accessToken = token.accessToken;
      session.github = token.github;
      session.provider = token.provider;

      return session;
    }
  }
}


const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }