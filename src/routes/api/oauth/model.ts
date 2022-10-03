import {
  getOAuthAccessTokens,
  getOAuthClients,
  getOAuthCodes,
  getOAuthRefreshTokens,
  getUsers,
  type OAuthClientDocument,
} from '$src/lib/mongodb';
import type { Filter } from 'mongodb';
import type OAuth2Server from 'oauth2-server';

const oAuthModel: OAuth2Server.AuthorizationCodeModel &
  OAuth2Server.RefreshTokenModel = {
  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#generateaccesstoken-client-user-scope-callback
   * This model function is optional. If not implemented, a default handler
   * is used that generates access tokens consisting of 40 characters
   * in the range of `a..z0..9`.
   */
  // generateAccessToken: (client, user, scope) => {},

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#generaterefreshtoken-client-user-scope-callback
   * This model function is optional. If not implemented, a default handler
   * is used that generates access tokens consisting of 40 characters
   * in the range of `a..z0..9`.
   */
  // generateRefreshToken: (client, user, scope) => {},

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#generateauthorizationcode-client-user-scope-callback
   * This model function is optional. If not implemented, a default handler
   * is used that generates access tokens consisting of 40 characters
   * in the range of `a..z0..9`.
   */
  // generateAuthorizationCode: (client, user, scope) => {},

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken-callback
   * This model function is required if OAuth2Server#authenticate() is used.
   */
  getAccessToken: async (accessToken) => {
    const token = await (
      await getOAuthAccessTokens()
    ).findOne({ _id: accessToken });
    if (!token) return null;
    const [client, user] = await Promise.all([
      (await getOAuthClients()).findOne({ _id: token.client_id }),
      (await getUsers()).findOne({ handle: token.user_id }),
    ]);
    if (!client) return null;
    if (!user) return null;
    const result: OAuth2Server.Token = {
      ...token,
      client,
      user,
    };
    delete result.client.secret;
    return result;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken-callback
   * This model function is required if OAuth2Server#authenticate() is used.
   */
  getRefreshToken: async (refreshToken) => {
    const token = await (
      await getOAuthRefreshTokens()
    ).findOne({ _id: refreshToken });
    if (!token) return null;
    const [client, user] = await Promise.all([
      (await getOAuthClients()).findOne({ _id: token.client_id }),
      (await getUsers()).findOne({ handle: token.user_id }),
    ]);
    if (!client) return null;
    if (!user) return null;
    const result: OAuth2Server.RefreshToken = {
      ...token,
      client,
      user,
    };
    delete result.client.secret;
    return result;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getauthorizationcode-authorizationcode-callback
   * This model function is required if the authorization_code grant is used.
   */
  getAuthorizationCode: async (authorizationCode) => {
    const code = await (
      await getOAuthCodes()
    ).findOne({ _id: authorizationCode });
    if (!code) return null;
    const [client, user] = await Promise.all([
      (await getOAuthClients()).findOne({ _id: code.client_id }),
      (await getUsers()).findOne({ handle: code.user_id }),
    ]);
    if (!client) return null;
    if (!user) return null;
    const result: OAuth2Server.AuthorizationCode = {
      ...code,
      client,
      user,
    };
    delete result.client.secret;
    return result;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getclient-clientid-clientsecret-callback
   * This model function is required for all grant types.
   */
  getClient: async (clientId, clientSecret) => {
    const query: Filter<OAuthClientDocument> = {
      _id: clientId,
    };
    if (clientSecret) {
      query.secret = clientSecret;
    }

    const client = await (await getOAuthClients()).findOne(query);
    if (!client) return null;
    const result: OAuth2Server.Client = { ...client };
    delete result.secret;
    return result;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#revoketoken-token-callback
   * This model function is required if the refresh_token grant is used.
   */
  revokeToken: async (token) => {
    const res = await (
      await getOAuthRefreshTokens()
    ).deleteOne({ _id: token.refreshToken });
    if (res.deletedCount) return true;
    return false;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#savetoken-token-client-user-callback
   * This model function is required for all grant types.
   */
  saveToken: async (token, client, user) => {
    await Promise.all([
      (
        await getOAuthAccessTokens()
      ).findOneAndUpdate(
        { _id: token.accessToken },
        {
          $set: {
            _id: token.accessToken,
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            scope: token.scope,
            client_id: client.id,
            user_id: user.handle,
          },
        },
        { upsert: true },
      ),
      (
        await getOAuthRefreshTokens()
      ).findOneAndUpdate(
        { _id: token.refreshToken },
        {
          $set: {
            _id: token.refreshToken,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            scope: token.scope,
            client_id: client.id,
            user_id: user.handle,
          },
        },
        { upsert: true },
      ),
    ]);
    return {
      ...token,
      client: { ...client },
      user: { ...user },
    };
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user-callback
   * This model function is required if the authorization_code grant is used.
   */
  saveAuthorizationCode: async (code, client, user) => {
    (await getOAuthCodes()).findOneAndUpdate(
      { _id: code.authorizationCode },
      {
        $set: {
          ...code,
          _id: code.authorizationCode,
          client_id: client.id,
          user_id: user.handle,
        },
      },
      { upsert: true },
    );
    return {
      ...code,
      client: { ...client },
      user: { ...user },
    };
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user-callback
   * This model function is required if the authorization_code grant is used.
   */
  revokeAuthorizationCode: async (code) => {
    const res = await (
      await getOAuthCodes()
    ).deleteOne({ _id: code.authorizationCode });
    if (res.deletedCount) return true;
    return false;
  },

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user-callback
   * This model function is optional. If not implemented, any scope is accepted.
   */
  // validateScope(user, client, scope) => {},

  /**
   * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#verifyscope-accesstoken-scope-callback
   * This model function is required if scopes are used with OAuth2Server#authenticate().
   */
  verifyScope: async (token, scope) => {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = Array.isArray(scope) ? scope : scope.split(' ');
    const authorizedScopes = Array.isArray(token.scope)
      ? token.scope
      : token.scope.split(' ');
    return requestedScopes.every((s) => authorizedScopes.indexOf(s) >= 0);
  },
};

export { oAuthModel };
