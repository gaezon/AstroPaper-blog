// Feature: agent-readiness-optimization, Property 14: Unknown /api paths return 404 Error_Envelope
// **Validates: Requirements 4.5, 8.5**
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import {
  startPreviewServer,
  stopPreviewServer,
  hasStaticOutput,
} from "../helpers/preview-server";
import envelopeSchema from "../../src/schemas/error-envelope.schema.json" with { type: "json" };

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(envelopeSchema);

describe.skipIf(!hasStaticOutput())(
  "API JSON 404 via preview server (P14)",
  () => {
    let baseUrl: string;

    beforeAll(async () => {
      baseUrl = await startPreviewServer();
    });

    afterAll(async () => {
      await stopPreviewServer();
    });

    it("GET /api/does-not-exist.json returns 404 with Error_Envelope", async () => {
      const response = await fetch(`${baseUrl}/api/does-not-exist.json`);
      expect(response.status).toBe(404);
      expect(
        response.headers.get("content-type")?.startsWith("application/json")
      ).toBe(true);

      const body = await response.json();
      const valid = validate(body);
      expect(valid, JSON.stringify(validate.errors)).toBe(true);
      expect(body.error.status).toBe(404);
      expect(body.error.documentation_url).toContain("agent-integration.md");
    });

    it("GET /api/nested/path/unknown returns 404 with Error_Envelope", async () => {
      const response = await fetch(`${baseUrl}/api/nested/path/unknown`);
      expect(response.status).toBe(404);

      const body = await response.json();
      const valid = validate(body);
      expect(valid, JSON.stringify(validate.errors)).toBe(true);
      expect(body.error.code).toMatch(/^[a-z][a-z0-9_]*$/);
    });

    it("GET /api (bare) returns 404 with Error_Envelope", async () => {
      const response = await fetch(`${baseUrl}/api`);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.status).toBe(404);
    });
  }
);
