import { describe, it, expect } from "vitest";
import {
  getActiveFilterCount,
  getOptionList,
  validateField,
  validateAll,
  validateFields,
} from "../filters/filterUtils.js";

describe("getActiveFilterCount", () => {
  it("returns 0 when no values differ from defaults", () => {
    expect(getActiveFilterCount({})).toBe(0);
    expect(getActiveFilterCount({ foo: "bar" }, { foo: "bar" })).toBe(0);
  });

  it("counts non-default values", () => {
    expect(getActiveFilterCount({ foo: "baz" }, { foo: "bar" })).toBe(1);
    expect(getActiveFilterCount({ a: "x", b: "y" }, { a: "a", b: "b" })).toBe(2);
  });

  it("counts non-empty arrays", () => {
    expect(getActiveFilterCount({ tags: ["adventure"] })).toBe(1);
    expect(getActiveFilterCount({ tags: [] })).toBe(0);
  });

  it("ignores null/undefined/empty string values", () => {
    expect(getActiveFilterCount({ a: null }, { a: "x" })).toBe(0);
    expect(getActiveFilterCount({ a: undefined }, { a: "x" })).toBe(0);
    expect(getActiveFilterCount({ a: "" }, { a: "x" })).toBe(0);
  });
});

describe("getOptionList", () => {
  it("returns field.options when present", () => {
    const field = { options: [{ value: "a", label: "A" }] };
    expect(getOptionList(field)).toEqual([{ value: "a", label: "A" }]);
  });

  it("returns server options by source key", () => {
    const field = { optionsSource: "cities" };
    const server = { cities: [{ value: "nyc", label: "NYC" }] };
    expect(getOptionList(field, server)).toEqual([{ value: "nyc", label: "NYC" }]);
  });

  it("returns server options by field name", () => {
    const field = { name: "destination" };
    const server = { destination: [{ value: "paris", label: "Paris" }] };
    expect(getOptionList(field, server)).toEqual([{ value: "paris", label: "Paris" }]);
  });

  it("returns empty array when no options found", () => {
    expect(getOptionList({ name: "x" })).toEqual([]);
    expect(getOptionList()).toEqual([]);
  });
});

describe("validateField", () => {
  describe("required fields", () => {
    it("returns error for empty required field", () => {
      const field = { type: "text", required: true };
      const result = validateField("name", "", field);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Required");
    });

    it("passes for empty optional field", () => {
      const field = { type: "text", required: false };
      const result = validateField("name", "", field);
      expect(result.ok).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("number type", () => {
    it("validates finite numbers", () => {
      const field = { type: "number" };
      expect(validateField("n", "abc", field).ok).toBe(false);
      expect(validateField("n", "42", field).ok).toBe(true);
    });

    it("validates integer constraint", () => {
      const field = { type: "number", integer: true };
      expect(validateField("n", "3.14", field).ok).toBe(false);
      expect(validateField("n", "7", field).ok).toBe(true);
    });

    it("validates min/max bounds", () => {
      const field = { type: "number", min: 10, max: 100 };
      expect(validateField("n", "5", field).ok).toBe(false);
      expect(validateField("n", "50", field).ok).toBe(true);
      expect(validateField("n", "200", field).ok).toBe(false);
    });

    it("uses validation sub-object", () => {
      const field = { type: "number", validation: { min: 1, max: 5 } };
      expect(validateField("n", "10", field).ok).toBe(false);
      expect(validateField("n", "3", field).ok).toBe(true);
    });
  });

  describe("email type", () => {
    it("accepts valid emails", () => {
      const field = { type: "email" };
      expect(validateField("email", "user@example.com", field).ok).toBe(true);
    });

    it("rejects invalid emails", () => {
      const field = { type: "email" };
      expect(validateField("email", "not-an-email", field).ok).toBe(false);
      expect(validateField("email", "@example.com", field).ok).toBe(false);
    });
  });

  describe("phone type", () => {
    it("accepts valid phone numbers", () => {
      const field = { type: "phone" };
      expect(validateField("phone", "+1234567890", field).ok).toBe(true);
      expect(validateField("phone", "9876543210", field).ok).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      const field = { type: "phone" };
      expect(validateField("phone", "abc", field).ok).toBe(false);
    });

    it("handles tel alias", () => {
      const field = { type: "tel" };
      expect(validateField("phone", "+1234567890", field).ok).toBe(true);
      expect(validateField("phone", "12", field).ok).toBe(false);
    });
  });

  describe("select type", () => {
    it("accepts value from options", () => {
      const field = { type: "select", options: [{ value: "a" }, { value: "b" }] };
      expect(validateField("sel", "a", field).ok).toBe(true);
    });

    it("rejects value not in options", () => {
      const field = { type: "select", options: [{ value: "a" }, { value: "b" }] };
      expect(validateField("sel", "c", field).ok).toBe(false);
    });
  });

  describe("multiselect type", () => {
    it("validates min/max items", () => {
      const field = {
        type: "multiselect",
        minItems: 1,
        maxItems: 3,
        options: [{ value: "a" }, { value: "b" }, { value: "c" }, { value: "d" }],
      };
      expect(validateField("ms", ["a"], field).ok).toBe(true);
      expect(validateField("ms", ["a", "b"], field).ok).toBe(true);
      expect(validateField("ms", ["a", "b", "c", "d"], field).ok).toBe(false);
    });

    it("rejects values not in options", () => {
      const field = { type: "multiselect", options: [{ value: "a" }, { value: "b" }] };
      expect(validateField("ms", ["a", "z"], field).ok).toBe(false);
    });
  });

  describe("text/textarea/password type", () => {
    it("validates minLength and maxLength", () => {
      const field = { type: "text", minLength: 3, maxLength: 10 };
      expect(validateField("t", "ab", field).ok).toBe(false);
      expect(validateField("t", "hello", field).ok).toBe(true);
      expect(validateField("t", "a".repeat(11), field).ok).toBe(false);
    });

    it("validates pattern", () => {
      const field = { type: "text", pattern: "^[A-Z]+$" };
      expect(validateField("t", "HELLO", field).ok).toBe(true);
      expect(validateField("t", "hello", field).ok).toBe(false);
    });
  });

  describe("date type", () => {
    it("validates valid dates", () => {
      const field = { type: "date" };
      expect(validateField("d", "2024-01-15", field).ok).toBe(true);
    });

    it("rejects invalid dates", () => {
      const field = { type: "date" };
      expect(validateField("d", "not-a-date", field).ok).toBe(false);
    });
  });

  describe("custom messages", () => {
    it("uses field-level messages", () => {
      const field = { type: "text", required: true, messages: { required: "Custom required" } };
      const result = validateField("name", "", field);
      expect(result.error).toBe("Custom required");
    });

    it("uses validation sub-object messages", () => {
      const field = {
        type: "text",
        required: true,
        validation: { messages: { required: "Nested required" } },
      };
      const result = validateField("name", "", field);
      expect(result.error).toBe("Nested required");
    });
  });
});

describe("validateAll / validateFields", () => {
  it("validates multiple fields", () => {
    const fields = {
      name: { type: "text", required: true },
      email: { type: "email", required: true },
    };
    const result = validateAll({ name: "", email: "" }, fields);
    expect(result.ok).toBe(false);
    expect(result.errors.name).toBe("Required");
    expect(result.errors.email).toBe("Required");
  });

  it("returns ok when all fields pass", () => {
    const fields = {
      name: { type: "text", required: true },
      email: { type: "email" },
    };
    const result = validateAll({ name: "Alice", email: "alice@example.com" }, fields);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("checks minPrice/maxPrice range", () => {
    const result = validateAll({ minPrice: 100, maxPrice: 50 }, {});
    expect(result.ok).toBe(false);
    expect(result.errors.minPrice).toBe("Min price must be below max");
  });

  it("checks arrivalDate/returnDate order", () => {
    const result = validateAll({ arrivalDate: "2024-06-20", returnDate: "2024-06-15" }, {});
    expect(result.ok).toBe(false);
    expect(result.errors.arrivalDate).toBe("Arrival must be before return");
  });

  it("skips date check if one date is missing", () => {
    const result = validateAll({ arrivalDate: "2024-06-20" }, {});
    expect(result.ok).toBe(true);
  });

  it("validateFields is alias of validateAll", () => {
    expect(validateFields).toBe(validateAll);
  });
});
