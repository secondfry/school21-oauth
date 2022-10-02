import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import dotenv from 'dotenv';

import { getNextAuthSession } from '$lib/middlewares/getNextAuthSession';

dotenv.config();

export const handle: Handle = sequence(getNextAuthSession, async ({ event, resolve }) => {
  const response = await resolve(event);
  return response;
});
