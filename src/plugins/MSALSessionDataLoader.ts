// deno-lint-ignore-file no-explicit-any

export type MSALSessionDataLoader = {
  Clear: (req: Request) => Promise<void>;

  Load: (req: Request, key: string) => Promise<any>;

  Set: (req: Request, key: string, value: any) => Promise<void>;
};
