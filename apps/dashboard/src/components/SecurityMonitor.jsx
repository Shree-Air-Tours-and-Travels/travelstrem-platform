import { useEffect } from "react";
import { auditLog_event, detectScriptInjection } from "../services/security";

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
            if (["script", "iframe", "object", "embed", "form"].includes(tag)) {
              auditLog_event("dangerous_dom_node_added", { tag, outerHTML: node.outerHTML?.slice(0, 100) });
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
