import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  IoCContainer,
} from "../src.deps.ts";
import { EaCMSALProcessorHandlerResolver } from "./EaCMSALProcessorHandlerResolver.ts";
import { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";

export default class MSALPlugin implements EaCRuntimePlugin {
  constructor(protected sessionDataLoader: MSALSessionDataLoader) {}

  public Build(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: "MSALPlugin",
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(() => EaCMSALProcessorHandlerResolver, {
      Name: "EaCMSALProcessor",
      Type: pluginConfig.IoC!.Symbol("ProcessorHandlerResolver"),
    });

    pluginConfig.IoC!.Register(() => this.sessionDataLoader, {
      Type: pluginConfig.IoC!.Symbol("MSALSessionDataLoader"),
    });

    return Promise.resolve(pluginConfig);
  }
}
