import React, { useId, useMemo, useRef, useState } from "react";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import Spinner from "../Spinner/Spinner.jsx";
import {
  createFileUploadPayload,
  fileKey,
  formatFileSize,
  validateUploadFiles,
} from "./fileUpload.js";
import "./FileUploader.styles.scss";

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/** Validates file presentation constraints and delegates storage rules to a host transport. */
export default function FileUploader({
  id,
  label = "Upload files",
  description,
  value = [],
  onChange,
  onFilesSelected,
  onUploadComplete,
  onError,
  transport,
  accept = "*/*",
  maxFileSize,
  minFileSize,
  maxFiles = 1,
  multiple = maxFiles > 1,
  disabled = false,
  readOnly = false,
  disableKeyboard = false,
  error,
  variant = "dropzone",
  payloadMode = "multipart",
  fieldName,
  metadata,
  autoUpload = true,
  selectionOnly = false,
  showFileList = true,
  canRemove = true,
  renderPreview,
  renderFileActions,
  className = "",
}) {
  const generatedId = useId();
  const inputId = id || `trem-uploader-${generatedId.replaceAll(":", "")}`;
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localErrors, setLocalErrors] = useState([]);
  const [selected, setSelected] = useState([]);
  const existing = useMemo(() => asList(value), [value]);
  const locked = disabled || readOnly || busy;

  const reportErrors = (errors) => {
    setLocalErrors(errors);
    if (errors.length) onError?.(errors);
  };
  const upload = async (files) => {
    if (!files.length) return;
    setBusy(true);
    setProgress(0);
    try {
      const payload = await createFileUploadPayload(files, {
        mode: payloadMode,
        fieldName,
        metadata,
      });
      const result =
        typeof transport === "function"
          ? await transport({ files, payload, metadata, onProgress: setProgress })
          : files;
      const uploaded = Array.isArray(result) ? result : result?.files || result?.items || [result];
      onUploadComplete?.(uploaded, { files, payloadMode });
      onChange?.(multiple ? [...existing, ...uploaded].slice(0, maxFiles) : (uploaded[0] ?? null));
      setSelected([]);
      setProgress(100);
    } catch (uploadError) {
      reportErrors([
        { code: "upload_failed", message: uploadError?.message || "Upload failed. Try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const choose = async (fileList) => {
    if (locked) return;
    const validation = validateUploadFiles(fileList, {
      accept,
      maxFileSize,
      minFileSize,
      maxFiles: multiple ? Math.max(0, maxFiles - existing.length) : 1,
      multiple,
    });
    reportErrors(validation.errors);
    const next = validation.validFiles.map((file) => ({ file, key: fileKey(file) }));
    setSelected(next);
    onFilesSelected?.(validation.validFiles);
    if (selectionOnly)
      onChange?.(multiple ? validation.validFiles : validation.validFiles[0] || null);
    if (autoUpload && next.length) await upload(next.map((item) => item.file));
  };
  const openPicker = () => {
    if (!locked) inputRef.current?.click();
  };
  const removeExisting = (index) => {
    if (!locked && canRemove)
      onChange?.(multiple ? existing.filter((_, current) => current !== index) : null);
  };
  const visibleError = error || localErrors[0]?.message;
  const acceptLabel =
    accept === "*/*" ? "Any supported file" : String(accept).replaceAll(",", ", ");

  return (
    <section
      className={`trem-uploader trem-uploader--${variant}${dragging ? " is-dragging" : ""}${locked ? " is-disabled" : ""}${visibleError ? " has-error" : ""} ${className}`.trim()}
    >
      <div
        className="trem-uploader__dropzone"
        role="button"
        tabIndex={locked || disableKeyboard ? -1 : 0}
        aria-disabled={locked}
        aria-describedby={`${inputId}-help${visibleError ? ` ${inputId}-error` : ""}`}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (!disableKeyboard && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="trem-uploader__input"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={locked}
          onChange={(event) => {
            choose(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="trem-uploader__icon" aria-hidden="true">
          {busy ? <Spinner size="md" /> : <Icon name="cloud" size={22} />}
        </span>
        <span className="trem-uploader__copy">
          <strong>{busy ? "Uploading…" : label}</strong>
          <span id={`${inputId}-help`}>
            {description ||
              `${acceptLabel} · up to ${formatFileSize(maxFileSize || 10 * 1024 * 1024)}`}
          </span>
        </span>
        {variant !== "compact" && !readOnly && (
          <Button
            type="button"
            variant="outline"
            color="primary"
            text="Browse"
            disabled={locked}
            onClick={(event) => {
              event.stopPropagation();
              openPicker();
            }}
          />
        )}
      </div>
      {busy && (
        <div className="trem-uploader__progress" aria-label={`Upload ${progress}% complete`}>
          <span style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
      )}
      {visibleError && (
        <p className="trem-uploader__error" id={`${inputId}-error`} role="alert">
          <Icon name="alertTriangle" size={15} />
          {visibleError}
        </p>
      )}
      {showFileList && (existing.length > 0 || selected.length > 0) && (
        <ul className="trem-uploader__files">
          {existing.map((item, index) => (
            <li key={item?.id || item?.url || item?.name || `${String(item)}-${index}`}>
              {renderPreview?.(item, index) ||
                (typeof item === "string" && item.match(/^https?:/) ? (
                  <img src={item} alt="" />
                ) : (
                  <Icon name="download" size={18} />
                ))}
              <span>
                {item?.name ||
                  item?.fileName ||
                  (typeof item === "string" ? item.split("/").pop() : `File ${index + 1}`)}
              </span>
              {renderFileActions?.(item, index)}
              {!readOnly && canRemove && (
                <button
                  type="button"
                  onClick={() => removeExisting(index)}
                  disabled={locked}
                  aria-label={`Remove file ${index + 1}`}
                >
                  <Icon name="x" size={15} />
                </button>
              )}
            </li>
          ))}
          {!autoUpload &&
            selected.map(({ file, key }) => (
              <li key={key}>
                <Icon name="download" size={18} />
                <span>
                  {file.name}
                  <small>{formatFileSize(file.size)}</small>
                </span>
              </li>
            ))}
        </ul>
      )}
      {!autoUpload && !selectionOnly && selected.length > 0 && (
        <Button
          variant="solid"
          color="primary"
          text={`Upload ${selected.length} file${selected.length === 1 ? "" : "s"}`}
          disabled={locked}
          onClick={() => upload(selected.map((item) => item.file))}
        />
      )}
    </section>
  );
}
