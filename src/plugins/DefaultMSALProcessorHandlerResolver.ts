import { isEaCMSALProcessor } from "../eac/EaCMSALProcessor.ts";
import {
  EaCApplicationProcessorConfig,
  EaCRuntimeEaC,
  IoCContainer,
  ProcessorHandlerResolver,
} from "../src.deps.ts";

export class DefaultMSALProcessorHandlerResolver
  implements ProcessorHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EaCRuntimeEaC,
  ) {
    let toResolveName: string = "";

    if (isEaCMSALProcessor(appProcCfg.Application.Processor)) {
      toResolveName = "EaCMSALProcessor";
    }

    if (toResolveName) {
      const resolver = await ioc.Resolve<ProcessorHandlerResolver>(
        ioc.Symbol("ProcessorHandlerResolver"),
        toResolveName,
      );

      return await resolver.Resolve(ioc, appProcCfg, eac);
    } else {
      return undefined;
    }
  }
}
