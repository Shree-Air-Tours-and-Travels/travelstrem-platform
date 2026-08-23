import React, { act } from "react";
import { createRoot } from "react-dom/client";
import LoginPrompt from "./LoginPrompt";

jest.mock("@packages/trem-ui", () => ({
  Button: ({ text, onClick }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
  Icon: () => null,
  Paragraph: ({ text }) => <p>{text}</p>,
  Title: ({ text }) => <h1>{text}</h1>,
}));

jest.mock(
  "@packages/trem-modals",
  () => ({
    ModalShell: ({ children }) => <div>{children}</div>,
  }),
  { virtual: true },
);

test("the welcome close action continues as guest exactly once", () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const onContinueAsGuest = jest.fn();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<LoginPrompt onContinueAsGuest={onContinueAsGuest} />));

  const closeButton = document.querySelector('button[aria-label="Continue as guest"]');
  act(() => closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));

  expect(onContinueAsGuest).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  container.remove();
});
