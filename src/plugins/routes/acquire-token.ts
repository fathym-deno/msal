import { EaCRuntimeHandlers } from "../../src.deps.ts";
import { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

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
