import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top on route change, but not on refresh of the same page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // if pathname changed due to navigation, scroll to top
    // skip the very first mount (which happens on refresh or direct load)
    let firstLoad = sessionStorage.getItem("scroll_init");
    if (firstLoad) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // mark first render as done
      sessionStorage.setItem("scroll_init", "true");
    }
  }, [pathname]);

  return null;
}
