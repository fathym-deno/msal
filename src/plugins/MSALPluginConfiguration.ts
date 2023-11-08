import { MSALAuthProvider } from "../MSALAuthProvider.ts";
import { MSALSignInOptions } from "../MSALSignInOptions.ts";
import { MSALSignOutOptions } from "../MSALSignOutOptions.ts";

export type MSALPluginConfiguration = {
  MSALAuthProvider: MSALAuthProvider;

  MSALSignInOptions: MSALSignInOptions;

  MSALSignOutOptions: MSALSignOutOptions;

  RootPath: string;
};
