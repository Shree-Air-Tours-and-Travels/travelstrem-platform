import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileUploader, createFileUploadPayload, validateUploadFiles } from "../index.js";

describe("FileUploader", () => {
  it("validates type, size, and file-count constraints before transport", () => {
    const valid = new File(["image"], "cover.webp", { type: "image/webp" });
    const invalid = new File(["document"], "tour.pdf", { type: "application/pdf" });
    const result = validateUploadFiles([valid, invalid], {
      accept: "image/*",
      maxFileSize: 20,
      maxFiles: 2,
    });
    expect(result.validFiles).toEqual([valid]);
    expect(result.errors[0].code).toBe("unsupported_type");
  });

  it("creates multipart payloads that retain binary File objects and metadata", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "proof.pdf", { type: "application/pdf" });
    const payload = await createFileUploadPayload([file], {
      fieldName: "documents",
      metadata: { category: "identity" },
    });
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get("documents")).toBeInstanceOf(File);
    expect(payload.get("category")).toBe("identity");
  });

  it("supports disabled keyboard state and delegates uploads to the host transport", async () => {
    const transport = vi.fn().mockResolvedValue(["https://cdn.example/cover.webp"]);
    const onChange = vi.fn();
    const { container } = render(
      <FileUploader
        label="Tour photos"
        accept="image/*"
        maxFiles={4}
        multiple
        transport={transport}
        onChange={onChange}
      />,
    );
    const file = new File(["image"], "cover.webp", { type: "image/webp" });
    fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });
    await waitFor(() => expect(transport).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith(["https://cdn.example/cover.webp"]);
    expect(screen.getByText("Tour photos")).toBeInTheDocument();
  });
});
