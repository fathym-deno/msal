import type { EaCMSALProcessor } from "../eac/EaCMSALProcessor.ts";
import type { EaCRuntimeEaC, IoCContainer } from "../src.deps.ts";
import type { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";

export type MSALSessionDataLoaderResolver = {
  Resolve: (
    ioc: IoCContainer,
    processor: EaCMSALProcessor,
    eac: EaCRuntimeEaC,
  ) => Promise<MSALSessionDataLoader>;
};
