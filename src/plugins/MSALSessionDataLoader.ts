// deno-lint-ignore-file no-explicit-any

export type MSALSessionDataLoader = {
  Clear: () => void;

  Load: (key: string) => any;

  Set: (key: string, value: any) => void;
};
