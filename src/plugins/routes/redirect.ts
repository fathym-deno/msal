import { Handlers, JSX, respond, WithSession } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalRedirectRoute(config: MSALPluginConfiguration) {
  const handler: Handlers<JSX.Element, WithSession> = {
    async GET(req, ctx) {
      const url = new URL(req.url);

      const code = url.searchParams.get("code")!;

      const state = url.searchParams.get("state")!;

      const response = await config.MSALAuthProvider.HandleRedirect(
        ctx.state.session || {},
        {
          code: code.toString(),
          state: state.toString(),
        },
      );

      return response;
    },
  };

  return { handler, component: undefined };
}
