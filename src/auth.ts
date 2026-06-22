import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from '@/auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma/prisma';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string };
  }
}

export const {
  auth,
  handlers: { GET, POST },
  signIn,
} = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    // Quick-entry login: just type a name and you're in
    Credentials({
      id: 'quick-entry',
      name: 'Quick Entry',
      credentials: {
        name: { label: 'Your Name', type: 'text', placeholder: 'Enter any name to join' },
      },
      async authorize(credentials) {
        const name = credentials?.name as string;
        if (!name || name.trim().length < 1) return null;

        const username = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Find or create user by username
        let user = await prisma.user.findFirst({
          where: { username },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              username,
              name: name.trim(),
              email: `${username}@community.local`,
            },
          });
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // INVITE-ONLY MODE: only whitelisted users can sign in
      if (process.env.INVITE_ONLY === 'true') {
        const allowList = (process.env.ALLOWED_USERS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        // If no allowlist configured, let everyone in (fail-open for setup)
        if (allowList.length === 0) return true;
        const email = (user.email || '').toLowerCase();
        const name = (user.name || '').toLowerCase().replace(/\s+/g, '-');
        // Check email, username-style name, or GitHub username
        const githubUsername = (account?.providerAccountId || '').toLowerCase();
        if (allowList.includes(email) || allowList.includes(name) || allowList.includes(githubUsername)) {
          return true;
        }
        // Block with message
        return '/login?error=InviteOnly';
      }
      return true;
    },
    session({ token, user, ...rest }) {
      return {
        user: {
          id: token.sub!,
        },
        expires: rest.session.expires,
      };
    },
  },
});
