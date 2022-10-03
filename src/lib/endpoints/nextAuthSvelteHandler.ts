import { redirect, type RequestEvent } from '@sveltejs/kit';
import cookie from 'cookie';
import type { NextAuthOptions } from 'next-auth';
import { NextAuthHandler } from 'next-auth/core';
import type { NextAuthAction, Session } from 'next-auth/core/types';

import { AuthLogger, log_O } from '$src/lib/logger';
import {
  expectsJSON,
  getCookies,
  getHeaders,
  getHost,
  getQuery,
  parseBody,
} from '$src/lib/utils';

type Params = {
  nextauth: string;
};

const NEXT_AUTH_SESSION_TOKEN = 'next-auth.session-token';

const NextAuthSvelteHandler = async (
  event: RequestEvent<Params>,
  authOptions: NextAuthOptions,
) => {
  if (!event.params.nextauth) {
    throw redirect(307, '/api/auth/signin');
  }

  const routeParams = event.params.nextauth.split('/');
  AuthLogger.debug({ routeParams }, `routeParams: ${log_O(routeParams)}`);
  const body = await parseBody(event.request);
  AuthLogger.debug({ body }, `body: ${log_O(body)}`);
  const cookies = getCookies(event.request);
  AuthLogger.debug({ cookies }, `cookies: ${log_O(cookies)}`);
  const query = getQuery(event.url);
  AuthLogger.debug({ query }, `query: ${log_O(query)}`);

  authOptions.secret =
    authOptions.secret ??
    authOptions.jwt?.secret ??
    process.env.NEXTAUTH_SECRET;

  // NOTE(secondfry): IDK if string generic is proper here.
  const nextAuthResponse = await NextAuthHandler<string>({
    req: {
      action: routeParams?.[0] as NextAuthAction,
      body,
      cookies,
      error: event.url.searchParams.get('error') ?? routeParams?.[1],
      headers: getHeaders(event.request),
      host: getHost(event.request),
      method: event.request.method,
      providerId: routeParams?.[1],
      query,
    },
    options: authOptions,
  });

  AuthLogger.debug(
    { nextAuthResponse },
    `nextAuthResponse: ${log_O(nextAuthResponse)}`,
  );

  // NOTE(next-auth): response.headers?.forEach((h) => res.setHeader(h.key, h.value));
  const headers: [string, string][] =
    nextAuthResponse.headers?.map((nextAuthHeader) => [
      nextAuthHeader.key,
      nextAuthHeader.value,
    ]) ?? [];
  // NOTE(next-auth): response.cookies?.forEach((cookie) => setCookie(res, cookie));
  nextAuthResponse.cookies?.map(({ name, value, options }) => {
    headers.push(['Set-Cookie', cookie.serialize(name, value, options)]);

    if (name === NEXT_AUTH_SESSION_TOKEN)
      event.locals.sessionTokenHasBeenSet = true;
  });

  // NOTE(next-auth):
  // if (response.redirect) {
  //   // If the request expects a return URL, send it as JSON
  //   // instead of doing an actual redirect.
  //   if (req.body?.json !== 'true') {
  //     // Could chain. .end() when lowest target is Node 14
  //     // https://github.com/nodejs/node/issues/33148
  //     res.status(302).setHeader('Location', response.redirect);
  //     return res.end();
  //   }
  //   return res.json({ url: response.redirect });
  // }
  if (nextAuthResponse.redirect) {
    if (expectsJSON(event.request)) {
      return new Response(JSON.stringify({ url: nextAuthResponse.redirect }), {
        status: nextAuthResponse.status ?? 200,
        headers,
      });
    }

    headers.push(['Location', nextAuthResponse.redirect]);
    return new Response(null, {
      status: 302,
      headers,
    });
  }

  return new Response(nextAuthResponse.body, {
    // NOTE(next-auth): res.status(response.status ?? 200);
    status: nextAuthResponse.status ?? 200,
    headers,
  });
};

const getServerSession = async (
  { request }: RequestEvent,
  authOptions: NextAuthOptions,
) => {
  authOptions.secret =
    authOptions.secret ??
    authOptions.jwt?.secret ??
    process.env.NEXTAUTH_SECRET;

  const session = await NextAuthHandler<Session>({
    options: authOptions,
    req: {
      action: 'session',
      cookies: getCookies(request),
      headers: getHeaders(request),
      host: getHost(request),
      method: 'GET',
    },
  });

  const { body, cookies = [], status = 200 } = session;

  if (body && typeof body !== 'string' && Object.keys(body).length) {
    if (status === 200)
      return {
        body,
        cookies,
      };
    throw new Error((body as unknown as Error).message);
  }

  return {
    body: null,
    cookies,
  };
};

export { NEXT_AUTH_SESSION_TOKEN, getServerSession, NextAuthSvelteHandler };
