import { endpointAuthorize } from '$src/lib/endpoints/oauth';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = endpointAuthorize;
