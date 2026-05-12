// Feature: agent-readiness-optimization, Property 15: Error envelope builder enforces all field constraints
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

// The project uses the `@/*` TypeScript path alias, which is wired through
// Astro/Vite but not through Vitest's module resolver. Intercept the real
// SITE config so `src/utils/mcp.ts` can resolve its `@/config` import under
// the plain Vitest runner without touching any source file or shared config.
// `vi.mock` calls are hoisted above imports by Vitest.
vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

import { buildErrorEnvelope } from "../../src/utils/mcp";
import envelopeSchema from "../../src/schemas/error-envelope.schema.json" with { type: "json" };

// Ajv strict mode is disabled because the envelope schema carries a top-level
// `schemaVersion` sibling of `$schema` that is informational (not a JSON
// Schema keyword); strict mode would otherwise emit a warning.
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(envelopeSchema);

// Builders for valid error `code` strings that match /^[a-z][a-z0-9_]*$/
// with length 1..30. Building manually avoids relying on `fc.stringMatching`
// semantics across fast-check versions.
const ALPHA_LOWERS = "abcdefghijklmnopqrstuvwxyz".split("");
const ALPHA_NUMERICS_LOWERS = [...ALPHA_LOWERS, ..."0123456789".split(""), "_"];

const validCodeArb = fc
  .tuple(
    fc.constantFrom(...ALPHA_LOWERS),
    fc.array(fc.constantFrom(...ALPHA_NUMERICS_LOWERS), { maxLength: 29 })
  )
  .map(([first, rest]) => first + rest.join(""));

const validMessageArb = fc.string({ minLength: 1, maxLength: 500 });
const validStatusArb = fc.integer({ min: 400, max: 599 });

describe("buildErrorEnvelope (P15)", () => {
  it("valid inputs produce schema-valid envelopes", () => {
    // Validates: Requirements 4.6, 8.8
    fc.assert(
      fc.property(
        fc.record({
          code: validCodeArb,
          message: validMessageArb,
          status: validStatusArb,
        }),
        ({ code, message, status }) => {
          const result = buildErrorEnvelope({ code, message, status });

          const ok = validate(result);
          expect(ok, JSON.stringify(validate.errors)).toBe(true);

          // Round-trip: JSON.parse(JSON.stringify(envelope)) deep-equals the
          // original envelope (Property 13 plain-JSON guarantee).
          const parsed = JSON.parse(JSON.stringify(result));
          expect(parsed).toEqual(result);

          // documentation_url must be an absolute URL.
          expect(() => new URL(result.error.documentation_url)).not.toThrow();

          // Field values are preserved unchanged by the builder.
          expect(result.error.code).toBe(code);
          expect(result.error.message).toBe(message);
          expect(result.error.status).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("valid inputs with availableResources produce schema-valid envelopes", () => {
    // Validates: Requirements 4.6, 8.8
    fc.assert(
      fc.property(
        fc.record({
          code: validCodeArb,
          message: validMessageArb,
          status: validStatusArb,
          availableResources: fc.array(fc.webUrl(), {
            minLength: 1,
            maxLength: 10,
          }),
        }),
        ({ code, message, status, availableResources }) => {
          const result = buildErrorEnvelope({
            code,
            message,
            status,
            availableResources,
          });

          const ok = validate(result);
          expect(ok, JSON.stringify(validate.errors)).toBe(true);

          const parsed = JSON.parse(JSON.stringify(result));
          expect(parsed).toEqual(result);

          expect(result.error.availableResources).toEqual(availableResources);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("invalid code throws", () => {
    // Validates: Requirements 4.6, 8.8
    const invalidCodeArb = fc.oneof(
      fc.constant(""),
      fc.constant("INVALID"),
      fc.string().filter(s => !/^[a-z][a-z0-9_]*$/.test(s)),
      fc
        .integer()
        .map(String)
        .filter(s => !/^[a-z][a-z0-9_]*$/.test(s))
    );

    fc.assert(
      fc.property(invalidCodeArb, code => {
        expect(() =>
          buildErrorEnvelope({ code, message: "ok", status: 404 })
        ).toThrow(/buildErrorEnvelope: "code"/);
      }),
      { numRuns: 100 }
    );
  });

  it("out-of-range message length throws", () => {
    // Validates: Requirements 4.6, 8.8
    const invalidMessageArb = fc.oneof(
      fc.constant(""),
      fc.string({ minLength: 501, maxLength: 600 })
    );

    fc.assert(
      fc.property(invalidMessageArb, message => {
        expect(() =>
          buildErrorEnvelope({ code: "ok", message, status: 404 })
        ).toThrow(/"message" length must be 1\.\.500/);
      }),
      { numRuns: 100 }
    );
  });

  it("out-of-range or non-integer status throws", () => {
    // Validates: Requirements 4.6, 8.8
    const invalidStatusArb = fc.oneof(
      fc.integer({ min: -1000, max: 399 }),
      fc.integer({ min: 600, max: 1000 }),
      fc
        .double({ min: 400.5, max: 599.5, noNaN: true })
        .filter(n => !Number.isInteger(n))
    );

    fc.assert(
      fc.property(invalidStatusArb, status => {
        expect(() =>
          buildErrorEnvelope({ code: "ok", message: "ok", status })
        ).toThrow(/"status" must be an integer in \[400, 599\]/);
      }),
      { numRuns: 100 }
    );
  });

  it("invalid availableResources entry throws", () => {
    // Validates: Requirements 4.6, 8.8
    const invalidAvailableResourcesArb = fc
      .array(fc.webUrl(), { maxLength: 5 })
      .chain(arr =>
        fc.nat({ max: arr.length }).map(idx => {
          const out = [...arr];
          out.splice(idx, 0, "");
          return out;
        })
      );

    fc.assert(
      fc.property(invalidAvailableResourcesArb, availableResources => {
        expect(() =>
          buildErrorEnvelope({
            code: "ok",
            message: "ok",
            status: 404,
            availableResources,
          })
        ).toThrow(/"availableResources\[\d+\]" must be a non-empty string/);
      }),
      { numRuns: 100 }
    );
  });
});
