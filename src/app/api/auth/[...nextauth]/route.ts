import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // 더미 인증: 항상 성공
        return { id: "1", name: credentials?.username || "user" };
      }
    })
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
