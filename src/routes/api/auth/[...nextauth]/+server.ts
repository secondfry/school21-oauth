import type { NextAuthOptions } from 'next-auth';
import EcoleProvider from 'next-auth/providers/42-school';

import { NextAuthSvelteHandler } from '$src/lib/nextAuthSvelteHandler';

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
};

export const GET: RequestHandler = async (event) => await NextAuthSvelteHandler(event, authOptions);
export const POST: RequestHandler = async (event) => await NextAuthSvelteHandler(event, authOptions);
