import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalShell from "../../../trem-modals/src/ModalShell.jsx";

describe("ModalShell", () => {
  it("does not close from the shared backdrop by default", () => {
    const onClose = vi.fn();
    const onPageClick = vi.fn();
    render(
      <div onClick={onPageClick}>
        <ModalShell open label="Example modal" onClose={onClose}>
          Content
        </ModalShell>
      </div>,
    );

    fireEvent.click(document.querySelector(".trem-modal-shell__backdrop"));

    expect(screen.getByRole("dialog", { name: "Example modal" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onPageClick).not.toHaveBeenCalled();
  });

  it("supports explicit outside-click dismissal", () => {
    const onClose = vi.fn();
    render(
      <ModalShell open label="Example modal" closeOnOutsideClick onClose={onClose}>
        Content
      </ModalShell>,
    );

    fireEvent.click(document.querySelector(".trem-modal-shell__backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
