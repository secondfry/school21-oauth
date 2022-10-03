import type { Handle } from '@sveltejs/kit';

import { RequestLogger } from '$src/lib/logger';

export const logger: Handle = async ({ event, resolve }) => {
  const timestamp = Date.now();
  event.locals.logger = RequestLogger;
  const response = await resolve(event);
  const elapsed = Date.now() - timestamp;
  RequestLogger.info(
    { elapsed, request: event.request, response },
    `${event.request.method} ${event.request.url} ${response.status} ${elapsed}ms`,
  );
  return response;
};
