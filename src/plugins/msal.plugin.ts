import { Plugin } from "../src.deps.ts";
import { MSALPluginConfiguration } from "./MSALPluginConfiguration.ts";
import { establishMsalAcquireTokenRoute } from "./routes/acquire-token.ts";
import { establishMsalRedirectRoute } from "./routes/redirect.ts";
import { establishMsalSignInRoute } from "./routes/signin.ts";
import { establishMsalSignOutRoute } from "./routes/signout.ts";

export function msalPlugin(
  config: MSALPluginConfiguration,
): Plugin {
  const msalSignInRoute = establishMsalSignInRoute(config);

  const msalSignOutRoute = establishMsalSignOutRoute(config);

  const msalRedirectRoute = establishMsalRedirectRoute(config);

  const msalAcquireTokenRoute = establishMsalAcquireTokenRoute(config);

  return {
    name: "fathym_msal",
    routes: [
      {
        path: `/${config.RootPath || "azure/auth"}/signin`,
        ...msalSignInRoute,
      },
      {
        path: `/${config.RootPath || "azure/auth"}/signout`,
        ...msalSignOutRoute,
      },
      {
        path: `/${config.RootPath || "azure/auth"}/redirect`,
        ...msalRedirectRoute,
      },
      {
        path: `/${config.RootPath || "azure/auth"}/acquire-token`,
        ...msalAcquireTokenRoute,
      },
    ],
  };
}
