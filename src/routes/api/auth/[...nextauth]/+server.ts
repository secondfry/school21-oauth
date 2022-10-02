import type { NextAuthOptions } from 'next-auth';
import EcoleProvider from 'next-auth/providers/42-school';

import { NextAuthSvelteHandler } from '$src/lib/endpoints/nextAuthSvelteHandler';
import { AuthLogger, log_O } from '$src/lib/logger';

import type { RequestHandler } from './$types';

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    EcoleProvider({
      clientId: process.env.ECOLE_ID ?? '',
      clientSecret: process.env.ECOLE_SECRET ?? '',
    }),
    // ...add more providers here
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // TODO(secondfry): dump profile somewhere.
      // AuthLogger.info(`profile: ${log_O(profile)}`);
      AuthLogger.info(`email: ${log_O(email)}`);
      return true;
    },
  },
};

export const GET: RequestHandler = async (event) => await NextAuthSvelteHandler(event, authOptions);
export const POST: RequestHandler = async (event) =>
  await NextAuthSvelteHandler(event, authOptions);
