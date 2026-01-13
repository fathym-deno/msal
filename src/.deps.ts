export { redirectRequest } from "jsr:@fathym/common@0.2.310-common-release/http";
export { telemetryFor } from "jsr:@fathym/common@0.2.310-common-release/telemetry";

export { type EverythingAsCode } from "jsr:@fathym/eac@0.2.248-hmis";
export { type EaCRuntimeContext } from "jsr:@fathym/eac@0.2.248-hmis/runtime";
export {
  type EaCRuntimeConfig,
  type EaCRuntimePluginConfig,
} from "jsr:@fathym/eac@0.2.248-hmis/runtime/config";
export {
  type EaCRuntimeHandler,
  type EaCRuntimeHandlers,
} from "jsr:@fathym/eac@0.2.248-hmis/runtime/pipelines";
export { type EaCRuntimePlugin } from "jsr:@fathym/eac@0.2.248-hmis/runtime/plugins";
export {
  type EaCAzureADProviderDetails,
  type EverythingAsCodeIdentity,
} from "jsr:@fathym/eac-identity@0.0.87-eac-cascade";

export {
  type EaCApplicationProcessorConfig,
  type EaCProcessor,
  isEaCProcessor,
  type ProcessorHandlerResolver,
  type ProcessorHandlerResult,
} from "jsr:@fathym/eac@0.2.248-hmis/applications/processors";

export { IoCContainer } from "jsr:@fathym/ioc@0.0.26-ioc-release";

export {
  type AccountInfo,
  type AuthorizationCodePayload,
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
  type Configuration,
} from "npm:@azure/msal-node@2.16.2";

export * as msal from "npm:@azure/msal-node@2.16.2";

export { type AccessToken } from "npm:@azure/identity@2.1.0";

export * as ArmResource from "npm:@azure/arm-subscriptions@5.1.0";
