import type { EaCMSALProcessor } from "../eac/EaCMSALProcessor.ts";
import type { EverythingAsCode, IoCContainer } from "../src.deps.ts";
import type { MSALSessionDataLoader } from "./MSALSessionDataLoader.ts";

export type MSALSessionDataLoaderResolver = {
  Resolve: (
    ioc: IoCContainer,
    processor: EaCMSALProcessor,
    eac: EverythingAsCode,
  ) => Promise<MSALSessionDataLoader>;
};
