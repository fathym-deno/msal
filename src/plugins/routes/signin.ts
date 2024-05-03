import { EaCRuntimeHandlers } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalSignInRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(req, ctx) {
      console.log(req.url.search);
      return config.MSALAuthProvider.SignIn(req, sessionDataLoader, {
        ...config.MSALSignInOptions,
        RedirectURI: new URL("callback", ctx.Runtime.URLMatch.Base).href,
        SuccessRedirect: new URLSearchParams(ctx.Runtime.URLMatch.Search).get(
          "success_url",
        )!,
      });
    },
  };

  return handler;
}
