const BASE_PAGE_SCHEMA = {
  required: ["status", "component"],
  properties: {
    status: {
      type: "string",
      enum: ["success", "error"],
      required: true,
    },
    component: {
      type: "object",
      required: true,
      properties: {
        data: {
          type: "object",
          required: true,
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            description: { type: "string" },
            itemIds: { type: "array" },
          },
        },
        elements: {
          type: "object",
          required: true,
          properties: {
            labels: { type: "object", required: true },
            urls: { type: "object" },
          },
        },
        structure: {
          type: "object",
          required: true,
        },
      },
    },
  },
};

class ContractValidationError extends Error {
  constructor(errors) {
    super("Page definition contract validation failed");
    this.name = "ContractValidationError";
    this.errors = errors;
  }
}

function validateType(value, definition, path) {
  const errors = [];

  if (definition.required && (value === undefined || value === null)) {
    errors.push({ path, message: `Required field missing` });
    return errors;
  }

  if (value === undefined || value === null) return errors;

  if (definition.type === "string" && typeof value !== "string") {
    errors.push({ path, message: `Expected string, got ${typeof value}` });
  }

  if (definition.type === "object" && (typeof value !== "object" || Array.isArray(value) || value === null)) {
    errors.push({ path, message: `Expected object, got ${typeof value}` });
  }

  if (definition.type === "array" && !Array.isArray(value)) {
    errors.push({ path, message: `Expected array, got ${typeof value}` });
  }

  if (definition.enum && !definition.enum.includes(value)) {
    errors.push({ path, message: `Expected one of: ${definition.enum.join(", ")}` });
  }

  if (definition.properties && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, propDef] of Object.entries(definition.properties)) {
      const childPath = path ? `${path}.${key}` : key;
      errors.push(...validateType(value[key], propDef, childPath));
    }
  }

  return errors;
}

function validatePageDefinition(payload) {
  const errors = validateType(payload, { type: "object", properties: BASE_PAGE_SCHEMA.properties }, "root");

  if (errors.length > 0) {
    throw new ContractValidationError(errors);
  }

  return { valid: true };
}

function hasHardcodedStrings(structure) {
  const warnings = [];
  const stringPattern = /[A-Z][a-z]+/g;

  function walk(obj, path = "") {
    if (typeof obj === "string") {
      if (stringPattern.test(obj) && obj.length > 1) {
        const parentPath = path.substring(0, path.lastIndexOf("."));
        if (!parentPath.endsWith("Ref") && !parentPath.endsWith("Ref")) {
          const isLikelyLabel = obj.match(/[A-Z][a-z]+/g)?.length >= 2;
          const isUrl = obj.startsWith("/") || obj.startsWith("http");
          if (isLikelyLabel && !isUrl) {
            warnings.push({
              path,
              value: obj,
              message: "Possible hardcoded UI string in structure. Use labelRef instead.",
            });
          }
        }
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => walk(item, `${path}[${idx}]`));
      return;
    }

    if (obj && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        walk(value, path ? `${path}.${key}` : key);
      }
    }
  }

  walk(structure, "structure");
  return warnings;
}

function validateLabelRefs(structure, labels) {
  const missing = [];

  function walk(obj, path = "") {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (key.endsWith("Ref") && typeof value === "string") {
        if (!(value in labels)) {
          missing.push({
            ref: value,
            path: currentPath,
            message: `labelRef "${value}" not found in elements.labels`,
          });
        }
        continue;
      }

      if (typeof value === "object") {
        walk(value, currentPath);
      }
    }
  }

  walk(structure);
  return missing;
}

function validationMiddleware(options = {}) {
  const {
    strict = false,
    checkHardcoded = true,
    checkLabelRefs = true,
  } = options;

  return function pageDefinitionValidator(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (body && body.component) {
        try {
          validatePageDefinition(body);

          if (checkHardcoded && body.component.structure) {
            const warnings = hasHardcodedStrings(body.component.structure);
            if (warnings.length > 0 && process.env.DEBUG) {
              console.warn("[PageDefValidator] Hardcoded string warnings:", warnings);
            }
          }

          if (checkLabelRefs && body.component.structure && body.component.elements?.labels) {
            const missing = validateLabelRefs(body.component.structure, body.component.elements.labels);
            if (missing.length > 0) {
              if (strict) {
                return res.status(500).json({
                  status: "error",
                  message: "Page definition contract validation failed",
                  errors: missing,
                });
              }
              if (process.env.DEBUG) {
                console.warn("[PageDefValidator] Missing labelRefs:", missing);
              }
            }
          }
        } catch (err) {
          if (err instanceof ContractValidationError) {
            if (strict) {
              return res.status(500).json({
                status: "error",
                message: err.message,
                errors: err.errors,
              });
            }
            if (process.env.DEBUG) {
              console.warn("[PageDefValidator] Contract validation warnings:", err.errors);
            }
          }
        }
      }

      return originalJson(body);
    };

    next();
  };
}

export {
  validatePageDefinition,
  hasHardcodedStrings,
  validateLabelRefs,
  ContractValidationError,
  validationMiddleware,
};

export default validationMiddleware;
