import { Handlers, JSX, WithSession } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalSignOutRoute(config: MSALPluginConfiguration) {
  const handler: Handlers<JSX.Element, WithSession> = {
    GET(_req, ctx) {
      return config.MSALAuthProvider.SignOut(
        ctx.state.session,
        config.MSALSignOutOptions,
      );
    },
  };

  return { handler, component: undefined };
}
