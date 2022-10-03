// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import type { AuthorizationCode, Token } from 'oauth2-server';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

type OAuthAccessTokenDocument = Pick<
  Token,
  'accessToken' | 'accessTokenExpiresAt' | 'scope'
> & {
  _id: Token['accessToken'];
  client_id: AuthorizationCode['client']['id'];
  user_id: AuthorizationCode['user']['id'];
};

type OAuthClientDocument = AuthorizationCode['client'] & {
  _id: AuthorizationCode['client']['id'];
  secret: string;
};

type OAuthCodeDocument = Pick<
  AuthorizationCode,
  'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope'
> & {
  _id: AuthorizationCode['authorizationCode'];
  client_id: AuthorizationCode['client']['id'];
  user_id: AuthorizationCode['user']['id'];
};

type OAuthRefreshTokenDocument = Required<
  Pick<Token, 'refreshToken' | 'refreshTokenExpiresAt' | 'scope'>
> & {
  _id: Token['refreshToken'];
  client_id: AuthorizationCode['client']['id'];
  user_id: AuthorizationCode['user']['id'];
};

type UserDocument = {
  email: string;
  emailVerified?: Date;
  handle: string;
  image?: string;
  name?: string;
};

const getOAuthAccessTokens = async () =>
  (await clientPromise)
    .db()
    .collection<OAuthAccessTokenDocument>('oauth_tokens');
const getOAuthClients = async () =>
  (await clientPromise).db().collection<OAuthClientDocument>('oauth_clients');
const getOAuthCodes = async () =>
  (await clientPromise).db().collection<OAuthCodeDocument>('oauth_codes');
const getOAuthRefreshTokens = async () =>
  (await clientPromise)
    .db()
    .collection<OAuthRefreshTokenDocument>('oauth_tokens');
const getUsers = async () =>
  (await clientPromise).db().collection<UserDocument>('users');

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export {
  clientPromise,
  getOAuthAccessTokens,
  getOAuthClients,
  getOAuthCodes,
  getOAuthRefreshTokens,
  getUsers,
  type OAuthAccessTokenDocument,
  type OAuthClientDocument,
  type OAuthCodeDocument,
  type OAuthRefreshTokenDocument,
  type UserDocument,
};
