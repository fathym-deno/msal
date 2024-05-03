import { EaCMSALProcessor } from "../eac/EaCMSALProcessor.ts";
import { EaCRuntimeEaC, IoCContainer } from "../src.deps.ts";
import { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";

export type MSALSessionDataLoaderResolver = {
  Resolve: (
    ioc: IoCContainer,
    processor: EaCMSALProcessor,
    eac: EaCRuntimeEaC,
  ) => Promise<MSALSessionDataLoader>;
};
