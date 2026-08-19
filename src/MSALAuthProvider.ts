// deno-lint-ignore-file no-explicit-any
import {
  type AccountInfo,
  type AuthorizationCodePayload,
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
  type Configuration,
  getPackageLogger,
  msal,
  redirectRequest,
} from "./src.deps.ts";
import type { MSALAcquireTokenOptions } from "./MSALAcquireTokenOptions.ts";
import type { MSALSignInOptions } from "./MSALSignInOptions.ts";
import type { MSALSignOutOptions } from "./MSALSignOutOptions.ts";
import type { MSALSessionDataLoader } from "./plugins/MSALSessionDataLoader.ts";

// From: https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-nodejs-webapp-msal
// TODO: encrypt/decrypt keys... use crypto.subtle.*

export class MSALAuthProvider {
  constructor(
    protected msalConfig: Configuration,
    protected cryptoProvider: msal.CryptoProvider,
    protected denoKv: Deno.Kv,
  ) {}

  //#region API Methods
  public async AcquireToken(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
    options: MSALAcquireTokenOptions,
  ): Promise<Response> {
    try {
      const msalInstance = this.getMsalInstance();

      let idToken = (await sessionDataLoader.Load(req, "idToken")) as string;

      /**
       * If a token cache exists in the session, deserialize it and set it as the
       * cache for the new MSAL CCA instance. For more, see:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
       */
      const tokenCache = (
        await this.denoKv.get(["MSAL", "UserData", idToken, "TokenCache"])
      ).value as string;

      if (tokenCache) {
        msalInstance.getTokenCache().deserialize(tokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({
        account: (
          await this.denoKv.get(["MSAL", "UserData", idToken, "AccessToken"])
        ).value as AccountInfo,
        scopes: options.Scopes || [],
      });

      idToken = tokenResponse.idToken;

      await sessionDataLoader.Set(req, "idToken", idToken);

      /**
       * 🔴 WAS `"accessToken"` (lowercase) — A KEY NOTHING READS.
       *
       * Every reader and every other writer uses `"AccessToken"`
       * (`HandleCallback` and the refresh path). So a silent refresh through
       * `/azure/oauth/acquire-token` wrote a DEAD key and left the real one to
       * expire on its own schedule — the session looked refreshed and was not.
       *
       * ⚠️ ⛔ Do NOT conflate this with the `["MSAL","UserData",idToken,
       * "AccessToken"]` KV path elsewhere in this file: that is a different
       * namespace, and it was never wrong.
       */
      await sessionDataLoader.Set(
        req,
        "AccessToken",
        tokenResponse.accessToken,
      );

      /**
       * On successful token acquisition, write the updated token
       * cache back to the session. For more, see:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
       */
      await this.denoKv
        .atomic()
        .set(
          ["MSAL", "UserData", idToken, "TokenCache"],
          msalInstance.getTokenCache().serialize(),
          {
            expireIn: 1000 * 60 * 30,
          },
        )
        .set(["MSAL", "UserData", idToken, "Account"], tokenResponse.account, {
          expireIn: 1000 * 60 * 30,
        })
        .set(
          ["MSAL", "UserData", idToken, "AccessToken"],
          tokenResponse.accessToken,
          {
            expireIn: 1000 * 60 * 30,
          },
        )
        .commit();

      return redirectRequest(options.SuccessRedirect, false, false);
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        return await this.SignIn(req, sessionDataLoader, options);
      }

      throw error;
    }
  }

  public async GetAccessToken(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
  ): Promise<string> {
    return (
      await this.denoKv.get([
        "MSAL",
        "UserData",
        await sessionDataLoader.Load(req, "idToken"),
        "AccessToken",
      ])
    ).value as string;
  }

  public async HandleCallback(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
    payload: AuthorizationCodePayload,
  ): Promise<Response> {
    if (!payload || !payload.state) {
      throw new Error("Error: respsonse not found");
    }

    const authCodeRequest = {
      ...(await sessionDataLoader.Load(req, "authCodeRequest")),
      code: payload.code,
      codeVerifier: (await sessionDataLoader.Load(req, "pkceCodes")).verifier,
    };

    try {
      const msalInstance = this.getMsalInstance();

      let idToken = (await sessionDataLoader.Load(req, "idToken")) as string;

      const tokenCache = idToken
        ? ((await this.denoKv.get(["MSAL", "UserData", idToken, "TokenCache"]))
          .value as string)
        : undefined;

      if (tokenCache) {
        msalInstance.getTokenCache().deserialize(tokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenByCode(
        authCodeRequest,
        payload,
      );

      idToken = tokenResponse.idToken;

      await sessionDataLoader.Set(req, "idToken", idToken);

      await sessionDataLoader.Set(
        req,
        "AccessToken",
        tokenResponse.accessToken,
      );

      await this.denoKv
        .atomic()
        .set(
          ["MSAL", "UserData", idToken, "TokenCache"],
          msalInstance.getTokenCache().serialize(),
          {
            expireIn: 1000 * 60 * 30,
          },
        )
        .set(["MSAL", "UserData", idToken, "Account"], tokenResponse.account, {
          expireIn: 1000 * 60 * 30,
        })
        .set(
          ["MSAL", "UserData", idToken, "AccessToken"],
          tokenResponse.accessToken,
          {
            expireIn: 1000 * 60 * 30,
          },
        )
        .commit();

      const state = JSON.parse(this.cryptoProvider.base64Decode(payload.state));

      return redirectRequest(state.successRedirect, false, false);
    } catch (error) {
      throw error;
    }
  }

  public async SignIn(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
    options: MSALSignInOptions,
  ): Promise<Response> {
    /**
     * MSAL Node library allows you to pass your custom state as state parameter in the Request object.
     * The state parameter can also be used to encode information of the app's state before redirect.
     * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
     */
    const state = this.cryptoProvider.base64Encode(
      JSON.stringify({
        successRedirect: options.SuccessRedirect || "/",
      }),
    );

    const authCodeUrlRequestParams: AuthorizationUrlRequest = {
      state: state,

      /**
       * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
       * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
       */
      scopes: options.Scopes || [],
      redirectUri: options.RedirectURI,

      /**
       * 🔑 TENANT-SCOPED SIGN-IN, LEG ONE. `@azure/msal-node` honours a
       * per-request `authority` on `getAuthCodeUrl`, so this is what sends the
       * user to the directory they picked rather than the configured one.
       *
       * ⛔ Spread conditionally: an `undefined` here is not the same as absent
       * to every msal version, and the whole point of `Authority?` being
       * optional is that an existing caller's behaviour is byte-unchanged.
       */
      ...(options.Authority ? { authority: options.Authority } : {}),
      ...(options.Prompt ? { prompt: options.Prompt } : {}),
      ...(options.DomainHint ? { domainHint: options.DomainHint } : {}),
    };

    const authCodeRequestParams: AuthorizationCodeRequest = {
      state: state,

      /**
       * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
       * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
       */
      scopes: options.Scopes || [],
      redirectUri: options.RedirectURI,
      code: "",

      /**
       * 🔴 LEG TWO, AND IT IS THE ONE THAT IS EASY TO MISS.
       *
       * `HandleCallback` rehydrates this stored `authCodeRequest` and feeds it
       * to `acquireTokenByCode`, which honours `validRequest.authority`.
       * ⛔ Omitting it here sends the REDIRECT to the chosen directory and the
       * REDEMPTION to the configured one — and the failure is a silently
       * wrong-tenant token, not an error. Every downstream check then answers
       * correctly about the wrong directory.
       */
      ...(options.Authority ? { authority: options.Authority } : {}),
    };

    /**
     * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will
     * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making
     * metadata discovery calls, thereby improving performance of token acquisition process. For more, see:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
     */
    /**
     * 🔴 THE MEMO IS SKIPPED WHEN THE AUTHORITY IS OVERRIDDEN, AND THAT IS NOT
     * AN OPTIMISATION DETAIL.
     *
     * `getAuthorityMetadata()` fetches
     * `${msalConfig.auth.authority}/v2.0/.well-known/openid-configuration` and
     * the result is written onto `this.msalConfig.auth`, which is SHARED and
     * MUTABLE. It is therefore metadata for the CONFIGURED directory.
     *
     * ⛔ Leaving it in place while signing in to a DIFFERENT directory would
     * validate a tenant-B authority against tenant-A metadata. Skipping costs
     * one discovery round trip on the tenant-scoped path and keeps the fast
     * path for the common case exactly as it was.
     */
    if (
      !options.Authority &&
      (!this.msalConfig.auth.cloudDiscoveryMetadata ||
        !this.msalConfig.auth.authorityMetadata)
    ) {
      const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
        this.getCloudDiscoveryMetadata(),
        this.getAuthorityMetadata(),
      ]);

      this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(
        cloudDiscoveryMetadata,
      );

      this.msalConfig.auth.authorityMetadata = JSON.stringify(
        authorityMetadata,
      );
    }

    const msalInstance = this.getMsalInstance();

    // trigger the first leg of auth code flow
    return await this.redirectToAuthCodeUrl(
      req,
      sessionDataLoader,
      authCodeUrlRequestParams,
      authCodeRequestParams,
      msalInstance,
    );
  }

  public async SignOut(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
    options: MSALSignOutOptions,
  ): Promise<Response> {
    /**
     * Construct a logout URI and redirect the user to end the
     * session with Azure AD. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
     */
    let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

    if (options.PostLogoutRedirectUri) {
      logoutUri +=
        `logout?post_logout_redirect_uri=${options.PostLogoutRedirectUri}`;
    }

    await this.denoKv.delete([
      "MSAL",
      "UserData",
      await sessionDataLoader.Load(req, "idToken"),
    ]);

    await sessionDataLoader.Clear(req);

    return redirectRequest(logoutUri, false, false);
  }
  //#endregion

  //#region Helpers
  protected async getAuthorityMetadata(): Promise<any> {
    const logger = await getPackageLogger(import.meta);

    const endpoint =
      `${this.msalConfig.auth.authority}/v2.0/.well-known/openid-configuration`;

    try {
      const response = await fetch(endpoint, { method: "GET" });

      return await response.json();
    } catch (error) {
      logger.error(
        "There was an issue resolving the authority metadata",
        error,
      );
    }
  }

  protected async getCloudDiscoveryMetadata(): Promise<any> {
    const endpoint =
      `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=${this.msalConfig.auth.authority}/oauth2/v2.0/authorize`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
      });

      const metadata = await response.json();

      if (metadata.error) {
        throw new Error(metadata.error_description);
      }

      return metadata;
    } catch (error) {
      throw error;
    }
  }

  protected getMsalInstance(): msal.ConfidentialClientApplication {
    return new msal.ConfidentialClientApplication(this.msalConfig);
  }

  protected async redirectToAuthCodeUrl(
    req: Request,
    sessionDataLoader: MSALSessionDataLoader,
    authCodeUrlRequestParams: AuthorizationUrlRequest,
    authCodeRequestParams: AuthorizationCodeRequest,
    msalInstance: msal.ConfidentialClientApplication,
  ): Promise<Response> {
    // Generate PKCE Codes before starting the authorization flow
    const { verifier, challenge } = await this.cryptoProvider
      .generatePkceCodes();

    // Set generated PKCE codes and method as session vars
    const pkceCodes = {
      challengeMethod: "S256",
      verifier: verifier,
      challenge: challenge,
    };

    await sessionDataLoader.Set(req, "pkceCodes", pkceCodes);

    /**
     * By manipulating the request objects below before each request, we can obtain
     * auth artifacts with desired claims. For more information, visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
     */
    const authCodeUrlRequest = {
      ...authCodeUrlRequestParams,
      // responseMode: msal.ResponseMode.FORM_POST,
      codeChallenge: pkceCodes.challenge,
      codeChallengeMethod: pkceCodes.challengeMethod,
    };

    await sessionDataLoader.Set(req, "authCodeUrlRequest", authCodeUrlRequest);

    await sessionDataLoader.Set(req, "authCodeRequest", {
      ...authCodeRequestParams,
      code: "",
    });

    try {
      const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(
        authCodeUrlRequest,
      );

      return redirectRequest(authCodeUrlResponse, false, false);
    } catch (error) {
      throw error;
    }
  }
}
