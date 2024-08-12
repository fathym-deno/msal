import type { EaCRuntimeHandlers } from "../../src.deps.ts";
import type { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import type { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";

export function establishMsalCallbackRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    async GET(req, _ctx) {
      const url = new URL(req.url);

      const code = url.searchParams.get("code")!;

      const state = url.searchParams.get("state")!;

      const response = await config.MSALAuthProvider.HandleCallback(
        req,
        sessionDataLoader,
        {
          code: code.toString(),
          state: state.toString(),
        },
      );

      return response;
    },
  };

  return handler;
}
