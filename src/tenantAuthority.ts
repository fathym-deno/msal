/**
 * 🔑 **TENANT-SCOPED SIGN-IN — the validator, and why it is duplicated on
 * purpose.**
 *
 * `/subscriptions` is scoped by the TOKEN's tenant, and the token's tenant is
 * fixed by the AUTHORITY it was acquired under. The SILENT path can already
 * override `authority` per request; the INTERACTIVE path structurally could not,
 * because `MSALSignInOptions` had no authority slot and the sign-in route read
 * exactly one query param.
 *
 * ## 🔴 THE VALUE REACHES AN IDENTITY ENDPOINT, SO THE SHAPE IS CLOSED
 *
 * A tenant identifier arrives from a QUERY PARAM and is interpolated into
 * `https://login.microsoftonline.com/{tenant}` — **the URL MSAL will go and talk
 * to.** An unvalidated value is a path injection into an identity endpoint, so
 * only two shapes are accepted:
 *
 * - a **GUID**, which is what Entra actually returns, or
 * - a bare **directory domain** such as `contoso.onmicrosoft.com`.
 *
 * ⛔ Nothing containing `/`, `\`, `?`, `#`, `@`, a scheme or percent-encoding is
 * accepted — those are the characters that let a value climb out of the path.
 *
 * ## ⚠️ THIS IS A HAND-MAINTAINED CROSS-REPO INVARIANT, AND SAYING SO IS THE POINT
 *
 * `open-industrial-workspace-runtime` carries the SAME closed shape in
 * `src/utils/tenantScopedToken.ts`, because **`@fathym/msal` cannot import from a
 * consuming runtime.** ⛔ It is not DRY-able: these are different packages on
 * different release trains. ⇒ 🔒 **both sides pin the accepted and rejected
 * shapes in a test**, which is the only thing that keeps them from drifting into
 * two different definitions of "valid tenant".
 */

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DOMAIN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * ENTRA'S THREE DIRECTORY-INDEPENDENT AUTHORITIES, AND THEY ARE NOT AN
 * EXCEPTION TO THE RULE -- THEY ARE PART OF IT.
 *
 * `common`, `organizations` and `consumers` are authority path segments Entra
 * defines, and they are what a MULTI-TENANT app configures when it deliberately
 * does not pin sign-in to one directory. `AZURE_AD_TENANT_ID=organizations` is
 * exactly that configuration, and it is what this platform ships.
 *
 * OMITTING THEM WAS A REAL DEFECT AND IT CRASHED A RUNTIME AT BOOT.
 * `EaCMSALProcessorHandlerResolver` validates a STORED `TenantID` through
 * `buildTenantAuthority`, which THROWS rather than falling back -- so a shape
 * derived from the new `?tenant=` query-param path got applied to an EXISTING
 * config path that legitimately carries these three, and the process exited
 * before it served a single request.
 *
 * They are safe by the same test as everything else here: no `/`, backslash,
 * `?`, `#`, `@`, scheme or percent-encoding, so nothing can climb out of the
 * path segment.
 */
const SPECIAL_AUTHORITIES = new Set(["common", "organizations", "consumers"]);

/** Whether `tenantID` is a shape we will interpolate into an authority URL. */
export function isAcceptableTenantID(tenantID: unknown): boolean {
  if (typeof tenantID !== "string") return false;

  const t = tenantID.trim();

  if (!t || t.length > 253) return false;

  if (SPECIAL_AUTHORITIES.has(t.toLowerCase())) return true;

  return GUID.test(t) || DOMAIN.test(t);
}

/**
 * Build the per-request authority for `tenantID`.
 *
 * @throws when `tenantID` is not an acceptable shape.
 *
 * 🔴 **A THROW, ⛔ NEVER A FALLBACK.** Falling back to the configured authority
 * here produces a silently wrong-tenant token — the caller asked for directory
 * B, got a token for directory A, and every downstream check answers correctly
 * about the wrong object. **A loud refusal is the only safe failure.**
 */
export function buildTenantAuthority(
  tenantID: string,
  instance = "https://login.microsoftonline.com",
): string {
  if (!isAcceptableTenantID(tenantID)) {
    throw new Error(
      "The selected tenant identifier is not a valid Azure directory id.",
    );
  }

  return `${instance.replace(/\/+$/, "")}/${tenantID.trim()}`;
}
