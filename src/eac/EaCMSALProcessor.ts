import { MSALPluginConfiguration } from "../plugins/MSALPluginConfiguration.ts";
import { EaCProcessor, isEaCProcessor } from "../src.deps.ts";

export type EaCMSALProcessor = {
  Config: Omit<MSALPluginConfiguration, "MSALAuthProvider">;

  ProviderLookup: string;
} & EaCProcessor<"MSAL">;

export function isEaCMSALProcessor(
  proc: unknown,
): proc is EaCMSALProcessor {
  const x = proc as EaCMSALProcessor;

  return (
    isEaCProcessor("MSAL", x) &&
    x.Config !== undefined &&
    (typeof x.Config === "string" ||
      (x.Config as MSALPluginConfiguration).MSALSignInOptions !== undefined ||
      (x.Config as MSALPluginConfiguration).MSALSignOutOptions !== undefined)
  );
}
