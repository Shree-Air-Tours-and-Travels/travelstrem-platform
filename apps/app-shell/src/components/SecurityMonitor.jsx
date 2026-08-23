import { useEffect } from "react";
import { auditLog_event, detectScriptInjection } from "../services/security";

const configuredScriptOrigins = [
  process.env.REACT_APP_TREVISTA_REMOTE_ENTRY,
  process.env.REACT_APP_TREVISTA_URL,
].flatMap((value) => {
  if (!value) return [];
  try {
    return [new URL(value, window.location.origin).origin];
  } catch {
    return [];
  }
});

const isTrustedRuntimeScript = (node) => {
  const source = node?.getAttribute?.("src");
  if (!source) return false;
  try {
    const url = new URL(source, window.location.origin);
    return (
      url.origin === window.location.origin ||
      configuredScriptOrigins.includes(url.origin) ||
      (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))
    );
  } catch {
    return false;
  }
};

/**
 * SecurityMonitor - runs security checks on mount and listens for threats.
 * Place inside the DashboardProvider to activate.
 */
export default function SecurityMonitor({ children }) {
  useEffect(() => {
    // Log security initialization
    auditLog_event("security_monitor_initialized", {
      url: window.location.href,
      userAgent: navigator.userAgent?.slice(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Detect URL tampering
    const url = window.location.href;
    if (detectScriptInjection(url)) {
      auditLog_event("url_injection_detected", { url: url.slice(0, 200) });
      window.history.replaceState({}, "", "/");
    }

    // Monitor for DOM-based XSS via MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const tag = node.tagName?.toLowerCase();
            if (tag === "script" && isTrustedRuntimeScript(node)) {
              continue;
            }
            // Forms are first-class application UI and must not be treated as
            // executable DOM. Blocking every dynamically mounted <form>
            // removes React forms rendered through portals (including enquiry
            // and login modals) immediately after React commits them.
            if (["script", "iframe", "object", "embed"].includes(tag)) {
              auditLog_event("dangerous_dom_node_added", {
                tag,
                outerHTML: node.outerHTML?.slice(0, 100),
              });
              node.remove?.();
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return children;
}
