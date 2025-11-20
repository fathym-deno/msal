---
FrontmatterVersion: 1
DocumentType: Guide
Title: MSAL for Deno Guide
Summary: Playbook for maintaining the Fathym MSAL wrapper for Deno and Azure AD auth flows.
Created: 2025-11-20
Updated: 2025-11-20
Owners:
  - fathym
References:
  - Label: Project README
    Path: ./README.md
  - Label: Project Agents Guide
    Path: ./AGENTS.md
  - Label: Projects: Ref-Arch README
    Path: ../README.md
  - Label: Projects: Ref-Arch Guide
    Path: ../GUIDE.md
  - Label: Root Workspace Guide
    Path: ../../../WORKSPACE_GUIDE.md
---

# MSAL for Deno Guide

Use this playbook to keep the MSAL wrapper predictable, secure, and discoverable.

## Current Focus

- Align API surface with upstream `msal-node` while keeping Deno ergonomics
  (Fresh, standalone, and other frameworks).
- Document installation and configuration paths for Deno/npm distribution.
- Provide tested examples for common flows (sign-in, token acquisition, Graph
  calls) and caching strategies.

## Workflow

1. **Align scope** in [`README.md`](./README.md): clarify intended change
   (feature, fix, release prep) and target repo/branch if code moves.
2. **Design & docs**: capture auth flow examples in `docs/` (create if needed)
   with frontmatter and links to upstream Microsoft guidance.
3. **Capture provenance**: record upstream source, release channels, and version
   pins in `UPSTREAM.md` once publishing to deno.land/jsr/npm.
4. **Validate behavior**: run `deno task test` and `deno task build`; for npm
   packaging use `deno task npm:build` and `npm:publish` when releasing.
5. **Communicate breaking changes**: document migration notes (scopes, cache
   behavior, config shapes) and notify consumers before release.

## Verification

- Ensure links stay relative and parent guides remain discoverable.
- Keep the roster entry in `../README.md` current when docs or status change.
- When workspace tasks exist, also run: `deno task prompts:verify-frontmatter`,
  `deno task link:verify`, `deno task workspace:check`.
