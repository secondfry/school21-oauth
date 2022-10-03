import { redirect } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import OAuth2Server from 'oauth2-server';

import type { MySession } from '$src/lib/endpoints/nextAuthSvelteHandler';
import { log_O } from '$src/lib/logger';
import { getHeaders, getQuery, parseBody } from '$src/lib/utils';
import { oAuthModel } from '$src/routes/api/oauth/model';
import { getUsers } from '$src/lib/mongodb';

const oauth = new OAuth2Server({
  model: oAuthModel,
});

type RequestAlike = Required<
  Pick<OAuth2Server.Request, 'body' | 'headers' | 'method' | 'query'>
> & {
  auth: MySession | null;
};

const getRequestAlike = async ({
  locals: { auth },
  request,
  url,
}: RequestEvent): Promise<RequestAlike> => ({
  body: await parseBody(request),
  headers: getHeaders(request),
  method: request.method,
  query: getQuery(url),
  auth,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logError = (event: RequestEvent, err: any) => {
  event.locals.logger.error({ err }, `${(err as Error).message}`);
  event.locals.logger.debug(`${log_O(err)}`);
};

const endpointAuthorize: RequestHandler = async (event) => {
  if (!event.locals.auth) {
    event.cookies.set('return', event.request.url, { path: '/' });
    throw redirect(307, `/api/auth`);
  }

  const request = new OAuth2Server.Request(await getRequestAlike(event));
  const response = new OAuth2Server.Response();

  const authenticateHandler = {
    handle: async function (request: RequestAlike) {
      const handle = request.auth?.user_handle;
      if (!handle) return null;
      const res = await (await getUsers()).findOne({ handle });
      return res;
    },
  };

  await oauth
    .authorize(request, response, {
      authenticateHandler,
    })
    .catch((err) => logError(event, err));

  if (response.status === 302 && response.headers?.location) {
    throw redirect(307, response.headers?.location);
  }

  return new Response('You should have been redirected...');
};

const endpointToken: RequestHandler = async (event) => {
  const request = new OAuth2Server.Request(await getRequestAlike(event));
  const response = new OAuth2Server.Response();

  await oauth.token(request, response).catch((err) => logError(event, err));

  return new Response(JSON.stringify(response.body), {
    headers: response.headers,
    status: response.status ?? 200,
  });
};

const endpointAuthenticate: RequestHandler = async (event) => {
  const request = new OAuth2Server.Request(await getRequestAlike(event));
  const response = new OAuth2Server.Response();

  const token = await oauth
    .authenticate(request, response)
    .catch((err) => logError(event, err));

  const data = token ? { user_id: token.user_id } : response.body;

  return new Response(JSON.stringify(data), {
    headers: response.headers,
    status: response.status ?? 200,
  });
};

export { endpointAuthenticate, endpointAuthorize, endpointToken };
