import { describe, expect, it } from "vitest";
import { findCatalogFreshnessIssues, validateCatalog } from "./catalog-validation";
import { AIRLINES, CARDS } from "./data";

describe("rewards catalog", () => {
  it("contains structurally valid, sourced rules", () => {
    expect(validateCatalog(AIRLINES, CARDS)).toBe(true);
  });

  it("forces a quarterly source review", () => {
    expect(findCatalogFreshnessIssues(AIRLINES, CARDS)).toEqual([]);
  });
});
