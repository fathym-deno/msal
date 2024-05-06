import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  IoCContainer,
} from "../src.deps.ts";
import { EaCMSALProcessorHandlerResolver } from "./EaCMSALProcessorHandlerResolver.ts";
import { MSALSessionDataLoaderResolver } from "./MSALSessionDataLoaderResolver.ts";

export default class MSALPlugin implements EaCRuntimePlugin {
  constructor(
    protected sessionDataLoaderResolver: MSALSessionDataLoaderResolver,
  ) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: "MSALPlugin",
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(() => EaCMSALProcessorHandlerResolver, {
      Name: "EaCMSALProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => this.sessionDataLoaderResolver, {
      Type: pluginConfig.IoC!.Symbol("MSALSessionDataLoaderResolver"),
    });

    return Promise.resolve(pluginConfig);
  }
}
