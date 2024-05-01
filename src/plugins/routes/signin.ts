import { EaCRuntimeHandlers } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalSignInRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(_req, _ctx) {
      return config.MSALAuthProvider.SignIn(
        sessionDataLoader,
        config.MSALSignInOptions,
      );
    },
  };

  return handler;
}
