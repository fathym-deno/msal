import type { EaCRuntimeHandlers } from "../../src.deps.ts";
import type { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";
import type { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalAcquireTokenRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(req, _ctx) {
      return config.MSALAuthProvider.AcquireToken(
        req,
        sessionDataLoader,
        config.MSALSignInOptions,
      );
    },
  };

  return handler;
}
