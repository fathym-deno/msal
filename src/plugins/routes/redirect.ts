import { Handlers, JSX, WithSession } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalRedirectRoute(config: MSALPluginConfiguration) {
  const handler: Handlers<JSX.Element, WithSession> = {
    async POST(req, ctx) {
      const authReq = await req.formData();

      const code = authReq.get("code");

      const state = authReq.get("state");

      const response = await config.MSALAuthProvider.HandleRedirect(
        ctx.state.session || {},
        {
          code: code!.toString(),
          state: state!.toString(),
        },
      );

      return response;
    },
  };

  return { handler, component: undefined };
}
