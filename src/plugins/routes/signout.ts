import type { EaCRuntimeHandlers } from "../../src.deps.ts";
import type { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import type { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalSignOutRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(req, _ctx) {
      return config.MSALAuthProvider.SignOut(
        req,
        sessionDataLoader,
        config.MSALSignOutOptions,
      );
    },
  };

  return handler;
}
