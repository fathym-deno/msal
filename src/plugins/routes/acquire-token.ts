import { Handlers, JSX, WithSession } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalAcquireTokenRoute(
  config: MSALPluginConfiguration,
) {
  const handler: Handlers<JSX.Element, WithSession> = {
    GET(_req, ctx) {
      return config.MSALAuthProvider.AcquireToken(
        ctx.state.session,
        config.MSALSignInOptions,
      );
    },
  };

  return { handler, component: undefined };
}
