// deno-lint-ignore-file no-explicit-any
import { MSALPluginConfiguration } from "./MSALPluginConfiguration.ts";
import {
  AccessToken,
  ArmResource,
  EaCRuntimeContext,
  EaCRuntimeHandler,
} from "../src.deps.ts";
import { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";
// import { WithSession } from "./WithSession.ts";

export function buildIsConnectedCheckMiddleware<
  TContextState, //extends WithSession
>(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
  badRequestHandler?: (
    ctx: EaCRuntimeContext<TContextState>,
    err: any,
  ) => Promise<void | Response>,
): EaCRuntimeHandler<TContextState> {
  return async (req: Request, ctx): Promise<Response> => {
    try {
      const subClient = new ArmResource.SubscriptionClient({
        getToken: async () => {
          const token = await config.MSALAuthProvider.GetAccessToken(
            req,
            sessionDataLoader,
          );

          return {
            token,
          } as AccessToken;
        },
      });

      const subsList = subClient.subscriptions.list();

      for await (const _sub of subsList) {
        break;
      }
    } catch (err) {
      if (badRequestHandler) {
        const handled = await badRequestHandler(ctx, err);

        if (handled) {
          return handled;
        }
      }
    }

    return await ctx.Next();
  };
}
