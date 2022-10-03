import OAuth2Server from 'oauth2-server';

import { AuthLogger, log_O } from '$src/lib/logger';
import { oAuthModel } from '$src/routes/api/oauth/model';

import type { RequestEvent, RequestHandler } from './$types';
import { getHeaders, getQuery, parseBody } from '$src/lib/utils';

const oauth = new OAuth2Server({
  model: oAuthModel,
});

const getRequest = async ({
  request,
  url,
}: RequestEvent): Promise<
  Required<Pick<OAuth2Server.Request, 'body' | 'headers' | 'method' | 'query'>>
> => ({
  body: await parseBody(request),
  headers: getHeaders(request),
  method: request.method,
  query: getQuery(url),
});

export const GET: RequestHandler = async (event) => {
  const request = new OAuth2Server.Request(await getRequest(event));
  const response = new OAuth2Server.Response();
  const token = await oauth.authenticate(request, response);

  AuthLogger.info({ request }, `request: ${log_O(request)}`);
  AuthLogger.info({ response }, `response: ${log_O(response)}`);
  AuthLogger.info({ token }, `token: ${log_O(token)}`);

  return new Response('OK');
};
