import { describe, it, expect } from "vitest";
import { slugify } from "../helpers/slugify.js";

describe("slugify", () => {
  it("converts simple text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles underscores", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("hello   world---test")).toBe("hello-world-test");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("--hello-world--")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles strings with numbers", () => {
    expect(slugify("Tour 2024 Package")).toBe("tour-2024-package");
  });

  it("handles accented characters", () => {
    expect(slugify("café résumé")).toBe("caf-rsum");
  });
});
