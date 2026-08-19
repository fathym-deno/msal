export type MSALSignInOptions = {
  RedirectURI: string;

  Scopes?: string[];

  SuccessRedirect: string;

  /**
   * 🔑 **Per-request authority — how a sign-in becomes TENANT-SCOPED.**
   *
   * `/subscriptions` is scoped by the TOKEN's tenant, and the token's tenant is
   * fixed by the AUTHORITY it was acquired under. Without this, an interactive
   * sign-in always lands in the configured directory, so a customer whose
   * subscriptions live in a NON-home tenant gets a correct-looking empty list.
   *
   * ⚠️ **OPTIONAL ON PURPOSE, AND THAT IS WHAT MAKES THIS A STRICT WIDENING.**
   * Every existing caller is unchanged, so consumers pinned to older versions
   * need not move — including `fathym-web-runtime`, which is on `main` where a
   * push is a production deploy.
   *
   * ⛔ **NEVER built from unvalidated input.** It is interpolated into the URL
   * MSAL talks to ▶️ `buildTenantAuthority`.
   */
  Authority?: string;

  /**
   * `prompt` passed through to the authorization request — e.g. `select_account`
   * so a user with sessions in several directories is asked which one.
   */
  Prompt?: string;

  /** `domain_hint`, to skip home-realm discovery when the directory is known. */
  DomainHint?: string;
};
