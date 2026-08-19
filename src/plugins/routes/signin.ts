import type { EaCRuntimeHandlers } from "../../.deps.ts";
import type { MSALPluginConfiguration } from "../MSALPluginConfiguration.ts";
import type { MSALSessionDataLoader } from "../MSALSessionDataLoader.ts";
import {
  buildTenantAuthority,
  isAcceptableTenantID,
} from "../../tenantAuthority.ts";

export function establishMsalSignInRoute(
  config: MSALPluginConfiguration,
  sessionDataLoader: MSALSessionDataLoader,
) {
  const handler: EaCRuntimeHandlers = {
    GET(req, ctx) {
      const base = new URL(ctx.Runtime.URLMatch.Base);

      const host = req.headers.get("x-eac-forwarded-host") ??
        req.headers.get("x-forwarded-host") ??
        base.host;

      const proto = (
        req.headers.get("x-eac-forwarded-proto") ??
          req.headers.get("x-forwarded-proto") ??
          base.protocol
      ).replace(":", "");

      const path = (
        req.headers.get("x-eac-forwarded-path") ??
          base.pathname
      ).replace(":", "");

      const callback = new URL(
        "callback",
        new URL(path, new URL(`${proto}://${host}`)),
      );

      const searchParams = new URLSearchParams(ctx.Runtime.URLMatch.Search);
      const successOverride = searchParams.get("success_url");

      /**
       * 🔑 TENANT-SCOPED SIGN-IN. `?tenant=` sends the user to the directory
       * they chose rather than the configured one, which is what makes a
       * customer whose subscriptions live outside their home tenant reachable
       * at all.
       *
       * 🔴 REFUSED LOUDLY WHEN MALFORMED, ⛔ NEVER FALLEN BACK.
       *
       * The value is interpolated into the URL MSAL talks to, so a bad one is a
       * path injection into an identity endpoint. And a FALLBACK would be worse
       * than a refusal even if it were safe: the caller asked for directory B,
       * would receive a token for directory A, and every downstream check would
       * then answer correctly about the wrong directory — a plausible wrong
       * answer rather than a visible failure.
       *
       * ⚠️ 400, not 401. A malformed identifier is a malformed REQUEST; a 401
       * would tell the caller to sign in again, which builds a modal that asks,
       * succeeds, fails and asks again forever.
       */
      const tenant = searchParams.get("tenant");

      if (tenant !== null && !isAcceptableTenantID(tenant)) {
        return new Response(
          "The requested directory identifier is not a valid Azure tenant id.",
          { status: 400 },
        );
      }

      return config.MSALAuthProvider.SignIn(req, sessionDataLoader, {
        ...config.MSALSignInOptions,
        RedirectURI: callback.href,
        SuccessRedirect: successOverride ??
          config.MSALSignInOptions?.SuccessRedirect ?? "/",
        ...(tenant ? { Authority: buildTenantAuthority(tenant) } : {}),
      });
    },
  };

  return handler;
}
