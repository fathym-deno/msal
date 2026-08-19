import { assert, assertEquals, assertThrows } from "../test.deps.ts";
import {
  buildTenantAuthority,
  isAcceptableTenantID,
} from "../../src/tenantAuthority.ts";

/**
 * A tenant identifier reaches an IDENTITY ENDPOINT URL, so these tests are the
 * boundary rather than a formatting nicety.
 *
 * ⚠️ THE ACCEPTED AND REJECTED SHAPES ARE PINNED BECAUSE THEY ARE A
 * HAND-MAINTAINED CROSS-REPO INVARIANT. `open-industrial-workspace-runtime`
 * carries the same closed shape in `src/utils/tenantScopedToken.ts`, and
 * `@fathym/msal` cannot import from a consuming runtime. Nothing type-checks one
 * against the other, so a drift in either direction is only visible here.
 */

const GUID = "6dcbebd0-1111-2222-3333-444455556666";

Deno.test("isAcceptableTenantID — accepts what Entra actually returns", async (t) => {
  await t.step("a GUID", () => assert(isAcceptableTenantID(GUID)));

  await t.step(
    "a GUID is case-insensitive",
    () => assert(isAcceptableTenantID(GUID.toUpperCase())),
  );

  await t.step(
    "a directory domain",
    () => assert(isAcceptableTenantID("contoso.onmicrosoft.com")),
  );

  await t.step(
    "a hyphenated directory domain",
    () => assert(isAcceptableTenantID("contoso-uk.onmicrosoft.com")),
  );

  await t.step(
    "surrounding whitespace is trimmed, not rejected",
    () => assert(isAcceptableTenantID(`  ${GUID}  `)),
  );
});

Deno.test("🔴 isAcceptableTenantID — refuses everything that could climb out of the path", async (t) => {
  /*
   * ⛔ These are not style violations. Each one, interpolated into
   * `https://login.microsoftonline.com/{tenant}`, changes WHICH SERVER MSAL
   * TALKS TO or what it asks for.
   */
  const injections: Array<[string, string]> = [
    ["a path escape", "../../evil"],
    ["a slash", "tenant/evil"],
    ["a backslash", "tenant\evil"],
    ["a query", "tenant?x=1"],
    ["a fragment", "tenant#x"],
    ["an at sign", "tenant@evil.com"],
    ["a scheme", "https://evil.com"],
    ["a protocol-relative host", "//evil.com"],
    ["percent-encoding", "tenant%2fevil"],
    ["whitespace inside", "ten ant"],
    ["empty", ""],
    ["whitespace only", "   "],
  ];

  for (const [why, value] of injections) {
    await t.step(
      `refuses ${why}`,
      () =>
        assertEquals(
          isAcceptableTenantID(value),
          false,
          `accepted ${JSON.stringify(value)}`,
        ),
    );
  }

  await t.step("refuses a non-string", () => {
    assertEquals(isAcceptableTenantID(undefined), false);
    assertEquals(isAcceptableTenantID(null), false);
    assertEquals(isAcceptableTenantID(42), false);
  });

  await t.step("refuses an over-long value", () => {
    assertEquals(isAcceptableTenantID(`${"a".repeat(250)}.com`), false);
  });
});

Deno.test("buildTenantAuthority — builds the per-request authority", async (t) => {
  await t.step("from a GUID", () =>
    assertEquals(
      buildTenantAuthority(GUID),
      `https://login.microsoftonline.com/${GUID}`,
    ));

  await t.step("from a domain", () =>
    assertEquals(
      buildTenantAuthority("contoso.onmicrosoft.com"),
      "https://login.microsoftonline.com/contoso.onmicrosoft.com",
    ));

  await t.step(
    "a trailing slash on the instance is not doubled",
    () =>
      assertEquals(
        buildTenantAuthority(GUID, "https://login.microsoftonline.com/"),
        `https://login.microsoftonline.com/${GUID}`,
      ),
  );
});

Deno.test("🔴 buildTenantAuthority THROWS rather than falling back — the whole safety of the feature", async (t) => {
  /*
   * 🔑 A FALLBACK HERE WOULD BE WORSE THAN A CRASH. The caller asked for
   * directory B; a fallback hands them a token for directory A, and every
   * downstream check then answers CORRECTLY about the WRONG directory. That is
   * a plausible wrong answer, which is strictly harder to notice than a
   * failure.
   */
  for (const bad of ["../../evil", "https://evil.com", "", "tenant/evil"]) {
    await t.step(`throws on ${JSON.stringify(bad)}`, () => {
      assertThrows(() => buildTenantAuthority(bad));
    });
  }

  await t.step(
    "the message names the problem without echoing the input",
    () => {
      try {
        buildTenantAuthority("https://evil.com");
        throw new Error("expected a throw");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        assert(msg.includes("valid Azure directory id"));
        // ⛔ The refused value is NOT echoed back: this message can reach a log or
        // a response, and reflecting attacker-supplied input is its own defect.
        assertEquals(msg.includes("evil.com"), false);
      }
    },
  );
});
