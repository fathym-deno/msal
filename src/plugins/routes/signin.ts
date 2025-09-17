import type { EaCRuntimeHandlers } from "../../src.deps.ts";
import type { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import type { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalSignInRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(req, ctx) {
      const base = new URL(ctx.Runtime.URLMatch.Base);

      const host = req.headers.get("x-eac-forwarded-host") ??
        req.headers.get("x-forwarded-host") ??
        base.host;

      const proto = (
        req.headers.get("x-eac-forwarded-proto") ??
          req.headers.get("x-forwarded-proto") ??
          base.protocol
      ).replace(":", "");

      const path = (
        req.headers.get("x-eac-forwarded-path") ??
          base.pathname
      ).replace(":", "");

      const callback = new URL(
        "callback",
        new URL(path, new URL(`${proto}://${host}`)),
      );

      const searchParams = new URLSearchParams(ctx.Runtime.URLMatch.Search);
      const successOverride = searchParams.get("success_url");

      return config.MSALAuthProvider.SignIn(req, sessionDataLoader, {
        ...config.MSALSignInOptions,
        RedirectURI: callback.href,
        SuccessRedirect: successOverride ??
          config.MSALSignInOptions?.SuccessRedirect ?? "/",
      });
    },
  };

  return handler;
}
