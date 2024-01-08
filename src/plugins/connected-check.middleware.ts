// deno-lint-ignore-file no-explicit-any
import { MSALPluginConfiguration } from "./MSALPluginConfiguration.ts";
import {
  AccessToken,
  ArmResource,
  MiddlewareHandlerContext,
  WithSession,
} from "../src.deps.ts";

export function buildIsConnectedCheckMiddleware<
  TContextState extends WithSession,
>(
  config: MSALPluginConfiguration,
  badRequestHandler?: (
    ctx: MiddlewareHandlerContext<TContextState>,
    err: any,
  ) => Promise<void | Response>,
) {
  return async (
    _req: Request,
    ctx: MiddlewareHandlerContext<TContextState>,
  ): Promise<Response> => {
    try {
      const subClient = new ArmResource.SubscriptionClient({
        getToken: async () => {
          const token = await config.MSALAuthProvider.GetAccessToken(
            ctx.state.session,
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

    return await ctx.next();
  };
}
