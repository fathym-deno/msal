---
FrontmatterVersion: 1
DocumentType: Guide
Title: MSAL for Deno Agents Guide
Summary: Guardrails for collaborating on the Fathym MSAL (Azure AD) wrapper for Deno.
Created: 2025-11-20
Updated: 2025-11-20
Owners:
  - fathym
References:
  - Label: Project README
    Path: ./README.md
  - Label: Project Guide
    Path: ./GUIDE.md
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
---

# AGENTS: MSAL for Deno

Guardrails for humans and AI collaborating on the Fathym MSAL wrapper.

## Core Guardrails

1. **Stay scoped.** Keep MSAL work under `projects/ref-arch/msal/` unless
   coordinating with another pod; link cross-pod dependencies (e.g.,
   micro-frameworks) explicitly.
2. **Frontmatter required.** Every Markdown doc uses frontmatter and
   document-relative references up to parent guides.
3. **Provenance & packaging.** Capture upstream sources (msal-node), release
   channels, and version pins in `UPSTREAM.md`; keep Deno/npm packaging details
   consistent.
4. **Security first.** Never commit secrets or tenant IDs; prefer env vars and
   local profiles. Document required permissions and scopes clearly.
5. **API stability.** Avoid breaking auth flows and helpers silently; add
   migration notes and notify known consumers (Fresh apps, services).

## Communication

- Declare intent before editing; summarize outcomes and next steps in the
  project README or a short log.
- Link implementation branches and consumer pods when behavior changes to keep
  dependencies aligned.
