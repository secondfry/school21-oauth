import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import type { NextAuthOptions } from 'next-auth';
import type EcoleProviderType from 'next-auth/providers/42-school';
import type EmailProviderType from 'next-auth/providers/email';

import { NextAuthSvelteHandler } from '$lib/endpoints/nextAuthSvelteHandler';
import { clientPromise } from '$lib/mongodb';

import type { RequestHandler } from './$types';

// NOTE(secondfry): `next-auth` is cursed.
// Works in development, fails in production.
// You may find yourself lost in sveltekit/vite/rollup/esbuild/typescript build systems.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const forceDefault = <T>(module: any): T => {
  while (module.default) module = module.default;
  return module;
};
const EcoleProvider = forceDefault<typeof EcoleProviderType>(
  await import('next-auth/providers/42-school'),
);
const EmailProvider = forceDefault<typeof EmailProviderType>(
  await import('next-auth/providers/email'),
);

const adapter = MongoDBAdapter(clientPromise);
const _createUser = adapter.createUser;
adapter.createUser = (data) => {
  if (!data.handle && data.email) {
    const email = data.email as string;
    if (email.endsWith('@student.21-school.ru'))
      data.handle = email.split('@')[0];
    if (email.endsWith('@21-school.ru'))
      data.handle = `staff-${email.split('@')[0]}`;
  }

  return _createUser(data);
};

export const authOptions: NextAuthOptions = {
  adapter,
  // Configure one or more authentication providers
  providers: [
    EcoleProvider({
      clientId: process.env.ECOLE_ID ?? '',
      clientSecret: process.env.ECOLE_SECRET ?? '',
      profile: (profile) => ({
        data: profile,
        email: profile.email,
        handle: profile.login,
        id: profile.login,
        image: profile.image_url,
        name: profile.displayname,
      }),
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    // ...add more providers here
  ],
  callbacks: {
    async signIn({ account, email }) {
      if (!email?.verificationRequest) {
        return true;
      }

      if (
        account?.userId?.endsWith('@student.21-school.ru') ||
        account?.userId?.endsWith('@21-school.ru')
      ) {
        return true;
      }

      return false;
    },
    async session({ session, user }) {
      session.user_handle = user.handle;
      return session;
    },
  },
};

export const GET: RequestHandler = async (event) =>
  await NextAuthSvelteHandler(event, authOptions);
export const POST: RequestHandler = async (event) =>
  await NextAuthSvelteHandler(event, authOptions);
