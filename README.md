---
FrontmatterVersion: 1
DocumentType: Guide
Title: Fathym MSAL for Deno
Summary: Deno wrapper for the Microsoft Authentication Library (MSAL) built on msal-node.
Created: 2025-11-20
Updated: 2025-11-20
Owners:
  - fathym
References:
  - Label: Projects: Ref-Arch README
    Path: ../README.md
  - Label: Projects: Ref-Arch AGENTS
    Path: ../AGENTS.md
  - Label: Projects: Ref-Arch Guide
    Path: ../GUIDE.md
  - Label: Root README
    Path: ../../../README.md
  - Label: Root Agents Guide
    Path: ../../../AGENTS.md
  - Label: Root Workspace Guide
    Path: ../../../WORKSPACE_GUIDE.md
  - Label: Project Agents Guide
    Path: ./AGENTS.md
  - Label: Project Guide
    Path: ./GUIDE.md
---

# Fathym MSAL for Deno

Deno-focused implementation of the Microsoft Authentication Library, leveraging
`msal-node` to enable Azure AD auth flows for Deno runtimes (including Fresh).

- **Goal:** provide a reliable MSAL wrapper with clear examples for Deno apps
  and micro frontends.
- **Outputs:** library code, usage docs, and packaging for Deno/npm as
  required.
- **Code location:** this folder currently hosts the source; link external repos
  if the implementation moves.

## Current Status

- Based on the Microsoft tutorial for MSAL Node; see
  [msal-tutorial](https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-nodejs-webapp-msal)
  for the upstream guide.
- Tasks available: `deno task test`, `deno task build`, `deno task deploy`,
  `deno task publish:check`, `deno task npm:build/publish`.
- Packaging and version pins not yet captured in `UPSTREAM.md`.

## Getting Started with MSAL in Deno Fresh

To get started with MSAL for Deno, add the following to your `deno.json`
configuration file:

```json
{
  "imports": {
    "@fathym/msal": "https://deno.land/x/msal@${VERSION}/mod.ts",
    "$fresh/session": "https://deno.land/x/fresh_session@${VERSION}/mod.ts",
    "preact": "https://esm.sh/preact@${VERSION}",
    "preact/": "https://esm.sh/preact@${VERSION}/",
    "preact-render-to-string": "https://esm.sh/*preact-render-to-string@${VERSION}"
  }
}
```

Configure MSAL in a new `msal.config.ts` file (Fresh example):

```ts
import * as msal from 'npm:@azure/msal-node@2.1.0';
import { Configuration } from 'npm:@azure/msal-node@2.1.0';
import { MSALAuthProvider, MSALPluginConfiguration } from '@fathym/msal';
import { denoKv } from './deno-kv.config.ts';

export const msalCryptoProvider = new msal.CryptoProvider();

export const msalConfig: Configuration = {
  auth: {
    clientId: Deno.env.get('AZURE_CLIENT_ID')!,
    authority: `https://login.microsoftonline.com/${Deno.env.get('AZURE_TENANT_ID')}`,
    clientSecret: Deno.env.get('AZURE_CLIENT_SECRET')!,
  },
  system: {
    loggerOptions: {
      loggerCallback(...args: unknown[]) {
        console.log(...args);
      },
      logLevel: msal.LogLevel.Verbose,
      piiLoggingEnabled: false,
    },
  },
};

export const msalPluginConfig: MSALPluginConfiguration = {
  cachePluginConfig: {
    cachePlugin: denoKv(
      Deno.env.get('MSAL_CACHE_CONNECTION_STRING')!,
    ),
  },
  kv: {
    provision: true,
  },
  NodeCacheManager: msal.NodeStorage,
};
```

The upstream Microsoft tutorial explains how to sign in users and acquire
tokens for Microsoft Graph. This implementation aims to provide the same
functionality for Deno. Deno Fresh examples above apply; using this with other
frameworks is possible—pull requests are welcome to expand the documentation.

## How to Work in This Pod

1. Review the root and portfolio Instruction Documents plus this project’s
   [`AGENTS`](./AGENTS.md) and [`GUIDE`](./GUIDE.md).
2. Declare intent before editing; summarize outcomes and open questions in this
   README or a short log.
3. Capture provenance, release channels, and packaging details in `UPSTREAM.md`
  ; keep npm/deno references in sync.
4. Keep links relative; reference implementation repos/branches when selected.
5. Record prompts/scripts used when designing auth flows or automations.
