import type { MSALAuthProvider } from "../MSALAuthProvider.ts";
import type { MSALSignInOptions } from "../MSALSignInOptions.ts";
import type { MSALSignOutOptions } from "../MSALSignOutOptions.ts";

export type MSALPluginConfiguration = {
  MSALAuthProvider: MSALAuthProvider;

  MSALSignInOptions: MSALSignInOptions;

  MSALSignOutOptions: MSALSignOutOptions;
};
