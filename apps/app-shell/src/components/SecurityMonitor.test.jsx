import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SecurityMonitor from "./SecurityMonitor";

jest.mock("../services/security", () => ({
  auditLog_event: jest.fn(),
  detectScriptInjection: jest.fn(() => false),
}));

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

test("keeps application forms while removing executable DOM nodes", async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <SecurityMonitor>
        <main>Application</main>
      </SecurityMonitor>,
    );
    await flushMutations();
  });

  const form = document.createElement("form");
  form.className = "application-form";
  const script = document.createElement("script");

  await act(async () => {
    document.body.appendChild(form);
    document.body.appendChild(script);
    await flushMutations();
  });

  expect(form.isConnected).toBe(true);
  expect(script.isConnected).toBe(false);

  form.remove();
  await act(async () => root.unmount());
  container.remove();
});
