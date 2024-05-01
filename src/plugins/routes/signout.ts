import { EaCRuntimeHandlers } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalSignOutRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(_req, _ctx) {
      return config.MSALAuthProvider.SignOut(
        sessionDataLoader,
        config.MSALSignOutOptions,
      );
    },
  };

  return handler;
}
