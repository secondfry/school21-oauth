import type { Handle } from '@sveltejs/kit';
import cookie from 'cookie';

import {
  getServerSession,
  NEXT_AUTH_SESSION_TOKEN,
} from '$lib/endpoints/nextAuthSvelteHandler';
import { authOptions } from '$src/routes/api/auth/[...nextauth]/+server';

export const getNextAuthSession: Handle = async ({ event, resolve }) => {
  const { body, cookies } = await getServerSession(event, authOptions);
  event.locals.auth = body;
  const response = await resolve(event);
  for (const { name, value, options } of cookies) {
    if (name === NEXT_AUTH_SESSION_TOKEN && event.locals.sessionTokenHasBeenSet)
      continue;
    response.headers.append(
      'Set-Cookie',
      cookie.serialize(name, value, options),
    );
  }
  return response;
};
