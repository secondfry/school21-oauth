import { endpointAuthenticate } from '$src/lib/endpoints/oauth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = endpointAuthenticate;
