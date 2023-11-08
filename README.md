# MSAL for Deno

This is an implementation of the Azure MSAL (Microsoft Authentication Library) for Deno using msal-node.

This project is based on the tutorial provided by Microsoft, which can be found at the following link: [msal-tutorial](https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-nodejs-webapp-msal)

The tutorial provides a step-by-step guide on how to sign in users and acquire tokens for calling Microsoft Graph in a Node.js & Express web app using the Microsoft Authentication Library (MSAL) for Node.

This implementation aims to provide similar functionality, but for Deno environments.

The following explains how to use with Deno Fresh, using this with Deno standalone and other frameworks is possible. Pull requests are welcome to fill out this additional documentation.

## Getting Started with MSAL in Deno Fresh

To get started with MSAL for Deno, you need to add the following to your `deno.json` configuration file:

```json
{
  "imports": {
    "@fathym/msal": "https://deno.land/x/msal@${VERSION}/mod.ts"
  }
}
```

After that is setup, you can configure your MSAL in a new `msal.config.ts` file like the following example:

```ts
import * as msal from 'npm:@azure/msal-node@2.1.0';
import { Configuration } from 'npm:@azure/msal-node@2.1.0';
import { MSALAuthProvider, MSALPluginConfiguration } from '@fathym/msal';
import { denoKv } from './deno-kv.config.ts';

export const msalCryptoProvider = new msal.CryptoProvider();

export const msalConfig: Configuration = {
  auth: {
    clientId: Deno.env.get('MSAL_CLIENT_ID')!,
    authority:
      Deno.env.get('MSAL_CLOUD_INSTANCE')! + Deno.env.get('MSAL_TENANT_ID')!,
    clientSecret: Deno.env.get('MSAL_CLIENT_SECRET')!,
  },
  system: {
    loggerOptions: {
      loggerCallback(_loglevel, message, _containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

export const MSAL_REDIRECT_URI = Deno.env.get('MSAL_REDIRECT_URI')!;
export const MSAL_POST_LOGOUT_REDIRECT_URI = Deno.env.get(
  'MSAL_POST_LOGOUT_REDIRECT_URI'
)!;

export const msalAuthProvider = new MSALAuthProvider(
  msalConfig,
  msalCryptoProvider,
  denoKv
);

export const msalPluginConfig: MSALPluginConfiguration = {
  MSALAuthProvider: msalAuthProvider,
  MSALSignInOptions: {
    Scopes: ['https://management.core.windows.net//user_impersonation'], // Your desired scopes go here
    RedirectURI: MSAL_REDIRECT_URI,
    SuccessRedirect: '/cloud', // Replace with your descired success redirect URL
  },
  MSALSignOutOptions: {
    ClearSession: false,
    PostLogoutRedirectUri: MSAL_POST_LOGOUT_REDIRECT_URI,
  },
  RootPath: 'cloud/azure/auth', // Replace with your descired root path or remove to use the default 'azure/auth' path
};
```

For this to work, you will need to update your `.env` file with the following configurations:

```
MSAL_CLIENT_ID=replace_with_your_client_id
MSAL_CLOUD_INSTANCE=https://login.microsoftonline.com/
MSAL_CLIENT_SECRET=replace_with_your_client_secret
MSAL_POST_LOGOUT_REDIRECT_URI=/
MSAL_REDIRECT_URI=http://localhost:8000/cloud/azure/auth/redirect
MSAL_TENANT_ID=replace_with_your_azure_tenant_id
```

You can use a different `MSAL_CLOUD_INSTANCE` url if you need to, and make sure to update the `MSAL_POST_LOGOUT_REDIRECT_URI` and `MSAL_REDIRECT_URI` with appropriate values for your application.

In order to setup your new MSAL client application, you will need to follow the documentation [here](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).

Finally, you will need to update your fresh config to leverage the plugin:

```
import { defineConfig } from "$fresh/server.ts";
import { msalPlugin } from "@fathym/msal";
import { msalPluginConfig } from "./configs/msal.config.ts";

export default defineConfig({
  plugins: [
    msalPlugin(msalPluginConfig),
  ],
});
```

Make sure that you add the `msalPlugin(...)` alongside any other configured plugins.

## Setup in Review

With all the previous configurations in place, you will now be able to leverage MSAL in your application. The routes are configured for you and the easiest way to manage redirection to the sign in page in Deno Fresh is leveraging the built in middleware helper. Place the following `_middleware.ts` file in a routes folder that needs the MSAL authentication:

```ts
import { msalPluginConfig } from '../../configs/msal.config.ts';
import { buildIsConnectedCheckMiddleware } from '@fathym/msal';
import { OpenBiotechManagerState } from '../../src/OpenBiotechManagerState.tsx';

export const handler = [
  buildIsConnectedCheckMiddleware(msalPluginConfig, (ctx, err) => {
    const headers = new Headers();

    headers.set('location', "/cloud/azure/auth/signin");

    return Promise.resolve(
      new Response(null, {
        status: status,
        headers,
      })
    );
  }),
];
```

You can also simply link to the configured signin route (`/cloud/azure/auth/signin` in our example configuration) from any link.
