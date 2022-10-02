import { redirect, type RequestEvent } from '@sveltejs/kit';
import cookie from 'cookie';
import type { NextAuthOptions } from 'next-auth';
import { NextAuthHandler } from 'next-auth/core';
import type { NextAuthAction } from 'next-auth/core/types';

import { AuthLogger, log_O } from '$src/lib/logger';

type Params = {
  nextauth: string
};

// NOTE(secondfry): Error: Missing "./utils/detect-host" export in "next-auth" package
const detectHost = (forwardedHost: string | null) => {
  if (process.env.VERCEL) return forwardedHost ?? undefined;
  return process.env.NEXTAUTH_URL;
};

const parseCookies = (cookieString: string | null) => {
  if (!cookieString) return undefined;
  return cookie.parse(cookieString);
};

const expectsJSON = (request: Request) => {
  const accept = request.headers.get('Accept');
  if (!accept) return false;

  const parts = accept.split(',');
  for (const mime of parts) {
    if (mime.toLowerCase().search('application/json') !== -1) return true;
  }

  return false;
}

const parseBody = async (request: Request) => {
  const body = await request.text();

  try {
    return JSON.parse(body);
  } catch {}
  try {
    return Object.fromEntries(new URLSearchParams(body).entries());
  } catch {}

  return body;
};

const NextAuthSvelteHandler = async (event: RequestEvent<Params>, authOptions: NextAuthOptions) => {
  if (!event.params.nextauth) {
    throw redirect(307, '/api/auth/signin');
  }

  const routeParams = event.params.nextauth.split('/');
  AuthLogger.debug({ routeParams }, `routeParams: ${log_O(routeParams)}`);
  const body = await parseBody(event.request);
  AuthLogger.debug({ body }, `body: ${log_O(body)}`);
  const cookies = parseCookies(event.request.headers.get('cookie'));
  AuthLogger.debug({ cookies }, `cookies: ${log_O(cookies)}`);
  const query = Object.fromEntries(event.url.searchParams.entries());
  AuthLogger.debug({ query }, `query: ${log_O(query)}`);

  authOptions.secret = authOptions.secret ?? authOptions.jwt?.secret ?? process.env.NEXTAUTH_SECRET;

  // NOTE(secondfry): IDK if string generic is proper here.
  const nextAuthResponse = await NextAuthHandler<string>({
    req: {
      host: detectHost(event.request.headers.get('x-forwarded-host')),
      body,
      query,
      cookies,
      headers: Object.fromEntries(event.request.headers.entries()),
      method: event.request.method,
      action: routeParams?.[0] as NextAuthAction,
      providerId: routeParams?.[1],
      error: event.url.searchParams.get('error') ?? routeParams?.[1],
    },
    options: authOptions,
  });

  AuthLogger.debug({ nextAuthResponse }, `nextAuthResponse: ${log_O(nextAuthResponse)}`);

  // NOTE(next-auth): response.headers?.forEach((h) => res.setHeader(h.key, h.value));
  const headers =
    nextAuthResponse.headers?.map((nextAuthHeader) => [nextAuthHeader.key, nextAuthHeader.value]) ??
    [];
  // NOTE(next-auth): response.cookies?.forEach((cookie) => setCookie(res, cookie));
  nextAuthResponse.cookies?.map(({ name, value, options }) =>
    headers.push(['Set-Cookie', cookie.serialize(name, value, options)]),
  );

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

export {
  NextAuthSvelteHandler
};