import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import dotenv from 'dotenv';

import { getNextAuthSession } from '$lib/middlewares/getNextAuthSession';
import { logger } from '$src/lib/middlewares/logger';

dotenv.config();

export const handle: Handle = sequence(
  logger,
  getNextAuthSession,
  async ({ event, resolve }) => {
    const response = await resolve(event);
    return response;
  },
);
