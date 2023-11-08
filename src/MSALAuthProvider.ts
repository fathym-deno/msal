import {
  AccountInfo,
  AuthorizationCodePayload,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  Configuration,
  msal,
  redirectRequest,
} from "./src.deps.ts";
import { MSALAcquireTokenOptions } from "./MSALAcquireTokenOptions.ts";
import { MSALSignInOptions } from "./MSALSignInOptions.ts";
import { MSALSignOutOptions } from "./MSALSignOutOptions.ts";
import { MSALAuthSession } from "./MSALAuthSession.ts";

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
    session: MSALAuthSession,
    options: MSALAcquireTokenOptions,
  ): Promise<Response> {
    try {
      const msalInstance = this.getMsalInstance();

      /**
       * If a token cache exists in the session, deserialize it and set it as the
       * cache for the new MSAL CCA instance. For more, see:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
       */
      const tokenCache = (
        await this.denoKv.get([
          "UserData",
          session.get("idToken"),
          "TokenCache",
        ])
      ).value as string;

      if (tokenCache) {
        msalInstance.getTokenCache().deserialize(tokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({
        account: (
          await this.denoKv.get([
            "UserData",
            session.get("idToken"),
            "AccessToken",
          ])
        ).value as AccountInfo,
        scopes: options.Scopes || [],
      });

      session.set("idToken", tokenResponse.idToken);

      /**
       * On successful token acquisition, write the updated token
       * cache back to the session. For more, see:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
       */
      await this.denoKv.set(
        ["UserData", session.get("idToken"), "TokenCache"],
        msalInstance.getTokenCache().serialize(),
      );

      await this.denoKv.set(
        ["UserData", session.get("idToken"), "Account"],
        tokenResponse.account,
      );

      await this.denoKv.set(
        ["UserData", session.get("idToken"), "AccessToken"],
        tokenResponse.accessToken,
      );

      // session.set('accessToken', tokenResponse.accessToken);

      // session.set('account', tokenResponse.account);

      return redirectRequest(options.SuccessRedirect);
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        return await this.SignIn(session, options);
      }

      throw error;
    }
  }

  public async GetAccessToken(session: MSALAuthSession): Promise<string> {
    return (
      await this.denoKv.get(["UserData", session.get("idToken"), "AccessToken"])
    ).value as string;
  }

  public async HandleRedirect(
    session: MSALAuthSession,
    payload: AuthorizationCodePayload,
  ): Promise<Response> {
    if (!payload || !payload.state) {
      throw new Error("Error: response not found");
    }

    const authCodeRequest = {
      ...session.get("authCodeRequest"),
      code: payload.code,
      codeVerifier: session.get("pkceCodes").verifier,
    };

    try {
      const msalInstance = this.getMsalInstance();

      const tokenCache = (
        await this.denoKv.get([
          "UserData",
          session.get("idToken"),
          "TokenCache",
        ])
      ).value as string;

      if (tokenCache) {
        msalInstance.getTokenCache().deserialize(tokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenByCode(
        authCodeRequest,
        payload,
      );

      session.set("test", new Date().toString());

      session.set("idToken", tokenResponse.idToken);

      await this.denoKv.set(
        ["UserData", session.get("idToken"), "TokenCache"],
        msalInstance.getTokenCache().serialize(),
      );

      await this.denoKv.set(
        ["UserData", session.get("idToken"), "Account"],
        tokenResponse.account,
      );

      await this.denoKv.set(
        ["UserData", session.get("idToken"), "AccessToken"],
        tokenResponse.accessToken,
      );

      // session.set("tokenCache", msalInstance.getTokenCache().serialize());

      // session.set("account", tokenResponse.account);

      session.set("isMsalAuthenticated", true);

      const state = JSON.parse(this.cryptoProvider.base64Decode(payload.state));

      return redirectRequest(state.successRedirect);
    } catch (error) {
      throw error;
    }
  }

  public async SignIn(
    session: MSALAuthSession,
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
    };

    /**
     * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will
     * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making
     * metadata discovery calls, thereby improving performance of token acquisition process. For more, see:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
     */
    if (
      !this.msalConfig.auth.cloudDiscoveryMetadata ||
      !this.msalConfig.auth.authorityMetadata
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
      session,
      authCodeUrlRequestParams,
      authCodeRequestParams,
      msalInstance,
    );
  }

  public async SignOut(
    session: MSALAuthSession,
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

    session.clear();

    await this.denoKv.delete(["UserData", session.get("idToken")]);

    return redirectRequest(logoutUri);
  }
  //#endregion

  //#region Helpers
  protected async getAuthorityMetadata() {
    const endpoint =
      `${this.msalConfig.auth.authority}/v2.0/.well-known/openid-configuration`;

    try {
      const response = await fetch(endpoint, { method: "GET" });

      return await response.json();
    } catch (error) {
      console.log(error);
    }
  }

  protected async getCloudDiscoveryMetadata() {
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

  protected getMsalInstance() {
    return new msal.ConfidentialClientApplication(this.msalConfig);
  }

  protected async redirectToAuthCodeUrl(
    session: MSALAuthSession,
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

    session.set("pkceCodes", pkceCodes);

    /**
     * By manipulating the request objects below before each request, we can obtain
     * auth artifacts with desired claims. For more information, visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
     */
    const authCodeUrlRequest = {
      ...authCodeUrlRequestParams,
      responseMode: msal.ResponseMode.FORM_POST,
      codeChallenge: pkceCodes.challenge,
      codeChallengeMethod: pkceCodes.challengeMethod,
    };

    session.set("authCodeUrlRequest", authCodeUrlRequest);

    session.set("authCodeRequest", {
      ...authCodeRequestParams,
      code: "",
    });

    try {
      const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(
        authCodeUrlRequest,
      );

      return redirectRequest(authCodeUrlResponse);
    } catch (error) {
      throw error;
    }
  }
  //#endregion
}
