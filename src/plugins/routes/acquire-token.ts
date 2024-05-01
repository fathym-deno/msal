import { EaCRuntimeHandlers } from "../../src.deps.ts";
import { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalAcquireTokenRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(_req, _ctx) {
      return config.MSALAuthProvider.AcquireToken(
        sessionDataLoader,
        config.MSALSignInOptions,
      );
    },
  };

  return handler;
}
