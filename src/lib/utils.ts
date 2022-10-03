import cookie from 'cookie';

const getCookies = (request: Request) =>
  parseCookies(request.headers.get('cookie'));
const getHeaders = (request: Request) =>
  Object.fromEntries(request.headers.entries());
const getHost = (request: Request) =>
  detectHost(request.headers.get('x-forwarded-host'));
const getQuery = (url: URL) => Object.fromEntries(url.searchParams.entries());

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
};

const parseBody = async (request: Request) => {
  const body = await request.text();

  try {
    return JSON.parse(body);
  } catch {
    /* noop */
  }
  try {
    return Object.fromEntries(new URLSearchParams(body).entries());
  } catch {
    /* noop */
  }

  return body;
};

export {
  expectsJSON,
  getCookies,
  getHeaders,
  getHost,
  getQuery,
  parseBody,
  parseCookies,
};
