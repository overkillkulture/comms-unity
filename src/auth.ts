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

        const input = name.trim();
        const isEmail = input.includes('@') && input.includes('.');
        const username = input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-@.]/g, '');
        const email = isEmail ? input.toLowerCase() : `${username}@community.local`;

        // INVITE-ONLY: check input against allowlist before creating user
        if (process.env.INVITE_ONLY === 'true') {
          const allowList = (process.env.ALLOWED_USERS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
          if (allowList.length > 0) {
            const slugName = input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (!allowList.includes(email) && !allowList.includes(slugName) && !allowList.includes(input.toLowerCase())) {
              return null;
            }
          }
        }

        // Find by email first, then username
        let user = await prisma.user.findFirst({
          where: isEmail ? { email } : { username },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              username: isEmail ? email.split('@')[0] : username,
              name: isEmail ? email.split('@')[0] : input,
              email,
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
    async signIn({ user, account }): Promise<boolean> {
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
        return false;
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
