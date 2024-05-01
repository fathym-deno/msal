import { MSALAuthProvider } from "../MSALAuthProvider.ts";
import {
  EaCMSALProcessor,
  isEaCMSALProcessor,
} from "../eac/EaCMSALProcessor.ts";
import {
  Configuration,
  EaCAzureADProviderDetails,
  EaCRuntimeHandler,
  msal,
  ProcessorHandlerResolver,
} from "../src.deps.ts";
import { MSALPluginConfiguration } from "./MSALPluginConfiguration.ts";
import { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";
import { establishMsalAcquireTokenRoute } from "./routes/acquire-token.ts";
import { establishMsalRedirectRoute } from "./routes/redirect.ts";
import { establishMsalSignInRoute } from "./routes/signin.ts";
import { establishMsalSignOutRoute } from "./routes/signout.ts";

export const EaCMSALProcessorHandlerResolver: ProcessorHandlerResolver = {
  async Resolve(ioc, appProcCfg, eac) {
    if (!isEaCMSALProcessor(appProcCfg.Application.Processor)) {
      throw new Deno.errors.NotSupported(
        "The provided processor is not supported for the EaCMSALProcessorHandlerResolver.",
      );
    }

    const processor = appProcCfg.Application.Processor as EaCMSALProcessor;

    const provider = eac.Providers![processor.ProviderLookup]!;

    const providerDetails = provider.Details as EaCAzureADProviderDetails;

    const oauthKv = await ioc.Resolve<Deno.Kv>(
      Deno.Kv,
      provider.DatabaseLookup,
    );

    const msalConfig: Configuration = {
      auth: {
        clientId: providerDetails.ClientID,
        clientSecret: providerDetails.ClientSecret,
        authority:
          `https://login.microsoftonline.com/${providerDetails.TenantID}`,
      },
      system: {
        loggerOptions: {
          loggerCallback(_loglevel, message, _containsPii) {
            console.log(message);
          },
          piiLoggingEnabled: false,
          logLevel: 3,
        },
      },
    };

    const pluginConfig: MSALPluginConfiguration = {
      ...processor.Config,
      MSALAuthProvider: new MSALAuthProvider(
        msalConfig,
        new msal.CryptoProvider(),
        oauthKv,
      ),
    };

    const sessionDataLoader = await ioc.Resolve<MSALSessionDataLoader>(
      ioc.Symbol("MSALSessionDataLoader"),
    );

    const msalSignInRoute = establishMsalSignInRoute(
      pluginConfig,
      sessionDataLoader,
    );

    const msalSignOutRoute = establishMsalSignOutRoute(
      pluginConfig,
      sessionDataLoader,
    );

    const msalRedirectRoute = establishMsalRedirectRoute(
      pluginConfig,
      sessionDataLoader,
    );

    const msalAcquireTokenRoute = establishMsalAcquireTokenRoute(
      pluginConfig,
      sessionDataLoader,
    );

    const handler: EaCRuntimeHandler = (req, ctx) => {
      const msalPath = ctx.Runtime.URLMatch.Path;

      switch (msalPath) {
        case "signin": {
          return msalSignInRoute.GET!(req, ctx);
        }

        case "redirect": {
          return msalRedirectRoute.GET!(req, ctx);
        }

        case "signout": {
          return msalSignOutRoute.GET!(req, ctx);
        }

        case "acquire-token": {
          return msalAcquireTokenRoute.GET!(req, ctx);
        }
      }

      return ctx.Next();
    };

    return handler;
  },
};
