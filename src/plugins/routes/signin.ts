import { Handlers, JSX, WithSession } from "../../src.deps.ts";
import { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";

export function establishMsalSignInRoute(config: MSALPluginConfiguration) {
  const handler: Handlers<JSX.Element, WithSession> = {
    GET(_req, ctx) {
      return config.MSALAuthProvider.SignIn(
        ctx.state.session,
        config.MSALSignInOptions,
      );
    },
  };

  return { handler, component: undefined };
}
