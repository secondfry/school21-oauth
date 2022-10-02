import type { Handle } from '@sveltejs/kit';
import cookie from 'cookie';

import { getServerSession } from '$lib/endpoints/nextAuthSvelteHandler';
import { authOptions } from '$src/routes/api/auth/[...nextauth]/+server';

export const getNextAuthSession: Handle = async ({ event, resolve }) => {
  const { body, cookies } = await getServerSession(event, authOptions);
  event.locals.auth = body;
  const response = await resolve(event);
  for (const { name, value, options } of cookies) {
    response.headers.append('Set-Cookie', cookie.serialize(name, value, options));
  }
  return response;
};
