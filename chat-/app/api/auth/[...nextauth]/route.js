import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import User from "@/model/user.model";
import connectDB from "@/lib/db";
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET
  })
  ],
  pages: {
    signIn: "/signin" 
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      await connectDB()
      if (account && profile) {
        console.log("PROFILE ", profile);
        console.log("accountt",account)

        token.accessToken = account.access_token;

        
        token.id = profile.sub || profile.id;
        token.name = profile.name;
        token.email = profile.email;
        token.picture = profile.picture || profile.avatar_url;
        const user = await User.findOne({ email: profile.email });
        if (!user) {
          await User.create({
                idd:profile.sub || profile.id,
                name: profile.name,
                email: profile.email,
                profilepic: profile.picture || profile.avatar_url               
            });
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

      return session;
    }
  }
}


const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }