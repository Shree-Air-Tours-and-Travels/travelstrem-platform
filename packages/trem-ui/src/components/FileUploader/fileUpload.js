const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const fileKey = (file) => [file?.name, file?.size, file?.lastModified].join("-");

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(Number(bytes)) / Math.log(1024)), units.length - 1);
  const value = Number(bytes) / (1024 ** index);
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function acceptedByRule(file, rule) {
  const token = String(rule || "").trim().toLowerCase();
  if (!token || token === "*/*") return true;
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (token.startsWith(".")) return name.endsWith(token);
  if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
  return type === token;
}

export function validateUploadFiles(inputFiles, options = {}) {
  const files = Array.from(inputFiles || []);
  const accept = Array.isArray(options.accept) ? options.accept : String(options.accept || "").split(",");
  const maxFileSize = Number(options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE);
  const minFileSize = Number(options.minFileSize ?? 1);
  const maxFiles = Number(options.maxFiles ?? (options.multiple === false ? 1 : Number.POSITIVE_INFINITY));
  const errors = [];
  const validFiles = [];

  if (files.length > maxFiles) errors.push({ code: "too_many_files", message: `Choose no more than ${maxFiles} file${maxFiles === 1 ? "" : "s"}.` });
  files.slice(0, maxFiles).forEach((file) => {
    if (accept.some(Boolean) && !accept.some((rule) => acceptedByRule(file, rule))) {
      errors.push({ file, code: "unsupported_type", message: `${file.name} is not a supported file type.` });
    } else if (Number(file.size) > maxFileSize) {
      errors.push({ file, code: "file_too_large", message: `${file.name} exceeds ${formatFileSize(maxFileSize)}.` });
    } else if (Number(file.size) < minFileSize) {
      errors.push({ file, code: "file_too_small", message: `${file.name} is empty or below the minimum size.` });
    } else validFiles.push(file);
  });
  return { validFiles, errors };
}

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error || new Error("Could not read file."));
  reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
  reader.readAsDataURL(file);
});

export async function createFileUploadPayload(files, options = {}) {
  const list = Array.from(files || []);
  const mode = options.mode || "multipart";
  const fieldName = options.fieldName || (list.length > 1 ? "files" : "file");
  const metadata = options.metadata || {};
  if (mode === "arrayBuffer") return Promise.all(list.map(async (file) => ({ name: file.name, type: file.type, size: file.size, bytes: await file.arrayBuffer() })));
  if (mode === "base64") return Promise.all(list.map(async (file) => ({ name: file.name, type: file.type, size: file.size, data: await toBase64(file) })));
  const body = new FormData();
  list.forEach((file) => body.append(fieldName, file, file.name));
  Object.entries(metadata).forEach(([key, value]) => {
    if (value != null) body.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  return body;
}

export const DEFAULT_UPLOAD_MAX_SIZE = DEFAULT_MAX_FILE_SIZE;
